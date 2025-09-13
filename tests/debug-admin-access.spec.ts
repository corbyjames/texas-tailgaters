import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/users';

test.describe('Debug Admin Access', () => {
  test('should check admin access after login', async ({ page }) => {
    const adminUser = testUsers.admin;
    
    // Add console log listener to capture browser console
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });
    
    // Go to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home
    await page.waitForURL(/^http:\/\/localhost:\d+\/$/);
    
    // Check if Admin link is visible
    const adminLinkInNav = page.locator('a:has-text("Admin")').first();
    const adminDashboardLink = page.locator('text=Admin Dashboard').first();
    
    console.log('Admin link in nav visible?', await adminLinkInNav.isVisible());
    console.log('Admin Dashboard link visible?', await adminDashboardLink.isVisible());
    
    // Try clicking the Admin Dashboard link from Quick Actions
    if (await adminDashboardLink.isVisible()) {
      console.log('Clicking Admin Dashboard link...');
      await adminDashboardLink.click();
      await page.waitForTimeout(2000);
      console.log('URL after clicking Admin Dashboard:', page.url());
      
      // Check page content
      const hasAdminHeading = await page.locator('h1:has-text("Admin Dashboard")').isVisible();
      console.log('Has Admin Dashboard heading?', hasAdminHeading);
    }
    
    // Also try the Admin link in nav
    if (await adminLinkInNav.isVisible()) {
      console.log('Clicking Admin nav link...');
      await page.goto('/'); // Go back home first
      await adminLinkInNav.click();
      await page.waitForTimeout(2000);
      console.log('URL after clicking Admin nav link:', page.url());
      
      // Check page content
      const hasAdminHeading = await page.locator('h1:has-text("Admin Dashboard")').isVisible();
      console.log('Has Admin Dashboard heading after nav click?', hasAdminHeading);
    }
    
    // Try direct navigation with better wait
    console.log('Trying direct navigation to /admin...');
    await page.goto('/admin');
    
    // Wait for either admin page or redirect
    await Promise.race([
      page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 5000 }).catch(() => null),
      page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => null)
    ]);
    
    console.log('Final URL:', page.url());
    const finalHasAdminHeading = await page.locator('h1:has-text("Admin Dashboard")').isVisible().catch(() => false);
    console.log('Final has Admin Dashboard heading?', finalHasAdminHeading);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-access-final.png' });
  });
});