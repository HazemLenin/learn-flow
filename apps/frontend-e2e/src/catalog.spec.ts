import { expect, test } from '@playwright/test';
import { CATALOG, createCourse } from './helpers';

test.describe('catalog', () => {
  test.beforeAll(async ({ request }) => {
    // Idempotent: no-op when courses already exist.
    await request.post(`${CATALOG}/api/courses/seed`);
  });

  test('lists courses with price and enrolled count', async ({ page }) => {
    await page.goto('/');
    const rows = page.getByTestId('course-list').locator('li');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    await expect(rows.first()).toContainText('$');
  });

  test('navigates to a course detail with lessons and buy box', async ({
    page,
    request,
  }) => {
    const course = await createCourse(request);
    await page.goto('/');
    await page.getByRole('link', { name: new RegExp(course.title) }).click();
    await expect(page.getByRole('heading', { name: course.title })).toBeVisible();
    await expect(page.getByTestId('enroll-button')).toBeVisible();
    await expect(page.getByText('No lessons yet')).toBeVisible();
  });

  test('top navigation reaches all four screens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'My enrollments' }).click();
    await expect(
      page.getByRole('heading', { name: 'My enrollments' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Delivery feed' }).click();
    await expect(
      page.getByRole('heading', { name: 'Delivery feed' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Courses', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
  });
});
