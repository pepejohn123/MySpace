import { test, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

test.beforeAll(() => {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Set TEST_USERNAME and TEST_PASSWORD before running e2e tests.\n' +
      'Example: TEST_USERNAME=admin@example.com TEST_PASSWORD=secret npm run test:e2e',
    );
  }
});

test('admin: login → Historial tab → logout', async ({ page }) => {
  // ── 1. Login ────────────────────────────────────────────────
  await page.goto('/pages/login/Login.html');
  await page.fill('#emailInput', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to the admin dashboard after successful auth
  await page.waitForURL('**/Admin.html', { timeout: 15_000 });

  // ── 2. Click the "Historial" tab ────────────────────────────
  await page.click('button.nav-tab:has-text("Historial")');

  // Verify the history section becomes visible
  const historialSection = page.locator('#tickets-history-wrapper');
  await expect(historialSection).toBeVisible();

  // ── 3. Logout ───────────────────────────────────────────────
  await page.click('#logout-btn');

  // Verify redirect back to login
  await page.waitForURL('**/Login.html', { timeout: 10_000 });
  await expect(page.locator('#loginForm')).toBeVisible();
});
