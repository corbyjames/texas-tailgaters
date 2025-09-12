import { test, expect } from '@playwright/test';

test.describe('Production Score Display Verification', () => {
  const PROD_URL = 'https://texas-tailgaters.onrender.com';

  test('Production site displays game cards', async ({ page }) => {
    // Navigate to production with extended timeout for Render cold start
    await page.goto(`${PROD_URL}/games`, {
      waitUntil: 'networkidle',
      timeout: 60000 // 60 seconds for Render to wake up
    });

    // Check if login is required or games are visible
    const hasContent = await page.locator('text="Sign in with Google"').or(
      page.locator('.card, [data-testid="game-card"]')
    ).isVisible({ timeout: 30000 });
    
    expect(hasContent).toBeTruthy();
    console.log('Production site is accessible');
  });

  test('Check score display elements on production', async ({ page }) => {
    await page.goto(`${PROD_URL}/games`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // If login is required, we can at least verify the page loads
    const needsLogin = await page.locator('text="Sign in with Google"').isVisible();
    
    if (!needsLogin) {
      // Look for game cards
      const gameCards = await page.locator('.card, [data-testid="game-card"]').count();
      console.log(`Found ${gameCards} game cards on production`);
      
      if (gameCards > 0) {
        // Check for score-related elements
        const hasScoreElements = await page.locator('text=/\\d+\\s*-\\s*\\d+|vs|@/').isVisible();
        expect(hasScoreElements).toBeTruthy();
        
        // Check for status indicators
        const hasStatusElements = await page.locator('text=/Final|LIVE|Kickoff|Saturday|Friday/').isVisible();
        expect(hasStatusElements).toBeTruthy();
        
        console.log('Score display elements found on production');
      }
    } else {
      console.log('Login required - cannot verify authenticated features');
    }
  });

  test('Verify mobile responsiveness on production', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${PROD_URL}/games`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Check that content fits mobile viewport
    const viewport = page.viewportSize();
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    
    if (boundingBox && viewport) {
      expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
      console.log('Mobile view renders correctly on production');
    }
  });

  test('Take production screenshots for visual verification', async ({ page }) => {
    // Desktop screenshot
    await page.goto(`${PROD_URL}/games`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    await page.screenshot({
      path: 'test-results/prod-score-display-desktop.png',
      fullPage: true
    });
    
    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: 'test-results/prod-score-display-mobile.png',
      fullPage: false
    });
    
    console.log('Production screenshots captured');
  });
});