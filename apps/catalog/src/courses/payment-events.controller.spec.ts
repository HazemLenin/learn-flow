import { Test } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { PaymentEventsController } from './payment-events.controller';
import { CoursesService } from './courses.service';

describe('PaymentEventsController', () => {
  let controller: PaymentEventsController;
  const coursesService = { handlePaymentCompleted: jest.fn() };
  const channel = { ack: jest.fn(), nack: jest.fn() };
  const message = {};
  const context = {
    getChannelRef: () => channel,
    getMessage: () => message,
  } as unknown as RmqContext;

  const event = {
    userId: 'user-1',
    userEmail: 'test.user@test.local',
    courseId: 'course-1',
    enrollmentId: 'enrollment-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentEventsController],
      providers: [{ provide: CoursesService, useValue: coursesService }],
    }).compile();
    controller = moduleRef.get(PaymentEventsController);
  });

  it('acks the message after successful handling', async () => {
    coursesService.handlePaymentCompleted.mockResolvedValue(undefined);
    await controller.onPaymentCompleted(event, context);
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('nacks with requeue when handling fails', async () => {
    coursesService.handlePaymentCompleted.mockRejectedValue(new Error('mongo down'));
    await controller.onPaymentCompleted(event, context);
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
