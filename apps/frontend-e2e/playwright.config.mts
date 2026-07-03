import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * These tests exercise the REAL stack: docker compose infra plus the
 * catalog/enrollment/notification services must be running (see README).
 * Only the frontend dev server is started automatically.
 */
export default defineConfig({
  testDir: './src',
  outputDir: './test-output',
  // Enrollment/payment state is shared backend state — run serially.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx run frontend:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    cwd: '../..',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
