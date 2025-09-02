import { test, expect } from '@playwright/test';
import { login, loginAsAdmin } from '../utils/auth-helpers';
import { navigateTo } from '../utils/nav-helpers';

test.describe('No Tailgate Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    await navigateTo(page, '/games');
  });

  test('Admin can mark game as no-tailgate', async ({ page }) => {
    // Find a game card
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    await expect(gameCard).toBeVisible();

    // Click the no-tailgate toggle button
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    await expect(noTailgateButton).toBeVisible();
    await noTailgateButton.click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify no-tailgate badge appears
    const noTailgateBadge = gameCard.locator('text="No Tailgate Hosted"');
    await expect(noTailgateBadge).toBeVisible();

    // Verify action buttons are hidden
    const viewDetailsButton = gameCard.locator('text="View Details"');
    await expect(viewDetailsButton).not.toBeVisible();

    const sendInviteButton = gameCard.locator('text="Send Invite"');
    await expect(sendInviteButton).not.toBeVisible();

    // Verify the card has muted styling
    await expect(gameCard).toHaveClass(/bg-gray-50/);
    await expect(gameCard).toHaveClass(/opacity-75/);
  });

  test('Admin can re-enable tailgate for a no-tailgate game', async ({ page }) => {
    // First mark a game as no-tailgate
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    
    if (await noTailgateButton.isVisible()) {
      await noTailgateButton.click();
      await page.waitForTimeout(1000);
    }

    // Now re-enable tailgate
    const enableButton = gameCard.locator('button:has-text("Enable Tailgate")');
    await expect(enableButton).toBeVisible();
    await enableButton.click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify no-tailgate badge is removed
    const noTailgateBadge = gameCard.locator('text="No Tailgate Hosted"');
    await expect(noTailgateBadge).not.toBeVisible();

    // Verify action buttons are visible again
    const viewDetailsButton = gameCard.locator('text="View Details"');
    await expect(viewDetailsButton).toBeVisible();

    const sendInviteButton = gameCard.locator('text="Send Invite"');
    await expect(sendInviteButton).toBeVisible();

    // Verify normal styling is restored
    await expect(gameCard).not.toHaveClass(/bg-gray-50/);
    await expect(gameCard).not.toHaveClass(/opacity-75/);
  });

  test('Regular user cannot see admin controls', async ({ page }) => {
    // Logout and login as regular user
    await page.goto('/');
    await login(page, 'test@texastailgaters.com', 'TestPassword123!');
    await navigateTo(page, '/games');

    // Find a game card
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    await expect(gameCard).toBeVisible();

    // Verify no admin controls are visible
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    await expect(noTailgateButton).not.toBeVisible();

    const enableButton = gameCard.locator('button:has-text("Enable Tailgate")');
    await expect(enableButton).not.toBeVisible();
  });

  test('No-tailgate games are not clickable for navigation', async ({ page }) => {
    // Mark a game as no-tailgate
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    const opponent = await gameCard.locator('text=/vs|@/').textContent();
    
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    if (await noTailgateButton.isVisible()) {
      await noTailgateButton.click();
      await page.waitForTimeout(1000);
    }

    // Try to click the card
    const initialUrl = page.url();
    await gameCard.click();
    
    // Verify we stayed on the same page (didn't navigate)
    await expect(page).toHaveURL(initialUrl);
  });

  test('No-tailgate games show no potluck count', async ({ page }) => {
    // Mark a game as no-tailgate
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    
    if (await noTailgateButton.isVisible()) {
      await noTailgateButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify no potluck count is shown
    const itemsCount = gameCard.locator('text="Items + Attendees"');
    await expect(itemsCount).not.toBeVisible();

    const potluckStats = gameCard.locator('text=/\\d+ items/');
    await expect(potluckStats).not.toBeVisible();
  });

  test('Multiple games can be marked as no-tailgate', async ({ page }) => {
    // Get all game cards with vs or @
    const gameCards = page.locator('.card').filter({ hasText: /vs|@/ });
    const count = await gameCards.count();
    
    // Mark at least 2 games as no-tailgate
    const gamesToMark = Math.min(2, count);
    let markedCount = 0;

    for (let i = 0; i < count && markedCount < gamesToMark; i++) {
      const card = gameCards.nth(i);
      const noTailgateButton = card.locator('button[title="Mark as No Tailgate"]');
      
      if (await noTailgateButton.isVisible()) {
        await noTailgateButton.click();
        await page.waitForTimeout(500);
        markedCount++;
      }
    }

    // Verify all marked games show the badge
    const noTailgateBadges = page.locator('text="No Tailgate Hosted"');
    const badgeCount = await noTailgateBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(markedCount);
  });

  test('No-tailgate state persists after page refresh', async ({ page }) => {
    // Mark a game as no-tailgate
    const gameCard = page.locator('.card').filter({ hasText: 'vs' }).first();
    
    // Get the opponent name to identify the game after refresh
    const opponentText = await gameCard.textContent();
    
    const noTailgateButton = gameCard.locator('button[title="Mark as No Tailgate"]');
    if (await noTailgateButton.isVisible()) {
      await noTailgateButton.click();
      await page.waitForTimeout(1000);
    }

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find the same game card
    const refreshedCard = page.locator('.card').filter({ hasText: opponentText! });
    
    // Verify it still shows as no-tailgate
    const noTailgateBadge = refreshedCard.locator('text="No Tailgate Hosted"');
    await expect(noTailgateBadge).toBeVisible();
  });
});