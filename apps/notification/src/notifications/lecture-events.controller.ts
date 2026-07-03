import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EVENTS, LectureCreatedEvent } from '@learn-flow/contracts';
import { NotificationsService } from './notifications.service';

@Controller()
export class LectureEventsController {
  private readonly logger = new Logger(LectureEventsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(EVENTS.LECTURE_CREATED)
  async onLectureCreated(
    @Payload() event: LectureCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.notificationsService.handleLectureCreated(event);
      // Ack only after the whole batch (students + instructor summary):
      // a crash mid-batch replays the message (at-least-once delivery).
      channel.ack(message);
    } catch (error) {
      this.logger.error(`Failed to handle ${EVENTS.LECTURE_CREATED}`, error);
      channel.nack(message, false, true);
    }
  }
}
