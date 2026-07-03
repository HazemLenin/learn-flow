/**
 * Shared event contracts, queue names, and test fixtures for all services.
 */

// ─── RabbitMQ topology ──────────────────────────────────────────────────────

export const QUEUES = {
  /** Consumed by Catalog (payment.completed) */
  CATALOG: 'catalog_queue',
  /** Consumed by Notification (lecture.created) */
  NOTIFICATION: 'notification_queue',
} as const;

export const EVENTS = {
  LECTURE_CREATED: 'lecture.created',
  PAYMENT_COMPLETED: 'payment.completed',
} as const;

// ─── Event payloads ─────────────────────────────────────────────────────────

/** Published by Catalog when a lesson is added; consumed by Notification. */
export interface LectureCreatedEvent {
  lectureId: string;
  courseId: string;
  courseTitle: string;
  lectureTitle: string;
  instructorId: string;
  instructorEmail: string;
  studentEmails: string[];
}

/** Published by Enrollment on successful payment; consumed by Catalog. */
export interface PaymentCompletedEvent {
  userId: string;
  userEmail: string;
  courseId: string;
  enrollmentId: string;
}

// ─── Fixed demo identities (no auth in this demo) ───────────────────────────

export const TEST_USER = {
  id: 'user-1',
  email: 'test.user@test.local',
} as const;

export const TEST_INSTRUCTOR = {
  id: 'instructor-1',
  email: 'instructor@test.local',
} as const;
