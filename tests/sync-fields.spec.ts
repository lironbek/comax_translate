import { test, expect } from '@playwright/test';

test.describe('Sync Fields Test', () => {
  test('should sync fields without errors', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser ERROR:', msg.text());
      }
    });

    // Listen for network requests to catch API errors
    page.on('response', async response => {
      if (response.url().includes('supabase') && !response.ok()) {
        const body = await response.text().catch(() => 'No body');
        console.log(`API Error: ${response.status()} ${response.url()}`);
        console.log('Response:', body);
      }
    });

    // Go to login page
    await page.goto('http://localhost:8080');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Login
    const usernameInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("התחבר")');

    await usernameInput.fill('lironbek88@gmail.com');
    await passwordInput.fill('Aa112233!');
    await loginButton.click();

    // Wait for navigation after login
    await page.waitForURL('**/localization', { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle');

    // Navigate to Applications page
    await page.goto('http://localhost:8080/applications');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/applications-page.png' });

    // Wait for applications to load
    await page.waitForSelector('text=רשימת אפליקציות', { timeout: 10000 });

    // Click on the settings button for App_Collect (or first app)
    const settingsButton = page.locator('button[title="נהל שדות"]').first();
    await settingsButton.click();

    // Wait for fields to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/fields-loaded.png' });

    // Click sync button
    const syncButton = page.locator('button:has-text("סנכרון")');
    if (await syncButton.isVisible()) {
      console.log('Clicking sync button...');

      // Capture the response from the sync operation
      const [response] = await Promise.all([
        page.waitForResponse(response =>
          response.url().includes('localization_resources') &&
          (response.request().method() === 'POST' || response.request().method() === 'PUT'),
          { timeout: 30000 }
        ).catch(() => null),
        syncButton.click()
      ]);

      if (response) {
        console.log('Sync response status:', response.status());
        const body = await response.json().catch(() => ({}));
        console.log('Sync response body:', JSON.stringify(body, null, 2));
      }

      // Wait for toast message
      await page.waitForTimeout(3000);

      // Take screenshot after sync
      await page.screenshot({ path: 'test-results/after-sync.png' });

      // Check for error toast
      const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
      if (await errorToast.isVisible({ timeout: 1000 }).catch(() => false)) {
        const errorText = await errorToast.textContent();
        console.log('ERROR TOAST:', errorText);
        throw new Error(`Sync failed with error: ${errorText}`);
      }

      // Check for success toast
      const successToast = page.locator('[data-sonner-toast][data-type="success"], [data-sonner-toast][data-type="info"]');
      if (await successToast.isVisible({ timeout: 1000 }).catch(() => false)) {
        const successText = await successToast.textContent();
        console.log('SUCCESS:', successText);
      }
    }
  });
});
