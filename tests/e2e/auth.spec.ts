import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test-user@example.com';
// Matches the password set by `scripts/seed-auth.js`
const TEST_PASSWORD = 'TestUserPass123!';

test('signs in and lands on dashboard', async ({ page }) => {
  // Capture console and failed requests for easier debugging in CI
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  page.on('request', req => {
    if (req.url().includes('identitytoolkit') || req.url().includes('/session')) {
      console.log('REQUEST:', req.method(), req.url());
    }
    if (req.url().startsWith('http://localhost:9002')) {
      console.log('LOCAL REQUEST:', req.method(), req.url());
    }
  });

  await page.goto('/signin');

  await page.fill('input#email', TEST_EMAIL);
  await page.fill('input#password', TEST_PASSWORD);
  await page.click('button[type=submit]');

  // Dashboard should be visible (either via redirect to / or direct mount)
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
});
