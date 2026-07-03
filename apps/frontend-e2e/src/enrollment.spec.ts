import { expect, test } from '@playwright/test';
import { createCourse } from './helpers';

test.describe('enrollment and mock payment', () => {
  test('buying a course succeeds and the catalog counts the student', async ({
    page,
    request,
  }) => {
    const course = await createCourse(request);
    await page.goto(`/courses/${course.id}`);

    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enrolled-state')).toContainText('Enrolled', {
      timeout: 15_000,
    });

    // payment.completed consumed by catalog → enrolled count reaches 1
    await expect(async () => {
      await page.reload();
      await expect(page.getByText('1 enrolled')).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    // and it appears under my enrollments as active
    await page.goto('/my-enrollments');
    const row = page
      .getByTestId('enrollment-list')
      .locator('li', { hasText: course.title });
    await expect(row).toContainText('active');
  });

  test('a simulated decline marks the enrollment failed and allows retry', async ({
    page,
    request,
  }) => {
    const course = await createCourse(request);
    await page.goto(`/courses/${course.id}`);

    await page.getByTestId('simulate-failure').check();
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('payment-declined')).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/my-enrollments');
    const failedRow = page
      .getByTestId('enrollment-list')
      .locator('li', { hasText: course.title });
    await expect(failedRow).toContainText('failed');

    // failed never blocks retrying
    await page.goto(`/courses/${course.id}`);
    await page.getByTestId('simulate-failure').uncheck();
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enrolled-state')).toContainText('Enrolled', {
      timeout: 15_000,
    });
  });

  test('an enrolled course shows the enrolled state instead of a buy button', async ({
    page,
    request,
  }) => {
    const course = await createCourse(request);
    await page.goto(`/courses/${course.id}`);
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enrolled-state')).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await expect(page.getByTestId('enrolled-state')).toBeVisible();
    await expect(page.getByTestId('enroll-button')).toHaveCount(0);
  });
});
