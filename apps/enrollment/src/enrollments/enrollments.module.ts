import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUES } from '@learn-flow/contracts';
import { Enrollment } from './entities/enrollment.entity';
import { Payment } from './entities/payment.entity';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { MockPaymentService } from './mock-payment.service';
import { CATALOG_CLIENT } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Payment]),
    // Publisher: payment.completed events go to the catalog queue.
    ClientsModule.register([
      {
        name: CATALOG_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
          ],
          queue: QUEUES.CATALOG,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, MockPaymentService],
})
export class EnrollmentsModule {}
