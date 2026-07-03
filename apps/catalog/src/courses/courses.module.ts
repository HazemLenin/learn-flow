import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { QUEUES } from '@learn-flow/contracts';
import { Course, CourseSchema } from './schemas/course.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { PaymentEventsController } from './payment-events.controller';
import { SeedService } from './seed.service';
import { NOTIFICATION_CLIENT } from './constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
    // Publisher: lecture.created events go to the notification queue.
    ClientsModule.register([
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
          ],
          queue: QUEUES.NOTIFICATION,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [CoursesController, PaymentEventsController],
  providers: [CoursesService, SeedService],
})
export class CoursesModule {}
