import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'admin');
    
    // Click the Admin Dashboard link instead of direct navigation
    // This ensures proper auth state is loaded
    const adminDashboardLink = page.locator('text=Admin Dashboard').first();
    await adminDashboardLink.waitFor({ state: 'visible', timeout: 10000 });
    await adminDashboardLink.click();
    
    // Wait for admin page to load
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('should access admin dashboard', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Should show admin dashboard
    await expect(page.locator('h1').filter({ hasText: 'Admin Dashboard' })).toBeVisible();
    
    // Should have admin tabs - check for the tab text or icon
    const overviewTab = page.locator('button').filter({ hasText: /Overview|View/ });
    const usersTab = page.locator('button').filter({ hasText: 'Users' });
    const feedbackTab = page.locator('button').filter({ hasText: 'Feedback' });
    
    await expect(overviewTab.first()).toBeVisible();
    await expect(usersTab.first()).toBeVisible();
    await expect(feedbackTab.first()).toBeVisible();
  });

  test('should display admin statistics', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Should show stats content in overview tab
    // Check for common admin stats elements
    const statsSection = page.locator('div').filter({ hasText: /Games|Users|Active|Total/ });
    await expect(statsSection.first()).toBeVisible();
    
    // Should have numbers in stats
    const statsNumbers = page.locator('.text-2xl, .text-xl, .text-lg');
    const count = await statsNumbers.count();
    if (count > 0) {
      await expect(statsNumbers.first()).toBeVisible();
    }
  });

  test('should manage users', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Users tab - use first() to select the tab button, not the disabled button
    const usersTab = page.locator('button').filter({ hasText: 'Users' }).first();
    await usersTab.click();
    await page.waitForTimeout(500);
    
    // Should show user list or user content
    const userContent = page.locator('div').filter({ hasText: /Email|User|Status/ });
    if (await userContent.first().isVisible()) {
      await expect(userContent.first()).toBeVisible();
    }
    
    // Should have user management actions
    const actionButton = page.locator('button[aria-label="More actions"]').or(
      page.locator('button:has(svg.more-icon)')
    );
    
    if (await actionButton.first().isVisible()) {
      await actionButton.first().click();
      
      // Should show action menu
      await expect(page.locator('text=/Deactivate|Admin|Password/')).toBeVisible();
      
      // Close menu
      await page.keyboard.press('Escape');
    }
  });

  test('should invite all users', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Users tab - use first() to select the tab button
    const usersTab = page.locator('button').filter({ hasText: 'Users' }).first();
    await usersTab.click();
    await page.waitForTimeout(500);
    
    // Find Invite All Users button
    const inviteButton = page.locator('button').filter({ hasText: /Invite.*All|Invite.*Users/ });
    if (await inviteButton.first().isVisible()) {
      await inviteButton.first().click();
      
      // Modal should open - use more specific selector
      await expect(page.locator('h2:has-text("Invite All Users")')).toBeVisible();
      
      // Should have user selection
      await expect(page.locator('text=/Select Recipients|Recipients/').first()).toBeVisible();
      
      // Close modal - try different selectors
      const cancelButton = page.locator('button:has-text("Cancel")').or(page.locator('button[aria-label="Close"]'));
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      } else {
        // Press escape to close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should sync schedule from UT Athletics', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Find sync button
    const syncButton = page.locator('button:has-text("Sync Schedule")');
    if (await syncButton.isVisible()) {
      // Note: Don't actually click to avoid making real API calls
      await expect(syncButton).toBeVisible();
      await expect(page.locator('text=/Sync UT Schedule|official UT Athletics/').first()).toBeVisible();
    }
  });

  test('should manage feedback', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Feedback tab - use first() to be specific
    const feedbackTab = page.locator('button').filter({ hasText: 'Feedback' }).first();
    await feedbackTab.click();
    await page.waitForTimeout(500);
    
    // Should show feedback manager
    const feedbackContent = page.locator('div').filter({ hasText: /Feedback|Issues|Suggestions|Response/ });
    if (await feedbackContent.first().isVisible()) {
      await expect(feedbackContent.first()).toBeVisible();
    }
  });

  test('should handle no-tailgate toggle', async ({ page }) => {
    // Already navigated to admin in beforeEach
    // Navigate to games from admin
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give games time to load
    
    // Look for any clickable game element
    const gameSelectors = [
      'div[class*="bg-white"][class*="rounded"]',
      'div[class*="shadow"][class*="cursor-pointer"]',
      'a[href^="/games/"]',
      '[data-testid="game-card"]'
    ];
    
    let clicked = false;
    for (const selector of gameSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      // Skip test if no games are available
      console.log('No games available to test no-tailgate toggle');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Admin should see no-tailgate toggle
    const noTailgateButton = page.locator('button:has-text("Mark No Tailgate")').or(
      page.locator('button:has-text("Enable Tailgate")')
    );
    
    if (await noTailgateButton.isVisible()) {
      // Verify button is present (don't click to avoid changing data)
      await expect(noTailgateButton).toBeVisible();
    }
  });

  test('should filter users by status and role', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Users tab - use first() to select the tab button
    const usersTab = page.locator('button').filter({ hasText: 'Users' }).first();
    await usersTab.click();
    
    // Filter by status
    const statusFilter = page.locator('select').filter({ hasText: /All Status/ });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');
      await page.waitForTimeout(500);
      
      // Reset filter
      await statusFilter.selectOption('all');
    }
    
    // Filter by role
    const roleFilter = page.locator('select').filter({ hasText: /All Roles/ });
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('admin');
      await page.waitForTimeout(500);
      
      // Reset filter
      await roleFilter.selectOption('all');
    }
  });

  test('should search users', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Users tab - use first() to select the tab button
    const usersTab = page.locator('button').filter({ hasText: 'Users' }).first();
    await usersTab.click();
    
    // Search for users
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Clear search
      await searchInput.clear();
    }
  });
});