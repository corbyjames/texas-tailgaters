import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

// Run these tests only on mobile devices
// Note: Mobile testing is handled by project configuration
test.describe('Mobile Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'member');
  });

  test('should display bottom navigation on mobile', async ({ page }) => {
    await page.goto('/games');
    
    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav').filter({ hasText: /Home|Games|Potluck|Profile/ });
    await expect(bottomNav).toBeVisible();
    
    // Should have all navigation items
    await expect(bottomNav.locator('text=Games')).toBeVisible();
    await expect(bottomNav.locator('text=Potluck')).toBeVisible();
    await expect(bottomNav.locator('text=Profile')).toBeVisible();
  });

  test('should navigate using bottom navigation', async ({ page }) => {
    await page.goto('/games');
    
    // Click Potluck in bottom nav
    await page.click('nav >> text=Potluck');
    await expect(page).toHaveURL(/\/potluck/);
    
    // Click Profile
    await page.click('nav >> text=Profile');
    await expect(page).toHaveURL(/\/profile/);
    
    // Click Games to go back
    await page.click('nav >> text=Games');
    await expect(page).toHaveURL(/\/games/);
  });

  test('should show active state in bottom navigation', async ({ page }) => {
    await page.goto('/games');
    
    // Games should be active
    const gamesNavItem = page.locator('nav a:has-text("Games")');
    const gamesClasses = await gamesNavItem.getAttribute('class');
    expect(gamesClasses).toContain('text-ut-orange');
    
    // Navigate to Potluck
    await page.click('nav >> text=Potluck');
    
    // Potluck should now be active
    const potluckNavItem = page.locator('nav a:has-text("Potluck")');
    const potluckClasses = await potluckNavItem.getAttribute('class');
    expect(potluckClasses).toContain('text-ut-orange');
  });

  test('should handle hamburger menu if present', async ({ page }) => {
    await page.goto('/games');
    
    // Check if hamburger menu exists
    const hamburger = page.locator('button[aria-label="Menu"]').or(
      page.locator('button:has(svg.hamburger)')
    );
    
    if (await hamburger.isVisible()) {
      await hamburger.click();
      
      // Menu should open
      await expect(page.locator('nav.mobile-menu').or(page.locator('[role="menu"]'))).toBeVisible();
      
      // Close menu
      await page.keyboard.press('Escape');
      await expect(page.locator('nav.mobile-menu').or(page.locator('[role="menu"]'))).not.toBeVisible();
    }
  });

  test('should display mobile-optimized game cards', async ({ page }) => {
    await page.goto('/games');
    
    // Game cards should be visible
    const gameCards = page.locator('.game-card').or(page.locator('[data-testid="game-card"]'));
    await expect(gameCards.first()).toBeVisible();
    
    // Cards should be stacked vertically on mobile
    const firstCard = await gameCards.first().boundingBox();
    const secondCard = await gameCards.nth(1).boundingBox();
    
    if (firstCard && secondCard) {
      // Second card should be below first card (y position greater)
      expect(secondCard.y).toBeGreaterThan(firstCard.y);
    }
  });

  test('should show mobile-friendly modals', async ({ page }) => {
    await page.goto('/games');
    
    // Navigate to first game
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Click on a stats card to open modal
    const statsCard = page.locator('button:has-text("Potluck Items")').or(
      page.locator('button:has-text("People Attending")')
    );
    
    if (await statsCard.first().isVisible()) {
      await statsCard.first().click();
      
      // Modal should slide up from bottom on mobile
      const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
      await expect(modal).toBeVisible();
      
      // Should have rounded top corners (mobile style)
      const modalClasses = await modal.getAttribute('class');
      if (modalClasses) {
        expect(modalClasses).toMatch(/rounded-t|slide-up/);
      }
      
      // Close modal
      await page.click('button[aria-label="Close"]').or(page.locator('button:has(svg.x-icon)'));
      await expect(modal).not.toBeVisible();
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/games');
    
    // Simulate touch on game card
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    
    // Touch start and end to simulate tap
    await firstGame.tap();
    
    // Should navigate to game details
    await expect(page).toHaveURL(/\/games\/[^/]+$/);
  });

  test('should display mobile-optimized forms', async ({ page }) => {
    await page.goto('/games');
    
    // Navigate to first game
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Click Add Item button if visible
    const addButton = page.locator('button:has-text("Add Item")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Form should be mobile-optimized
      const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
      await expect(modal).toBeVisible();
      
      // Input fields should be full width on mobile
      const inputField = modal.locator('input[type="text"]').first();
      const inputBox = await inputField.boundingBox();
      
      if (inputBox) {
        // Input should be nearly full width of modal (accounting for padding)
        const modalBox = await modal.boundingBox();
        if (modalBox) {
          expect(inputBox.width).toBeGreaterThan(modalBox.width * 0.8);
        }
      }
    }
  });
});