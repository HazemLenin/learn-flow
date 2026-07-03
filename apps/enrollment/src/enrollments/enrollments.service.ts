import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EVENTS, PaymentCompletedEvent } from '@learn-flow/contracts';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { MockPaymentService } from './mock-payment.service';
import { CATALOG_CLIENT } from './constants';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    private readonly mockPayment: MockPaymentService,
    @Inject(CATALOG_CLIENT) private readonly catalogClient: ClientProxy,
  ) {}

  /**
   * Buy a course: pending enrollment → mock payment → active/failed.
   * Payment is processed synchronously so the caller gets the final
   * status in one request; the async story lives in the RabbitMQ flows.
   */
  async enroll(dto: CreateEnrollmentDto): Promise<Enrollment> {
    // A failed enrollment must not block another attempt.
    const existing = await this.enrollments.findOne({
      where: {
        userId: dto.userId,
        courseId: dto.courseId,
        status: Not(EnrollmentStatus.FAILED),
      },
    });
    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} already has an ${existing.status} enrollment for course ${dto.courseId}`,
      );
    }

    const enrollment = await this.enrollments.save(
      this.enrollments.create({
        userId: dto.userId,
        userEmail: dto.userEmail,
        courseId: dto.courseId,
        status: EnrollmentStatus.PENDING,
      }),
    );

    const result = await this.mockPayment.charge(
      dto.amount,
      dto.simulateFailure,
    );

    await this.payments.save(
      this.payments.create({
        enrollment,
        amount: dto.amount.toFixed(2),
        status: result.success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      }),
    );

    enrollment.status = result.success
      ? EnrollmentStatus.ACTIVE
      : EnrollmentStatus.FAILED;
    await this.enrollments.save(enrollment);

    if (result.success) {
      const event: PaymentCompletedEvent = {
        userId: enrollment.userId,
        userEmail: enrollment.userEmail,
        courseId: enrollment.courseId,
        enrollmentId: enrollment.id,
      };
      this.catalogClient.emit(EVENTS.PAYMENT_COMPLETED, event);
      this.logger.log(
        `Published ${EVENTS.PAYMENT_COMPLETED} for enrollment ${enrollment.id}`,
      );
    }

    return enrollment;
  }

  findByUser(userId: string): Promise<Enrollment[]> {
    return this.enrollments.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
