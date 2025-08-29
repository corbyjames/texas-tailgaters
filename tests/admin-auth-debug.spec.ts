import { test, expect } from '@playwright/test';

test('Debug Auth State', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Admin page') || msg.text().includes('user')) {
      console.log('Browser console:', msg.text());
    }
  });
  
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
  
  // Check localStorage for auth data
  const authData = await page.evaluate(() => {
    return {
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>),
      sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
        acc[key] = sessionStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    };
  });
  
  console.log('Auth Storage:', JSON.stringify(authData, null, 2));
  
  // Wait for navigation to be loaded
  await page.waitForSelector('nav', { timeout: 5000 });
  
  // Check if admin link is visible
  const adminLink = page.locator('nav a:has-text("Admin")');
  const isAdminVisible = await adminLink.isVisible();
  console.log('Admin link visible:', isAdminVisible);
  
  if (isAdminVisible) {
    // Try to click admin link
    console.log('Clicking admin link...');
    await adminLink.click();
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Check auth data again after navigation
    const authDataAfter = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>),
        url: window.location.href
      };
    });
    
    console.log('After navigation:', JSON.stringify(authDataAfter, null, 2));
  }
  
  // Check current page content
  const pageContent = await page.locator('body').textContent();
  console.log('Page contains "Sign In":', pageContent?.includes('Sign In'));
  console.log('Page contains "Admin Dashboard":', pageContent?.includes('Admin Dashboard'));
  
  // Take screenshot
  await page.screenshot({ path: 'auth-debug.png' });
});