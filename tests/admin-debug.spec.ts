import { test, expect } from '@playwright/test';

test('Debug Admin Navigation', async ({ page }) => {
  // Enable ALL console logging
  page.on('console', msg => console.log('Browser:', msg.text()));
  
  console.log('1. Navigating to app...');
  await page.goto('http://localhost:5173');
  
  // Login
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
  }
  
  console.log('2. Current URL after login:', page.url());
  
  // Find and examine the admin link
  const adminLink = page.locator('nav a:has-text("Admin")');
  const isVisible = await adminLink.isVisible();
  console.log('3. Admin link visible?', isVisible);
  
  if (isVisible) {
    // Get the href attribute
    const href = await adminLink.getAttribute('href');
    console.log('4. Admin link href:', href);
    
    // Get all attributes
    const allAttrs = await adminLink.evaluate(el => {
      const attrs: any = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });
    console.log('5. Admin link attributes:', allAttrs);
    
    console.log('6. Clicking admin link...');
    await adminLink.click();
    
    // Wait a bit and check URL
    await page.waitForTimeout(2000);
    console.log('7. URL after click:', page.url());
    
    // Check if we got redirected
    const currentContent = await page.locator('body').textContent();
    console.log('8. Page contains "Admin Dashboard"?', currentContent?.includes('Admin Dashboard'));
    console.log('9. Page contains "Access Denied"?', currentContent?.includes('Access Denied'));
    console.log('10. Page contains "Sign In"?', currentContent?.includes('Sign In'));
    
    // Try direct navigation
    console.log('\n11. Trying direct navigation to /admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(2000);
    
    console.log('12. URL after direct navigation:', page.url());
    const afterDirectNav = await page.locator('body').textContent();
    console.log('13. Page contains "Admin Dashboard"?', afterDirectNav?.includes('Admin Dashboard'));
    console.log('14. Page contains "Access Denied"?', afterDirectNav?.includes('Access Denied'));
    
    // Screenshot final state
    await page.screenshot({ path: 'admin-debug-final.png' });
    console.log('15. Screenshot saved as admin-debug-final.png');
  }
});