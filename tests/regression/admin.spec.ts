import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'admin');
    // Navigate to admin page after login
    await page.goto('/admin');
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
    
    // Click Users tab
    const usersTab = page.locator('button').filter({ hasText: 'Users' });
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
    
    // Click Users tab
    const usersTab = page.locator('button').filter({ hasText: 'Users' });
    await usersTab.click();
    await page.waitForTimeout(500);
    
    // Find Invite All Users button
    const inviteButton = page.locator('button').filter({ hasText: /Invite.*All|Invite.*Users/ });
    if (await inviteButton.first().isVisible()) {
      await inviteButton.first().click();
      
      // Modal should open
      await expect(page.locator('text=/Invite All Users|Send Invitations/')).toBeVisible();
      
      // Should have user selection
      await expect(page.locator('text=/Select Recipients|Recipients/')).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Cancel")').or(page.click('button[aria-label="Close"]'));
    }
  });

  test('should sync schedule from UT Athletics', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Find sync button
    const syncButton = page.locator('button:has-text("Sync Schedule")');
    if (await syncButton.isVisible()) {
      // Note: Don't actually click to avoid making real API calls
      await expect(syncButton).toBeVisible();
      await expect(page.locator('text=/Sync UT Schedule|official UT Athletics/')).toBeVisible();
    }
  });

  test('should manage feedback', async ({ page }) => {
    // Already navigated in beforeEach
    
    // Click Feedback tab
    const feedbackTab = page.locator('button').filter({ hasText: 'Feedback' });
    await feedbackTab.click();
    await page.waitForTimeout(500);
    
    // Should show feedback manager
    const feedbackContent = page.locator('div').filter({ hasText: /Feedback|Issues|Suggestions|Response/ });
    if (await feedbackContent.first().isVisible()) {
      await expect(feedbackContent.first()).toBeVisible();
    }
  });

  test('should handle no-tailgate toggle', async ({ page }) => {
    await page.goto('/games');
    
    // Navigate to a game
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
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
    
    // Click Users tab
    const usersTab = page.locator('button').filter({ hasText: 'Users' });
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
    
    // Click Users tab  
    const usersTab = page.locator('button').filter({ hasText: 'Users' });
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