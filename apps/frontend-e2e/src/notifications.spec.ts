import { expect, test } from '@playwright/test';
import { CATALOG } from './helpers';

/**
 * The full lecture.created flow against the real stack: publish a lesson on
 * the seeded course (pre-enrolled with alice, bob, and fail.student), then
 * watch the delivery feed show the fan-out, the exhausted retries, and the
 * single instructor summary.
 */
test.describe('lecture.created → delivery feed', () => {
  test('publishing a lesson notifies students, retries failures, and summarizes to the instructor', async ({
    page,
    request,
  }) => {
    await request.post(`${CATALOG}/api/courses/seed`);
    const courses = await (await request.get(`${CATALOG}/api/courses`)).json();
    const seeded = courses.find((c: { enrolledStudentEmails: string[] }) =>
      c.enrolledStudentEmails.includes('fail.student@test.local'),
    );
    expect(seeded, 'seeded course with fail.student must exist').toBeTruthy();

    const lessonTitle = `Playwright lecture ${Date.now()}`;
    await page.goto(`/courses/${seeded.id}`);
    await page.getByTestId('lesson-title').fill(lessonTitle);
    await page
      .getByTestId('lesson-content')
      .fill('Published by the e2e suite to exercise the notification flow.');
    await page.getByTestId('publish-lesson').click();

    // The new lesson renders in the list
    await expect(page.getByTestId('lesson-list')).toContainText(lessonTitle, {
      timeout: 10_000,
    });

    // Feed: retries take ~3s (1s+2s backoff) plus queue latency.
    await page.goto('/notifications');
    const feed = page.getByTestId('delivery-feed');
    const subject = `New lecture in ${seeded.title}`;

    const rowFor = (recipient: string) =>
      feed.locator('tr', { hasText: recipient }).filter({ hasText: subject });

    await expect(rowFor('alice@test.local').first()).toContainText('✓ sent', {
      timeout: 30_000,
    });
    await expect(rowFor('bob@test.local').first()).toContainText('✓ sent');

    const failedRow = rowFor('fail.student@test.local').first();
    await expect(failedRow).toContainText('✗ failed', { timeout: 30_000 });
    await expect(failedRow).toContainText('3/3');

    // Exactly one instructor summary for this lecture
    const summaryRows = feed.locator('tr', {
      hasText: `Delivery failures for "${lessonTitle}"`,
    });
    await expect(summaryRows).toHaveCount(1, { timeout: 30_000 });
    await expect(summaryRows.first()).toContainText('instructor@test.local');
    await expect(summaryRows.first()).toContainText('✓ sent');
  });
});
