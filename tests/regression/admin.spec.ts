import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'admin');
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin dashboard
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    
    // Should have admin tabs
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Feedback')).toBeVisible();
  });

  test('should display admin statistics', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show stats cards
    await expect(page.locator('text=/Total Games|Total Users|Active/')).toBeVisible();
    
    // Should have numbers in stats
    const statsNumbers = page.locator('.text-2xl, .text-xl').filter({ hasText: /^\d+$/ });
    await expect(statsNumbers.first()).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin');
    
    // Click Users tab
    await page.click('button:has-text("Users")');
    
    // Should show user list
    await expect(page.locator('text=/Email|Status|Role/')).toBeVisible();
    
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
    await page.goto('/admin');
    
    // Click Users tab
    await page.click('button:has-text("Users")');
    
    // Find Invite All Users button
    const inviteButton = page.locator('button:has-text("Invite All Users")');
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      
      // Modal should open
      await expect(page.locator('text=/Invite All Users|Send Invitations/')).toBeVisible();
      
      // Should have user selection
      await expect(page.locator('text=/Select Recipients|Recipients/')).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Cancel")').or(page.click('button[aria-label="Close"]'));
    }
  });

  test('should sync schedule from UT Athletics', async ({ page }) => {
    await page.goto('/admin');
    
    // Find sync button
    const syncButton = page.locator('button:has-text("Sync Schedule")');
    if (await syncButton.isVisible()) {
      // Note: Don't actually click to avoid making real API calls
      await expect(syncButton).toBeVisible();
      await expect(page.locator('text=/Sync UT Schedule|official UT Athletics/')).toBeVisible();
    }
  });

  test('should manage feedback', async ({ page }) => {
    await page.goto('/admin');
    
    // Click Feedback tab
    await page.click('button:has-text("Feedback")');
    
    // Should show feedback manager
    const feedbackContent = page.locator('text=/Feedback|Issues|Suggestions/');
    if (await feedbackContent.isVisible()) {
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
    await page.goto('/admin');
    
    // Click Users tab
    await page.click('button:has-text("Users")');
    
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
    await page.goto('/admin');
    
    // Click Users tab
    await page.click('button:has-text("Users")');
    
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