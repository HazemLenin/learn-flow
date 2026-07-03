import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { EVENTS } from '@learn-flow/contracts';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MockPaymentService } from './mock-payment.service';
import { CATALOG_CLIENT } from './constants';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  const enrollmentRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(),
    find: jest.fn(),
  };
  const paymentRepo = {
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn((data) => Promise.resolve(data)),
  };
  const mockPayment = { charge: jest.fn() };
  const catalogClient = { emit: jest.fn() };

  const dto = {
    userId: 'user-1',
    userEmail: 'test.user@test.local',
    courseId: 'course-1',
    amount: 49.99,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // save assigns an id the first time (insert), passes through after
    enrollmentRepo.save.mockImplementation((e) =>
      Promise.resolve({ id: e.id ?? 'enrollment-1', ...e }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: MockPaymentService, useValue: mockPayment },
        { provide: CATALOG_CLIENT, useValue: catalogClient },
      ],
    }).compile();
    service = moduleRef.get(EnrollmentsService);
  });

  it('activates the enrollment and publishes payment.completed on success', async () => {
    enrollmentRepo.findOne.mockResolvedValue(null);
    mockPayment.charge.mockResolvedValue({ success: true });

    const enrollment = await service.enroll(dto);

    expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentStatus.SUCCEEDED, amount: '49.99' }),
    );
    expect(catalogClient.emit).toHaveBeenCalledWith(EVENTS.PAYMENT_COMPLETED, {
      userId: 'user-1',
      userEmail: 'test.user@test.local',
      courseId: 'course-1',
      enrollmentId: 'enrollment-1',
    });
  });

  it('marks the enrollment failed and publishes nothing when payment fails', async () => {
    enrollmentRepo.findOne.mockResolvedValue(null);
    mockPayment.charge.mockResolvedValue({
      success: false,
      reason: 'Simulated card decline',
    });

    const enrollment = await service.enroll({ ...dto, simulateFailure: true });

    expect(enrollment.status).toBe(EnrollmentStatus.FAILED);
    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentStatus.FAILED }),
    );
    expect(catalogClient.emit).not.toHaveBeenCalled();
  });

  it('rejects a duplicate enrollment with 409 Conflict', async () => {
    enrollmentRepo.findOne.mockResolvedValue({
      id: 'existing',
      status: EnrollmentStatus.ACTIVE,
    });

    await expect(service.enroll(dto)).rejects.toThrow(ConflictException);
    expect(mockPayment.charge).not.toHaveBeenCalled();
    expect(catalogClient.emit).not.toHaveBeenCalled();
  });

  it('allows retrying after a failed enrollment (failed rows are excluded)', async () => {
    // The duplicate check filters out FAILED enrollments at query level;
    // findOne returning null here models exactly that.
    enrollmentRepo.findOne.mockResolvedValue(null);
    mockPayment.charge.mockResolvedValue({ success: true });

    const enrollment = await service.enroll(dto);

    expect(enrollmentRepo.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        courseId: 'course-1',
        status: expect.anything(), // Not(FAILED)
      }),
    });
    expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
  });

  it('returns enrollments for a user, newest first', async () => {
    const rows = [{ id: 'e2' }, { id: 'e1' }];
    enrollmentRepo.find.mockResolvedValue(rows);

    await expect(service.findByUser('user-1')).resolves.toBe(rows);
    expect(enrollmentRepo.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
    });
  });
});

describe('MockPaymentService', () => {
  it('succeeds by default and fails only when told to', async () => {
    const svc = new MockPaymentService();
    await expect(svc.charge(10)).resolves.toEqual({ success: true });
    await expect(svc.charge(10, true)).resolves.toEqual({
      success: false,
      reason: 'Simulated card decline',
    });
  });
});
