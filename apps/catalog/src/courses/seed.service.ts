import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TEST_INSTRUCTOR } from '@learn-flow/contracts';
import { Course, CourseDocument } from './schemas/course.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';

/**
 * Demo data. The first two courses come pre-enrolled — including a student
 * whose address contains "fail" — so adding a lesson immediately demos the
 * notification flow (successes, retries, and the instructor summary).
 */
const SEED_COURSES = [
  {
    title: 'NestJS Microservices in Practice',
    description:
      'Design event-driven services with NestJS, RabbitMQ, and independent data stores.',
    price: 49.99,
    enrolledStudentEmails: [
      'alice@test.local',
      'bob@test.local',
      'fail.student@test.local',
    ],
    lessons: [
      { title: 'Why microservices?', order: 1 },
      { title: 'RabbitMQ transport deep-dive', order: 2 },
    ],
  },
  {
    title: 'RabbitMQ Fundamentals',
    description: 'Queues, exchanges, acknowledgements, and delivery guarantees.',
    price: 29.99,
    enrolledStudentEmails: ['alice@test.local'],
    lessons: [{ title: 'AMQP in 30 minutes', order: 1 }],
  },
  {
    title: 'React for Backend Developers',
    description: 'Just enough React to ship a frontend for your APIs.',
    price: 19.99,
    enrolledStudentEmails: [],
    lessons: [{ title: 'Components and props', order: 1 }],
  },
  {
    title: 'PostgreSQL Data Modeling',
    description: 'Schema design, constraints, and transactions that scale.',
    price: 39.99,
    enrolledStudentEmails: [],
    lessons: [],
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
  ) {}

  async seed() {
    const existing = await this.courseModel.countDocuments().exec();
    if (existing > 0) {
      return { seeded: false, reason: `${existing} courses already present` };
    }

    for (const { lessons, ...courseData } of SEED_COURSES) {
      const course = await this.courseModel.create({
        ...courseData,
        instructorId: TEST_INSTRUCTOR.id,
        instructorEmail: TEST_INSTRUCTOR.email,
      });
      // Seed lessons directly — no lecture.created events for seed data.
      for (const lesson of lessons) {
        await this.lessonModel.create({
          ...lesson,
          content: `Seed content for "${lesson.title}".`,
          courseId: course._id,
        });
      }
    }
    this.logger.log(`Seeded ${SEED_COURSES.length} courses`);
    return { seeded: true, courses: SEED_COURSES.length };
  }
}
