import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EVENTS, PaymentCompletedEvent } from '@learn-flow/contracts';
import { CoursesService } from './courses.service';

@Controller()
export class PaymentEventsController {
  private readonly logger = new Logger(PaymentEventsController.name);

  constructor(private readonly coursesService: CoursesService) {}

  @EventPattern(EVENTS.PAYMENT_COMPLETED)
  async onPaymentCompleted(
    @Payload() event: PaymentCompletedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.coursesService.handlePaymentCompleted(event);
      channel.ack(message);
    } catch (error) {
      // Requeue once things recover; the handler is idempotent so
      // redelivery is safe.
      this.logger.error(`Failed to handle ${EVENTS.PAYMENT_COMPLETED}`, error);
      channel.nack(message, false, true);
    }
  }
}
