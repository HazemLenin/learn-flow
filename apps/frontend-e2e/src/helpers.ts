import type { APIRequestContext } from '@playwright/test';

export const CATALOG = process.env['CATALOG_URL'] ?? 'http://localhost:3001';
export const ENROLLMENT =
  process.env['ENROLLMENT_URL'] ?? 'http://localhost:3002';
export const NOTIFICATION =
  process.env['NOTIFICATION_URL'] ?? 'http://localhost:3003';

/** Creates a fresh course via the API so each test owns its state. */
export async function createCourse(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
) {
  const res = await request.post(`${CATALOG}/api/courses`, {
    data: {
      title: `E2E Course ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: 'Created by the Playwright suite.',
      price: 25,
      instructorId: 'instructor-1',
      instructorEmail: 'instructor@test.local',
      ...overrides,
    },
  });
  if (!res.ok()) throw new Error(`createCourse failed: ${res.status()}`);
  const course = await res.json();
  return { id: course._id ?? course.id, title: course.title as string };
}
