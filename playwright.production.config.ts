import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/production-*.spec.ts',
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Run tests sequentially for production
  forbidOnly: true,
  retries: 1,
  workers: 1, // Single worker for production tests
  reporter: [
    ['html', { outputFolder: 'production-test-report' }],
    ['list'],
    ['json', { outputFile: 'production-test-results.json' }]
  ],
  use: {
    baseURL: 'https://texas-tailgaters.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  outputDir: 'production-test-results/',
});