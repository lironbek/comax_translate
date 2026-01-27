import { test, expect } from '@playwright/test';

test.describe('Check Translation Visibility', () => {
  test('should find would_you_like_to_select_this_as_an_alternative in translations', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // Login
    const usernameInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("התחבר")');

    await usernameInput.fill('lironbek88@gmail.com');
    await passwordInput.fill('Aa112233!');

    // Take screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png' });

    await loginButton.click();

    // Wait for either successful navigation or error message
    await page.waitForTimeout(3000);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/after-login-attempt.png' });

    // Check current URL
    console.log('Current URL after login:', page.url());

    // If still on login page, check for error
    if (page.url().includes('localhost:8080') && !page.url().includes('localization')) {
      const errorMsg = await page.locator('.text-destructive, [role="alert"]').textContent().catch(() => 'No error message');
      console.log('Login error:', errorMsg);
    }

    // Navigate directly to localization page
    await page.goto('http://localhost:8080/localization');
    await page.waitForLoadState('networkidle');

    // We're now on the translations page
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/translations-page.png' });

    // Select App_Collect as resource type
    const resourceTypeSelect = page.locator('button:has-text("בחר סוג משאב"), button[role="combobox"]').first();
    if (await resourceTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resourceTypeSelect.click();
      await page.waitForTimeout(500);

      // Look for App_Collect option
      const appCollectOption = page.locator('[role="option"]:has-text("App_Collect")');
      if (await appCollectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await appCollectOption.click();
      }
    }

    await page.waitForTimeout(1000);

    // Search for the specific key
    const searchInput = page.locator('input[placeholder*="חפש"], input[placeholder*="מפתח"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('would_you_like');
      await page.waitForTimeout(2000);
    }

    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/search-results.png' });

    // Check if the key is visible in the results
    const keyCell = page.locator('text=would_you_like_to_select_this_as_an_alternative');
    const isVisible = await keyCell.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Key visible in translations:', isVisible);

    if (isVisible) {
      console.log('SUCCESS: The key is now visible in the translations page!');
    } else {
      // List what we can see
      const rows = await page.locator('table tbody tr').count();
      console.log('Number of rows visible:', rows);

      // Take full page screenshot
      await page.screenshot({ path: 'test-results/full-page.png', fullPage: true });
    }

    expect(isVisible).toBe(true);
  });
});
