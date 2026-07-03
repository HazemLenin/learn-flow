import { Injectable, Logger } from '@nestjs/common';
import { LectureCreatedEvent } from '@learn-flow/contracts';
import { MockEmailService } from './mock-email.service';
import { withRetry } from './retry';

export interface NotificationLogEntry {
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  attempts: number;
  error?: string;
  lectureId: string;
  courseTitle: string;
  timestamp: string;
}

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1_000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** In-memory log — enough for a demo, exposed via GET /notifications. */
  private readonly log: NotificationLogEntry[] = [];

  constructor(private readonly emailService: MockEmailService) {}

  getLog(): NotificationLogEntry[] {
    return this.log;
  }

  /**
   * Notifies every enrolled student about the new lecture, retrying each
   * send up to MAX_ATTEMPTS with exponential backoff. If any student
   * ultimately fails, the instructor gets ONE summary email covering all
   * failures — never one email per failure.
   */
  async handleLectureCreated(event: LectureCreatedEvent): Promise<void> {
    const subject = `New lecture in ${event.courseTitle}`;
    const body = `"${event.lectureTitle}" was just published.`;
    const failed: string[] = [];

    for (const email of event.studentEmails) {
      let attempts = 0;
      try {
        await withRetry(
          () => {
            attempts++;
            return this.emailService.send(email, subject, body);
          },
          { maxAttempts: MAX_ATTEMPTS, baseDelayMs: BASE_DELAY_MS },
        );
        this.pushLog(event, email, subject, 'sent', attempts);
      } catch (error) {
        failed.push(email);
        this.pushLog(event, email, subject, 'failed', attempts, error);
        this.logger.warn(
          `Giving up on ${email} after ${attempts} attempts`,
        );
      }
    }

    if (failed.length > 0) {
      const summarySubject = `Delivery failures for "${event.lectureTitle}"`;
      const summaryBody = `Could not notify ${failed.length} student(s): ${failed.join(', ')}`;
      // The instructor summary itself is not retried — if it fails it is
      // only logged; a real system would push it to a dead-letter flow.
      try {
        await this.emailService.send(
          event.instructorEmail,
          summarySubject,
          summaryBody,
        );
        this.pushLog(event, event.instructorEmail, summarySubject, 'sent', 1);
      } catch (error) {
        this.pushLog(
          event,
          event.instructorEmail,
          summarySubject,
          'failed',
          1,
          error,
        );
      }
    }
  }

  private pushLog(
    event: LectureCreatedEvent,
    recipient: string,
    subject: string,
    status: 'sent' | 'failed',
    attempts: number,
    error?: unknown,
  ) {
    this.log.push({
      recipient,
      subject,
      status,
      attempts,
      error: error instanceof Error ? error.message : undefined,
      lectureId: event.lectureId,
      courseTitle: event.courseTitle,
      timestamp: new Date().toISOString(),
    });
  }
}
