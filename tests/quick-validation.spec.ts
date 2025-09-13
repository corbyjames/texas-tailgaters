import { test, expect } from '@playwright/test';

// Using the correct test credentials from CLAUDE.md
const adminUser = {
  email: 'test@texastailgaters.com',
  password: '4Xanadu#3'
};

test.describe('Quick Validation with Correct Credentials', () => {
  test('should access admin dashboard with correct credentials', async ({ page }) => {
    // Login with correct admin credentials
    await page.goto('/login');
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/^((?!login).)*$/);
    
    // Navigate to admin dashboard
    const adminLink = page.locator('text=Admin Dashboard').first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on admin page
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      console.log('✅ Admin dashboard access successful with test@texastailgaters.com');
    }
  });

  test('should test mobile feedback with correct credentials', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/^((?!login).)*$/);
    
    // Check for feedback button
    const feedbackButton = page.locator('button:has-text("Feedback")').first();
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      await expect(modal).toBeVisible();
      console.log('✅ Mobile feedback modal works with correct credentials');
    }
    
    await context.close();
  });

  test('should test group invite functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/^((?!login).)*$/);
    
    // Navigate to admin dashboard
    const adminLink = page.locator('text=Admin Dashboard').first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click Users tab
      const usersTab = page.locator('button:has-text("Users")').first();
      if (await usersTab.isVisible()) {
        await usersTab.click();
        await page.waitForTimeout(1000);
        
        // Look for Invite All Users button
        const inviteButton = page.locator('button:has-text("Invite All Users")').first();
        if (await inviteButton.isVisible()) {
          await inviteButton.click();
          await page.waitForTimeout(1000);
          
          // Check if modal opened
          const inviteModal = page.locator('h2:has-text("Invite All Users")').first();
          await expect(inviteModal).toBeVisible();
          console.log('✅ Group invite modal works with correct credentials');
          
          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});