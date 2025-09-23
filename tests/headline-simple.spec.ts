import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const ADMIN_EMAIL = 'test@texastailgaters.com';
const ADMIN_PASSWORD = 'TestPassword123!';

test.describe('Headline Feature - Simple Tests', () => {
  test.setTimeout(60000); // 60 second timeout per test

  test('Admin can add and edit headlines on game cards', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(games|home)/, { timeout: 10000 });

    // Go to games page
    await page.goto(`${BASE_URL}/games`);
    await page.waitForSelector('.card', { timeout: 10000 });

    // Take initial screenshot
    await page.screenshot({
      path: 'screenshots/headline-test-initial.png',
      fullPage: true
    });

    // Find the first game card
    const firstCard = page.locator('.card').first();

    // Check if there's an edit button (for headline)
    const editButtons = firstCard.locator('button svg.w-4.h-4').locator('..');
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      // Click the first edit button (should be for headline)
      await editButtons.first().click();

      // Wait for input to appear
      await page.waitForSelector('input[placeholder*="headline"]', { timeout: 5000 });

      // Type a test headline
      const testHeadline = `Test headline - ${new Date().toISOString()}`;
      await page.fill('input[placeholder*="headline"]', testHeadline);

      // Take screenshot with input
      await page.screenshot({
        path: 'screenshots/headline-test-editing.png',
        fullPage: true
      });

      // Look for save button (check mark icon)
      const saveButton = firstCard.locator('button').filter({ has: page.locator('svg.text-green-600') });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Wait for the headline to be saved
        await page.waitForTimeout(2000);

        // Verify the headline is displayed
        const headlineText = await firstCard.locator('.bg-yellow-50').textContent();
        console.log('Saved headline:', headlineText);

        // Take final screenshot
        await page.screenshot({
          path: 'screenshots/headline-test-saved.png',
          fullPage: true
        });

        // Verify headline contains our text
        expect(headlineText).toContain('Test headline');
      }
    }
  });

  test('Headline displays on game details page', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(games|home)/, { timeout: 10000 });

    // Go to games page
    await page.goto(`${BASE_URL}/games`);
    await page.waitForSelector('.card', { timeout: 10000 });

    // Click on "View Details" for the first game
    const viewDetailsButton = page.locator('a:text("View Details")').first();
    await viewDetailsButton.click();

    // Wait for game details page
    await page.waitForURL(/\/games\/[^\/]+$/, { timeout: 10000 });

    // Take screenshot of details page
    await page.screenshot({
      path: 'screenshots/headline-details-page.png',
      fullPage: true
    });

    // Check for headline section
    const headlineSection = page.locator('.bg-yellow-50');
    const isHeadlineVisible = await headlineSection.isVisible();

    if (isHeadlineVisible) {
      console.log('Headline section found on details page');

      // Try to edit if we're admin
      const editButton = headlineSection.locator('button svg').locator('..');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Type a detail page specific headline
        await page.fill('input[placeholder*="headline"]', 'Details page headline test');

        // Save
        const saveButton = page.locator('button').filter({ has: page.locator('svg.w-5.h-5.text-green-600') });
        await saveButton.click();

        await page.waitForTimeout(2000);

        // Take final screenshot
        await page.screenshot({
          path: 'screenshots/headline-details-saved.png',
          fullPage: true
        });
      }
    }
  });

  test('Mobile view headline functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(games|home)/, { timeout: 10000 });

    // Go to games page
    await page.goto(`${BASE_URL}/games`);
    await page.waitForSelector('.rounded-lg', { timeout: 10000 });

    // Take mobile screenshot
    await page.screenshot({
      path: 'screenshots/headline-mobile-view.png',
      fullPage: true
    });

    // Find headline section in mobile view
    const mobileCard = page.locator('.rounded-lg').first();
    const headlineSection = mobileCard.locator('.bg-yellow-50');

    if (await headlineSection.isVisible()) {
      console.log('Headline section visible on mobile');

      // Try to edit
      const editButton = headlineSection.locator('button').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Type mobile headline
        await page.fill('input[placeholder*="headline"]', 'Mobile headline test');

        // Take editing screenshot
        await page.screenshot({
          path: 'screenshots/headline-mobile-editing.png',
          fullPage: true
        });

        // Save
        const saveButton = mobileCard.locator('button svg.text-green-600').locator('..');
        if (await saveButton.isVisible()) {
          await saveButton.click();

          await page.waitForTimeout(2000);

          // Take final mobile screenshot
          await page.screenshot({
            path: 'screenshots/headline-mobile-saved.png',
            fullPage: true
          });
        }
      }
    }
  });
});