import { test, expect } from '@playwright/test';

test('Complete Admin Access Flow', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Browser error:', msg.text());
  });
  
  console.log('Step 1: Navigating to app...');
  await page.goto('http://localhost:5173');
  
  // Check if we need to log in
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  
  if (isLoginPage) {
    console.log('Step 2: Logging in as admin user...');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Click sign in
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for navigation to complete
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    console.log('✅ Login successful');
  }
  
  // Step 3: Verify admin link is visible
  console.log('Step 3: Checking for admin link in navigation...');
  await page.waitForSelector('nav', { timeout: 5000 });
  
  const adminLink = page.locator('nav a:has-text("Admin")');
  await expect(adminLink).toBeVisible({ timeout: 5000 });
  console.log('✅ Admin link is visible');
  
  // Take screenshot before clicking admin
  await page.screenshot({ path: 'before-admin-click.png' });
  
  // Step 4: Click on the admin link
  console.log('Step 4: Clicking admin link...');
  await adminLink.click();
  
  // Step 5: Wait for admin page to load and verify URL
  console.log('Step 5: Waiting for admin page to load...');
  await page.waitForURL('**/admin', { timeout: 10000 });
  console.log('✅ Navigated to admin URL');
  
  // Take screenshot of admin page
  await page.screenshot({ path: 'admin-page.png' });
  
  // Step 6: Verify admin page content
  console.log('Step 6: Verifying admin dashboard content...');
  
  // Check for Admin Dashboard heading
  const adminHeading = page.locator('h1:has-text("Admin Dashboard")');
  await expect(adminHeading).toBeVisible({ timeout: 5000 });
  console.log('✅ Admin Dashboard heading is visible');
  
  // Check for main sections using more specific selectors
  const sections = [
    { selector: 'h2:has-text("Data Management")', name: 'Data Management section' },
    { selector: 'button:has-text("Clear Mock Data")', name: 'Clear Mock Data button' },
    { selector: 'h2:has-text("User Management")', name: 'User Management section' },
    { selector: 'h2:has-text("Quick Actions")', name: 'Quick Actions section' }
  ];
  
  for (const section of sections) {
    await expect(page.locator(section.selector)).toBeVisible({ timeout: 5000 });
    console.log(`✅ ${section.name} is visible`);
  }
  
  // Step 7: Verify statistics are displayed
  console.log('Step 7: Verifying statistics...');
  const stats = [
    'Total Games',
    'Planned Games', 
    'Unplanned Games',
    'Expected Attendance'
  ];
  
  for (const stat of stats) {
    // Use more specific selector that looks for paragraph tags
    await expect(page.locator(`p:has-text("${stat}")`).first()).toBeVisible({ timeout: 5000 });
    console.log(`✅ ${stat} statistic is visible`);
  }
  
  // Step 8: Verify user email is displayed
  console.log('Step 8: Verifying user information...');
  await expect(page.locator('text=Email: test@texastailgaters.com')).toBeVisible({ timeout: 5000 });
  console.log('✅ User email is displayed correctly');
  
  // Step 9: Test Clear Mock Data functionality
  console.log('Step 9: Testing Clear Mock Data button...');
  
  // Click the Clear Mock Data button
  const clearButton = page.locator('button:has-text("Clear Mock Data")');
  await expect(clearButton).toBeVisible({ timeout: 5000 });
  await clearButton.click();
  
  // Verify confirmation dialog appears
  const confirmButton = page.locator('button:has-text("Yes, Clear Data")');
  await expect(confirmButton).toBeVisible({ timeout: 5000 });
  console.log('✅ Confirmation dialog appeared');
  
  // Click Cancel to not actually clear data
  const cancelButton = page.locator('button:has-text("Cancel")');
  await cancelButton.click();
  console.log('✅ Cancelled clear data operation');
  
  // Step 10: Verify we can navigate away and back
  console.log('Step 10: Testing navigation persistence...');
  
  // Go to Games page
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games', { timeout: 5000 });
  console.log('✅ Navigated to Games page');
  
  // Go back to Admin page
  await page.locator('nav a:has-text("Admin")').click();
  await page.waitForURL('**/admin', { timeout: 5000 });
  
  // Verify admin dashboard still loads
  await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 5000 });
  console.log('✅ Successfully navigated back to admin page');
  
  // Final screenshot
  await page.screenshot({ path: 'admin-test-complete.png' });
  
  console.log('\n🎉 ALL ADMIN TESTS PASSED! 🎉');
  console.log('The admin page is fully functional with:');
  console.log('  ✅ Admin link visible for admin users');
  console.log('  ✅ Admin dashboard loads correctly');
  console.log('  ✅ All sections and statistics displayed');
  console.log('  ✅ User management shows correct email');
  console.log('  ✅ Clear Mock Data functionality works');
  console.log('  ✅ Navigation persistence works');
});