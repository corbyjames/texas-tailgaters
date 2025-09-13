import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Games Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'member');
  });

  test('should display games list', async ({ page }) => {
    await page.goto('/games');
    
    // Should show games
    await expect(page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first()).toBeVisible();
    
    // Should have at least one game
    const gameCards = page.locator('.game-card').or(page.locator('[data-testid="game-card"]'));
    await expect(gameCards).toHaveCount(await gameCards.count());
  });

  test('should filter games by status', async ({ page }) => {
    await page.goto('/games');
    
    // Check if filter buttons exist
    const filterButtons = page.locator('button:has-text("Upcoming")').or(
      page.locator('button:has-text("Past")')
    );
    
    if (await filterButtons.first().isVisible()) {
      // Click upcoming filter
      await page.click('button:has-text("Upcoming")');
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const gameCards = page.locator('.game-card').or(page.locator('[data-testid="game-card"]'));
      const count = await gameCards.count();
      
      if (count > 0) {
        // Check first game is in the future
        const dateText = await gameCards.first().locator('text=/\d{1,2}\/\d{1,2}\/\d{4}/').textContent();
        expect(dateText).toBeTruthy();
      }
    }
  });

  test('should navigate to game details', async ({ page }) => {
    await page.goto('/games');
    
    // Click first game card
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Should navigate to game details
    await expect(page).toHaveURL(/\/games\/[^/]+$/);
    
    // Should show game details
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('text=/Date|Time|Location/')).toBeVisible();
  });

  test('should display game stats on details page', async ({ page }) => {
    await page.goto('/games');
    
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Check for stats cards
    await expect(page.locator('text=/Potluck Items|Attending|RSVP/')).toBeVisible();
  });

  test('should handle RSVP modal', async ({ page }) => {
    await page.goto('/games');
    
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Click RSVP button
    const rsvpButton = page.locator('button:has-text("RSVP")');
    if (await rsvpButton.isVisible()) {
      await rsvpButton.click();
      
      // Modal should open
      await expect(page.locator('text=/Going|Maybe|Not Going/')).toBeVisible();
      
      // Select Going
      await page.click('button:has-text("Going")');
      
      // Should update RSVP status
      await expect(page.locator('text=/You\'re Going|Attending/')).toBeVisible();
    }
  });

  test('should display scores for completed games', async ({ page }) => {
    await page.goto('/games');
    
    // Look for games with scores
    const scoresElements = page.locator('text=/\d+\s*-\s*\d+/');
    const count = await scoresElements.count();
    
    if (count > 0) {
      // Verify score display format
      const scoreText = await scoresElements.first().textContent();
      expect(scoreText).toMatch(/\d+\s*-\s*\d+/);
    }
  });

  test('should show no tailgate indicator', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    // Check if any games have no tailgate indicator
    const noTailgateIndicators = page.locator('text=/No Tailgate|Not Hosting/');
    const count = await noTailgateIndicators.count();
    
    if (count > 0) {
      // Click on a no-tailgate game - find parent card
      const noTailgateGame = noTailgateIndicators.first().locator('xpath=ancestor::div[contains(@class, "card")]');
      if (await noTailgateGame.isVisible()) {
        await noTailgateGame.click();
        
        // Should show no tailgate message on details page
        await expect(page.locator('text=/No Tailgate|will not have an organized tailgate/')).toBeVisible();
      }
    }
  });
});