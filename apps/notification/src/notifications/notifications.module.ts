import { Module } from '@nestjs/common';
import { LectureEventsController } from './lecture-events.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MockEmailService } from './mock-email.service';

@Module({
  controllers: [LectureEventsController, NotificationsController],
  providers: [NotificationsService, MockEmailService],
})
export class NotificationsModule {}
