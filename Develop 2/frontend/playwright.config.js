import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    // Set BASE_URL to your Amplify URL before running:
    // BASE_URL=https://main.d1234.amplifyapp.com npm run test:e2e
    baseURL: process.env.BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
});
