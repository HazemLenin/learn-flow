import type {
  Course,
  CourseWithLessons,
  Enrollment,
  NotificationEntry,
} from './types';

const CATALOG = import.meta.env.VITE_CATALOG_URL ?? 'http://localhost:3001';
const ENROLLMENT = import.meta.env.VITE_ENROLLMENT_URL ?? 'http://localhost:3002';
const NOTIFICATION =
  import.meta.env.VITE_NOTIFICATION_URL ?? 'http://localhost:3003';

/** Fixed demo identity — mirrors TEST_USER in @learn-flow/contracts. */
export const TEST_USER = {
  id: 'user-1',
  email: 'test.user@test.local',
} as const;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? message);
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export const api = {
  courses: () => request<Course[]>(`${CATALOG}/api/courses`),

  course: (id: string) =>
    request<CourseWithLessons>(`${CATALOG}/api/courses/${id}`),

  seed: () => request(`${CATALOG}/api/courses/seed`, { method: 'POST' }),

  addLesson: (
    courseId: string,
    lesson: { title: string; content: string; order: number },
  ) =>
    request(`${CATALOG}/api/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lesson),
    }),

  enroll: (input: {
    courseId: string;
    amount: number;
    simulateFailure: boolean;
  }) =>
    request<Enrollment>(`${ENROLLMENT}/api/enrollments`, {
      method: 'POST',
      body: JSON.stringify({
        userId: TEST_USER.id,
        userEmail: TEST_USER.email,
        ...input,
      }),
    }),

  enrollments: () =>
    request<Enrollment[]>(
      `${ENROLLMENT}/api/enrollments?userId=${TEST_USER.id}`,
    ),

  notifications: () =>
    request<NotificationEntry[]>(`${NOTIFICATION}/api/notifications`),
};
