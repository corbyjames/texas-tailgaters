import { test, expect } from '@playwright/test';

test('Admin access diagnostic test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', err => console.log('Page error:', err));
  
  console.log('1. Navigating to app...');
  await page.goto('http://localhost:5173');
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'test-screenshot-1.png' });
  console.log('Screenshot saved: test-screenshot-1.png');
  
  // Check if we're on login page
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  console.log('2. On login page?', isLoginPage);
  
  if (isLoginPage) {
    console.log('3. Filling login form...');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    console.log('4. Clicking sign in button...');
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait a bit for navigation
    console.log('5. Waiting for navigation...');
    await page.waitForTimeout(3000);
    
    // Take another screenshot
    await page.screenshot({ path: 'test-screenshot-2.png' });
    console.log('Screenshot saved: test-screenshot-2.png');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('6. Current URL:', currentUrl);
    
    // Check if admin link exists
    const adminLinkExists = await page.locator('nav').isVisible().catch(() => false);
    console.log('7. Navigation visible?', adminLinkExists);
    
    if (adminLinkExists) {
      const adminLink = await page.locator('a:has-text("Admin")').isVisible().catch(() => false);
      console.log('8. Admin link visible?', adminLink);
      
      // Get all nav links
      const navLinks = await page.locator('nav a').allTextContents();
      console.log('9. All nav links:', navLinks);
    }
    
    // Check if user is logged in by looking for sign out
    const signOutVisible = await page.locator('text=Sign Out').isVisible().catch(() => false);
    console.log('10. User logged in (Sign Out visible)?', signOutVisible);
  }
  
  // Final screenshot
  await page.screenshot({ path: 'test-screenshot-final.png' });
  console.log('Final screenshot saved: test-screenshot-final.png');
});