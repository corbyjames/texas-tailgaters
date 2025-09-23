import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ADMIN_EMAIL = 'test@texastailgaters.com';
const ADMIN_PASSWORD = 'TestPassword123!';
const TEST_HEADLINE = 'Important: Parking in Lot B for this game!';
const UPDATED_HEADLINE = 'Updated: Early tailgate setup at 9 AM';

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to games page or home page
  await page.waitForURL(/(games|home)/);
  await page.waitForLoadState('networkidle');
}

// Helper function to navigate to games page
async function navigateToGames(page: Page) {
  await page.goto(`${BASE_URL}/games`);
  await page.waitForLoadState('networkidle');

  // Wait for games to load
  await page.waitForSelector('.card', { timeout: 10000 });
}

// Helper function to find first game without a headline
async function findGameWithoutHeadline(page: Page) {
  // Get all game cards
  const gameCards = await page.locator('.card').all();

  for (const card of gameCards) {
    // Check if this card has an empty headline placeholder
    const hasEmptyHeadline = await card.locator('text="Click to add headline"').isVisible().catch(() => false);
    if (hasEmptyHeadline) {
      return card;
    }
  }

  // If no games without headlines, return the first game
  return gameCards[0];
}

test.describe('Headline Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Admin can add a headline to a game card', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Find a game card to add headline to
    const gameCard = await findGameWithoutHeadline(page);

    // Click the edit button for headline
    const editButton = gameCard.locator('button:has(svg)').first();
    await editButton.click();

    // Type the headline
    const headlineInput = gameCard.locator('input[placeholder*="headline"]');
    await headlineInput.fill(TEST_HEADLINE);

    // Save the headline
    const saveButton = gameCard.locator('button:has(svg.w-4.h-4)').filter({ hasText: '' }).first();
    await saveButton.click();

    // Verify headline is displayed
    await expect(gameCard.locator(`text="${TEST_HEADLINE}"`)).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/headline-added.png',
      fullPage: true
    });
  });

  test('Headline persists after page refresh', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Check if any headlines exist
    const headlineExists = await page.locator(`text="${TEST_HEADLINE}"`).isVisible().catch(() => false);

    if (headlineExists) {
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify headline still exists
      await expect(page.locator(`text="${TEST_HEADLINE}"`)).toBeVisible();
    }
  });

  test('Admin can edit an existing headline', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Find a game with an existing headline
    const gameCard = await page.locator('.card').filter({ hasText: TEST_HEADLINE }).first();

    if (await gameCard.isVisible()) {
      // Click edit button
      const editButton = await gameCard.locator('button:has(svg)').first();
      await editButton.click();

      // Clear and type new headline
      const headlineInput = gameCard.locator('input[type="text"]');
      await headlineInput.clear();
      await headlineInput.fill(UPDATED_HEADLINE);

      // Save
      const saveButton = gameCard.locator('button:has(svg.w-4.h-4)').filter({ hasText: '' }).first();
      await saveButton.click();

      // Verify updated headline
      await expect(gameCard.locator(`text="${UPDATED_HEADLINE}"`)).toBeVisible();
    }
  });

  test('Headline displays on game details page', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Click on a game to go to details
    const gameCard = await page.locator('.card').first();
    const gameLink = gameCard.locator('a[href*="/games/"]').first();
    await gameLink.click();

    // Wait for game details page to load
    await page.waitForURL(/\/games\/[^\/]+$/);
    await page.waitForLoadState('networkidle');

    // Check for headline section
    const headlineSection = page.locator('.bg-yellow-50');

    // If admin, should see headline or placeholder
    await expect(headlineSection).toBeVisible();

    // Try to add/edit headline on details page
    const editButton = headlineSection.locator('button:has(svg)').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Type headline
      const headlineInput = page.locator('input[placeholder*="headline"]');
      await headlineInput.clear();
      await headlineInput.fill('Detail page headline test');

      // Save
      const saveButton = page.locator('button:has(svg.w-5.h-5)').filter({ hasText: '' }).first();
      await saveButton.click();

      // Verify
      await expect(page.locator('text="Detail page headline test"')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: 'screenshots/headline-details-page.png',
        fullPage: true
      });
    }
  });

  test('Headline editing works with cancel button', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Find a game card
    const gameCard = await page.locator('.card').first();

    // Click edit button
    const editButton = gameCard.locator('button:has(svg)').first();
    await editButton.click();

    // Type a headline but don't save
    const headlineInput = gameCard.locator('input[placeholder*="headline"]');
    const originalValue = await headlineInput.inputValue();
    await headlineInput.fill('This should be cancelled');

    // Click cancel button (X icon)
    const cancelButton = gameCard.locator('button:has(svg.w-4.h-4)').nth(1);
    await cancelButton.click();

    // Verify the input is gone and original state is restored
    await expect(headlineInput).not.toBeVisible();

    // Original headline or placeholder should be visible
    if (originalValue) {
      await expect(gameCard.locator(`text="${originalValue}"`)).toBeVisible();
    }
  });

  test('Mobile view displays headlines correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Wait for mobile game cards
    await page.waitForSelector('.rounded-lg.shadow-sm', { timeout: 10000 });

    // Check if headlines are visible on mobile cards
    const mobileCard = page.locator('.rounded-lg.shadow-sm').first();

    // Look for headline section
    const headlineSection = mobileCard.locator('.bg-yellow-50');

    // If visible, try to edit
    if (await headlineSection.isVisible()) {
      const editButton = headlineSection.locator('button:has(svg)').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Type mobile headline
        const headlineInput = mobileCard.locator('input[placeholder*="headline"]');
        await headlineInput.fill('Mobile headline test');

        // Save
        const saveButton = mobileCard.locator('button:has(svg.w-4.h-4)').first();
        await saveButton.click();

        // Verify
        await expect(mobileCard.locator('text="Mobile headline test"')).toBeVisible();

        // Take screenshot
        await page.screenshot({
          path: 'screenshots/headline-mobile.png',
          fullPage: true
        });
      }
    }
  });

  test('Multiple headlines can be managed independently', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Get first two game cards
    const gameCards = await page.locator('.card').all();

    if (gameCards.length >= 2) {
      // Add headline to first game
      const firstCard = gameCards[0];
      let editButton = firstCard.locator('button:has(svg)').first();
      await editButton.click();

      let headlineInput = firstCard.locator('input[placeholder*="headline"]');
      await headlineInput.fill('First game headline');

      let saveButton = firstCard.locator('button:has(svg.w-4.h-4)').first();
      await saveButton.click();

      // Add headline to second game
      const secondCard = gameCards[1];
      editButton = secondCard.locator('button:has(svg)').first();
      await editButton.click();

      headlineInput = secondCard.locator('input[placeholder*="headline"]');
      await headlineInput.fill('Second game headline');

      saveButton = secondCard.locator('button:has(svg.w-4.h-4)').first();
      await saveButton.click();

      // Verify both headlines are visible
      await expect(page.locator('text="First game headline"')).toBeVisible();
      await expect(page.locator('text="Second game headline"')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: 'screenshots/multiple-headlines.png',
        fullPage: true
      });
    }
  });

  test('Headline appears in collapsed view for completed games', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Look for a completed game (has gray background)
    const completedGame = page.locator('.bg-gray-50').first();

    if (await completedGame.isVisible()) {
      // Check if headline is visible in collapsed state
      const headline = completedGame.locator('.bg-yellow-50');

      if (await headline.isVisible()) {
        // Take screenshot
        await page.screenshot({
          path: 'screenshots/headline-collapsed-view.png',
          fullPage: true
        });

        // Verify headline text is visible
        const headlineText = await headline.textContent();
        expect(headlineText).toBeTruthy();
      }
    }
  });
});

test.describe('Headline Validation Tests', () => {
  test('Empty headline can be saved (clears headline)', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Find a game with a headline
    const gameCard = await page.locator('.card').first();

    // Click edit button
    const editButton = gameCard.locator('button:has(svg)').first();
    await editButton.click();

    // Clear the input
    const headlineInput = gameCard.locator('input[placeholder*="headline"]');
    await headlineInput.clear();

    // Save empty headline
    const saveButton = gameCard.locator('button:has(svg.w-4.h-4)').first();
    await saveButton.click();

    // Verify placeholder text appears for admin
    await expect(gameCard.locator('text="Click to add headline"')).toBeVisible();
  });

  test('Long headlines are handled properly', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to games page
    await navigateToGames(page);

    // Find a game card
    const gameCard = await page.locator('.card').first();

    // Click edit button
    const editButton = gameCard.locator('button:has(svg)').first();
    await editButton.click();

    // Type a very long headline
    const longHeadline = 'This is a very long headline that tests how the system handles extended text content and ensures proper wrapping and display across different screen sizes and view modes';
    const headlineInput = gameCard.locator('input[placeholder*="headline"]');
    await headlineInput.fill(longHeadline);

    // Save
    const saveButton = gameCard.locator('button:has(svg.w-4.h-4)').first();
    await saveButton.click();

    // Verify headline is displayed (may be truncated but should be visible)
    await expect(gameCard.locator('.bg-yellow-50')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/long-headline.png',
      fullPage: true
    });
  });
});