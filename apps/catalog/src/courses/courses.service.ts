import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EVENTS,
  LectureCreatedEvent,
  PaymentCompletedEvent,
} from '@learn-flow/contracts';
import { Course, CourseDocument } from './schemas/course.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { NOTIFICATION_CLIENT } from './constants';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationClient: ClientProxy,
  ) {}

  createCourse(dto: CreateCourseDto): Promise<CourseDocument> {
    return this.courseModel.create(dto);
  }

  findAllCourses(): Promise<CourseDocument[]> {
    return this.courseModel.find().sort({ createdAt: 1 }).exec();
  }

  async findCourseById(id: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(id).exec();
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  findLessonsByCourse(courseId: string): Promise<LessonDocument[]> {
    return this.lessonModel.find({ courseId }).sort({ order: 1 }).exec();
  }

  /**
   * Creates a lesson and publishes lecture.created, carrying the enrolled
   * student emails so the Notification service needs no sync callback.
   */
  async addLesson(
    courseId: string,
    dto: CreateLessonDto,
  ): Promise<LessonDocument> {
    const course = await this.findCourseById(courseId);
    const lesson = await this.lessonModel.create({ ...dto, courseId });

    const event: LectureCreatedEvent = {
      lectureId: lesson._id.toString(),
      courseId: course._id.toString(),
      courseTitle: course.title,
      lectureTitle: lesson.title,
      instructorId: course.instructorId,
      instructorEmail: course.instructorEmail,
      studentEmails: course.enrolledStudentEmails,
    };
    this.notificationClient.emit(EVENTS.LECTURE_CREATED, event);
    this.logger.log(
      `Published ${EVENTS.LECTURE_CREATED} for lesson "${lesson.title}" (${event.studentEmails.length} students)`,
    );
    return lesson;
  }

  /**
   * payment.completed handler. Idempotent: $addToSet ignores redelivered
   * events, and enrolledCount is derived from the array length.
   */
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const result = await this.courseModel
      .updateOne(
        { _id: event.courseId },
        { $addToSet: { enrolledStudentEmails: event.userEmail } },
      )
      .exec();
    if (result.matchedCount === 0) {
      this.logger.warn(
        `payment.completed for unknown course ${event.courseId}`,
      );
      return;
    }
    this.logger.log(
      `Enrolled ${event.userEmail} in course ${event.courseId} (enrollment ${event.enrollmentId})`,
    );
  }
}
