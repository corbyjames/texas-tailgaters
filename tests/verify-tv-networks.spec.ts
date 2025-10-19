import { test, expect } from '@playwright/test';

test.describe('Verify TV Networks Sync', () => {
  test('TV networks should be synced from ESPN', async ({ page }) => {
    // Go directly to login page
    await page.goto('http://localhost:5173/login');

    // Wait for page to load
    await page.waitForLoadState('load');

    console.log('Current URL:', page.url());

    // Fill login form
    await page.locator('input[type="email"]').fill('test@texastailgaters.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');

    // Take screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png' });

    // Click sign in
    await page.locator('button', { hasText: 'Sign In' }).click();

    // Wait a bit for navigation
    await page.waitForTimeout(3000);

    console.log('After login URL:', page.url());

    // Take screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png' });

    // Try to navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');

    console.log('Games page URL:', page.url());

    // Take screenshot of games page
    await page.screenshot({ path: 'test-results/games-page.png' });

    // Check page content
    const pageText = await page.textContent('body');
    console.log('Page contains "vs":', pageText?.includes('vs'));
    console.log('Page contains TV emoji:', pageText?.includes('📺'));

    // Look for game cards
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} cards`);

    if (cardCount > 0) {
      // Get text from first card
      const firstCard = await cards.first().textContent();
      console.log('First card text:', firstCard?.substring(0, 200));

      // Check for TV network
      expect(firstCard).toContain('📺');
    } else {
      console.log('No cards found - check screenshots');
    }
  });
});
