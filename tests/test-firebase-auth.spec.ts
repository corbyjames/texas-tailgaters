import { test, expect } from '@playwright/test';

test('Firebase Authentication Test', async ({ page }) => {
  // Capture console messages
  const consoleLogs: any[] = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Go to login page
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  console.log('Testing Firebase authentication...\n');
  
  // Fill in test credentials
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  
  // Click sign in
  await page.click('button:has-text("Sign In")');
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Check results
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check for errors in console
  const errors = consoleLogs.filter(log => log.type === 'error');
  if (errors.length > 0) {
    console.log('\n❌ Console errors found:');
    errors.forEach(err => console.log('  -', err.text));
  }
  
  // Check for warnings
  const warnings = consoleLogs.filter(log => log.type === 'warning');
  if (warnings.length > 0) {
    console.log('\n⚠️ Console warnings:');
    warnings.forEach(warn => console.log('  -', warn.text));
  }
  
  // Check for auth-related logs
  const authLogs = consoleLogs.filter(log => 
    log.text.toLowerCase().includes('auth') || 
    log.text.toLowerCase().includes('firebase') ||
    log.text.toLowerCase().includes('sign')
  );
  
  if (authLogs.length > 0) {
    console.log('\n📝 Auth-related logs:');
    authLogs.forEach(log => console.log(`  [${log.type}]`, log.text));
  }
  
  // Check if login was successful
  if (!currentUrl.includes('/login')) {
    console.log('\n✅ Login successful! Redirected to:', currentUrl);
  } else {
    console.log('\n❌ Login failed - still on login page');
    
    // Check for error messages on page
    const errorMessages = await page.locator('.text-red-500, .text-red-600, .error, [role="alert"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages on page:', errorMessages);
    }
  }
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'firebase-auth-test.png' });
  console.log('\nScreenshot saved as firebase-auth-test.png');
});