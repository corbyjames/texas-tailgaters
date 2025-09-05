import { test, expect } from '@playwright/test';

test('Admin can access User Management', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:5173/login');
  
  // Login as test admin
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  // Wait for navigation - could redirect to home or games
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/games', { timeout: 10000 });
  
  // Navigate to admin page
  await page.goto('http://localhost:5173/admin');
  
  // Verify admin dashboard loads
  await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 });
  
  // Click on Users tab
  await page.click('button:has-text("Users")');
  
  // Verify user management interface loads
  await expect(page.locator('text=Total Users')).toBeVisible({ timeout: 10000 });
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'user-management-test.png', fullPage: true });
  
  console.log('✅ User Management interface is accessible');
});