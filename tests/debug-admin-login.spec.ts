import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/users';

test.describe('Debug Admin Login', () => {
  test('should login as admin and check user status', async ({ page }) => {
    const adminUser = testUsers.admin;
    console.log('Testing with admin user:', adminUser.email);
    
    // Go to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png' });
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for any navigation
    await page.waitForTimeout(3000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png' });
    
    // Log current URL
    console.log('Current URL after login:', page.url());
    
    // Check if we're logged in
    const isOnLoginPage = page.url().includes('/login');
    console.log('Still on login page?', isOnLoginPage);
    
    // Try to navigate to admin
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Take screenshot on admin page
    await page.screenshot({ path: 'test-results/admin-page.png' });
    
    // Log final URL
    console.log('URL after navigating to /admin:', page.url());
    
    // Check what's on the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Has Admin Dashboard text:', pageContent.includes('Admin Dashboard'));
    console.log('Has login form:', pageContent.includes('Sign in'));
    
    // Check for any error messages
    const errorMessages = await page.locator('text=/error|invalid|failed/i').all();
    if (errorMessages.length > 0) {
      for (const error of errorMessages) {
        console.log('Error found:', await error.textContent());
      }
    }
  });
});