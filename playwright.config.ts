import { defineConfig, devices } from '@playwright/test';
import { env, STORAGE_STATE } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.ci,
  // One retry in CI only to record a trace and tell flaky from broken; a test that passes only on retry still fails the run.
  retries: env.ci ? 1 : 0,
  failOnFlakyTests: env.ci,
  workers: env.ci ? 2 : undefined,
  reporter: env.ci
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    testIdAttribute: 'data-test',
    // CI: trace of the retry; locally there are no retries, so keep the trace of a failed run.
    trace: env.ci ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: env.baseUrl },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], baseURL: env.baseUrl, storageState: STORAGE_STATE },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiUrl, extraHTTPHeaders: { Accept: 'application/json' } },
    },
  ],
});
