import { Test } from '@nestjs/testing';
import { LectureCreatedEvent } from '@learn-flow/contracts';
import { NotificationsService } from './notifications.service';
import { MockEmailService } from './mock-email.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let emailService: MockEmailService;
  let sendSpy: jest.SpyInstance;

  const event: LectureCreatedEvent = {
    lectureId: 'lesson-1',
    courseId: 'course-1',
    courseTitle: 'NestJS Microservices',
    lectureTitle: 'New lecture',
    instructorId: 'instructor-1',
    instructorEmail: 'instructor@test.local',
    studentEmails: ['alice@test.local', 'bob@test.local'],
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService, MockEmailService],
    }).compile();
    service = moduleRef.get(NotificationsService);
    emailService = moduleRef.get(MockEmailService);
    sendSpy = jest.spyOn(emailService, 'send');
  });

  afterEach(() => jest.useRealTimers());

  /** Runs the handler while auto-advancing fake timers past backoff sleeps. */
  const run = async (e: LectureCreatedEvent) => {
    const promise = service.handleLectureCreated(e);
    await jest.runAllTimersAsync();
    return promise;
  };

  it('emails every student once when all sends succeed, no instructor summary', async () => {
    await run(event);

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).not.toHaveBeenCalledWith(
      'instructor@test.local',
      expect.anything(),
      expect.anything(),
    );
    expect(service.getLog()).toHaveLength(2);
    expect(service.getLog().every((e) => e.status === 'sent')).toBe(true);
  });

  it('retries a failing student 3 times, then sends ONE instructor summary', async () => {
    await run({
      ...event,
      studentEmails: [
        'alice@test.local',
        'fail.student@test.local',
        'bob@test.local',
      ],
    });

    const failCalls = sendSpy.mock.calls.filter(
      ([to]) => to === 'fail.student@test.local',
    );
    expect(failCalls).toHaveLength(3); // exhausted retries

    const instructorCalls = sendSpy.mock.calls.filter(
      ([to]) => to === 'instructor@test.local',
    );
    expect(instructorCalls).toHaveLength(1); // exactly one summary
    expect(instructorCalls[0][2]).toContain('fail.student@test.local');

    const log = service.getLog();
    const failedEntry = log.find(
      (e) => e.recipient === 'fail.student@test.local',
    );
    expect(failedEntry).toMatchObject({ status: 'failed', attempts: 3 });
    // Successful students are unaffected by the failure.
    expect(
      log.filter((e) => e.status === 'sent').map((e) => e.recipient),
    ).toEqual(
      expect.arrayContaining([
        'alice@test.local',
        'bob@test.local',
        'instructor@test.local',
      ]),
    );
  });

  it('summarizes multiple failures in a single instructor email', async () => {
    await run({
      ...event,
      studentEmails: ['fail.a@test.local', 'fail.b@test.local'],
    });

    const instructorCalls = sendSpy.mock.calls.filter(
      ([to]) => to === 'instructor@test.local',
    );
    expect(instructorCalls).toHaveLength(1);
    expect(instructorCalls[0][2]).toContain('2 student(s)');
    expect(instructorCalls[0][2]).toContain('fail.a@test.local');
    expect(instructorCalls[0][2]).toContain('fail.b@test.local');
  });

  it('handles an event with no enrolled students without sending anything', async () => {
    await run({ ...event, studentEmails: [] });
    expect(sendSpy).not.toHaveBeenCalled();
    expect(service.getLog()).toHaveLength(0);
  });

  it('logs (but does not throw) when the instructor summary itself fails', async () => {
    await expect(
      run({
        ...event,
        instructorEmail: 'fail.instructor@test.local',
        studentEmails: ['fail.student@test.local'],
      }),
    ).resolves.toBeUndefined();

    const summaryEntry = service
      .getLog()
      .find((e) => e.recipient === 'fail.instructor@test.local');
    expect(summaryEntry?.status).toBe('failed');
  });
});
