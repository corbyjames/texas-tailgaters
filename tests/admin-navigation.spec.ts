import { test, expect } from '@playwright/test';

test('Admin Navigation Test', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Wait for navigation to be loaded
  await page.waitForSelector('nav', { timeout: 5000 });
  
  // Find admin link
  const adminLink = page.locator('nav a:has-text("Admin")');
  await expect(adminLink).toBeVisible({ timeout: 5000 });
  
  // Get the href attribute
  const href = await adminLink.getAttribute('href');
  console.log('Admin link href:', href);
  
  // Try clicking with different methods
  console.log('Method 1: Standard click');
  await adminLink.click();
  await page.waitForTimeout(2000);
  console.log('URL after click:', page.url());
  
  // If not on admin page, try force navigation
  if (!page.url().includes('/admin')) {
    console.log('Method 2: Force navigation');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(2000);
    console.log('URL after goto:', page.url());
  }
  
  // Check final state
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  // Check for admin content
  const hasAdminDashboard = await page.locator('h1:has-text("Admin Dashboard")').isVisible().catch(() => false);
  const hasAccessDenied = await page.locator('text=Access Denied').isVisible().catch(() => false);
  
  console.log('Has Admin Dashboard:', hasAdminDashboard);
  console.log('Has Access Denied:', hasAccessDenied);
  
  // Take screenshot
  await page.screenshot({ path: 'admin-navigation-test.png' });
  
  // Assert we're on admin page
  expect(finalUrl).toContain('/admin');
  expect(hasAdminDashboard).toBe(true);
  expect(hasAccessDenied).toBe(false);
});