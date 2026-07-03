import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { EVENTS } from '@learn-flow/contracts';
import { CoursesService } from './courses.service';
import { Course } from './schemas/course.schema';
import { Lesson } from './schemas/lesson.schema';
import { NOTIFICATION_CLIENT } from './constants';

describe('CoursesService', () => {
  let service: CoursesService;

  const courseModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };
  const lessonModel = {
    create: jest.fn(),
    find: jest.fn(),
  };
  const notificationClient = { emit: jest.fn() };

  const mockCourse = {
    _id: { toString: () => 'course-1' },
    title: 'NestJS Microservices',
    instructorId: 'instructor-1',
    instructorEmail: 'instructor@test.local',
    enrolledStudentEmails: ['alice@test.local', 'bob@test.local'],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getModelToken(Course.name), useValue: courseModel },
        { provide: getModelToken(Lesson.name), useValue: lessonModel },
        { provide: NOTIFICATION_CLIENT, useValue: notificationClient },
      ],
    }).compile();
    service = moduleRef.get(CoursesService);
  });

  describe('findCourseById', () => {
    it('throws NotFoundException for a missing course', async () => {
      courseModel.findById.mockReturnValue({
        exec: () => Promise.resolve(null),
      });
      await expect(service.findCourseById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addLesson', () => {
    it('creates the lesson and publishes lecture.created with enrolled students', async () => {
      courseModel.findById.mockReturnValue({
        exec: () => Promise.resolve(mockCourse),
      });
      const createdLesson = {
        _id: { toString: () => 'lesson-1' },
        title: 'New lecture',
      };
      lessonModel.create.mockResolvedValue(createdLesson);

      const lesson = await service.addLesson('course-1', {
        title: 'New lecture',
        content: 'body',
        order: 1,
      });

      expect(lesson).toBe(createdLesson);
      expect(notificationClient.emit).toHaveBeenCalledWith(
        EVENTS.LECTURE_CREATED,
        {
          lectureId: 'lesson-1',
          courseId: 'course-1',
          courseTitle: 'NestJS Microservices',
          lectureTitle: 'New lecture',
          instructorId: 'instructor-1',
          instructorEmail: 'instructor@test.local',
          studentEmails: ['alice@test.local', 'bob@test.local'],
        },
      );
    });

    it('does not create a lesson when the course is missing', async () => {
      courseModel.findById.mockReturnValue({
        exec: () => Promise.resolve(null),
      });
      await expect(
        service.addLesson('missing', { title: 't', content: 'c', order: 1 }),
      ).rejects.toThrow(NotFoundException);
      expect(lessonModel.create).not.toHaveBeenCalled();
      expect(notificationClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentCompleted', () => {
    const event = {
      userId: 'user-1',
      userEmail: 'test.user@test.local',
      courseId: 'course-1',
      enrollmentId: 'enrollment-1',
    };

    it('adds the student email via $addToSet (idempotent on redelivery)', async () => {
      courseModel.updateOne.mockReturnValue({
        exec: () => Promise.resolve({ matchedCount: 1, modifiedCount: 1 }),
      });

      await service.handlePaymentCompleted(event);
      // Simulate an event redelivery — same update, no error, no duplicate
      // because $addToSet is a no-op the second time.
      courseModel.updateOne.mockReturnValue({
        exec: () => Promise.resolve({ matchedCount: 1, modifiedCount: 0 }),
      });
      await service.handlePaymentCompleted(event);

      expect(courseModel.updateOne).toHaveBeenCalledTimes(2);
      expect(courseModel.updateOne).toHaveBeenCalledWith(
        { _id: 'course-1' },
        { $addToSet: { enrolledStudentEmails: 'test.user@test.local' } },
      );
    });

    it('ignores events for unknown courses without throwing', async () => {
      courseModel.updateOne.mockReturnValue({
        exec: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
      });
      await expect(service.handlePaymentCompleted(event)).resolves.toBeUndefined();
    });
  });
});
