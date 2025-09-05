import { test, expect } from '@playwright/test';

test('Verify User Management UI exists', async ({ page }) => {
  // Step 1: Navigate to login
  await page.goto('http://localhost:5173/login');
  await page.screenshot({ path: 'step1-login.png' });
  console.log('Step 1: At login page');
  
  // Step 2: Fill login form
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.screenshot({ path: 'step2-filled.png' });
  console.log('Step 2: Filled login form');
  
  // Step 3: Submit login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000); // Wait for redirect
  await page.screenshot({ path: 'step3-after-login.png' });
  console.log('Step 3: Logged in, current URL:', page.url());
  
  // Step 4: Navigate to admin
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step4-admin-page.png' });
  console.log('Step 4: At admin page, current URL:', page.url());
  
  // Step 5: Look for Users tab
  const usersTab = page.locator('button:has-text("Users")');
  const tabExists = await usersTab.isVisible();
  console.log('Step 5: Users tab visible:', tabExists);
  
  if (tabExists) {
    // Step 6: Click Users tab
    await usersTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step6-users-tab.png' });
    console.log('Step 6: Clicked Users tab');
    
    // Step 7: Check for user management UI
    const totalUsersText = await page.locator('text=Total Users').isVisible();
    const searchInput = await page.locator('input[placeholder*="Search"]').isVisible();
    const userTable = await page.locator('table').isVisible();
    
    console.log('Step 7: UI Elements Check:');
    console.log('  - Total Users text:', totalUsersText);
    console.log('  - Search input:', searchInput);
    console.log('  - User table:', userTable);
    
    // Final screenshot
    await page.screenshot({ path: 'final-user-management.png', fullPage: true });
    
    // Assertions
    expect(totalUsersText).toBeTruthy();
    expect(searchInput).toBeTruthy();
    expect(userTable).toBeTruthy();
    
    console.log('✅ User Management UI verified successfully!');
  } else {
    console.log('❌ Users tab not found on admin page');
    throw new Error('Users tab not visible');
  }
});