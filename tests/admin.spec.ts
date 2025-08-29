import { test, expect } from '@playwright/test';

// Test credentials
const TEST_ADMIN = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

const REGULAR_USER = {
  email: 'regular@test.com',
  password: 'TestPassword123!'
};

test.describe('Admin Access Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
  });

  test('should allow admin user to access admin page', async ({ page }) => {
    console.log('Testing admin access...');
    
    // Check if we're on login page
    const loginButton = page.locator('button:has-text("Sign In")');
    if (await loginButton.isVisible()) {
      console.log('On login page, signing in as admin...');
      
      // Fill in login form
      await page.fill('input[type="email"]', TEST_ADMIN.email);
      await page.fill('input[type="password"]', TEST_ADMIN.password);
      
      // Click sign in
      await loginButton.click();
      
      // Wait for navigation
      await page.waitForURL('**/');
      console.log('Logged in successfully');
    }
    
    // Check if admin link appears in bottom navigation
    await page.waitForSelector('nav', { timeout: 5000 });
    const adminLink = page.locator('nav a:has-text("Admin")');
    
    // Verify admin link is visible
    await expect(adminLink).toBeVisible({ timeout: 5000 });
    console.log('✅ Admin link is visible in navigation');
    
    // Click on admin link
    await adminLink.click();
    
    // Wait for admin page to load
    await page.waitForURL('**/admin');
    
    // Verify we're on the admin page
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    console.log('✅ Successfully accessed admin dashboard');
    
    // Check for admin features
    await expect(page.locator('h2:has-text("Data Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Mock Data")')).toBeVisible();
    await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
    console.log('✅ All admin features are visible');
  });

  test('should show admin email in user management section', async ({ page }) => {
    // Sign in as admin
    const loginButton = page.locator('button:has-text("Sign In")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', TEST_ADMIN.email);
      await page.fill('input[type="password"]', TEST_ADMIN.password);
      await loginButton.click();
      await page.waitForURL('**/');
    }
    
    // Navigate to admin page
    await page.locator('nav a:has-text("Admin")').click();
    await page.waitForURL('**/admin');
    
    // Check user email is displayed
    await expect(page.locator(`text=Email: ${TEST_ADMIN.email}`)).toBeVisible();
    await expect(page.locator('text=Role:')).toBeVisible();
    console.log('✅ User information displayed correctly');
  });

  test('should be able to clear mock data', async ({ page }) => {
    // Sign in as admin
    const loginButton = page.locator('button:has-text("Sign In")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', TEST_ADMIN.email);
      await page.fill('input[type="password"]', TEST_ADMIN.password);
      await loginButton.click();
      await page.waitForURL('**/');
    }
    
    // Navigate to admin page
    await page.locator('nav a:has-text("Admin")').click();
    await page.waitForURL('**/admin');
    
    // Click clear mock data button
    await page.locator('button:has-text("Clear Mock Data")').click();
    
    // Confirm the action
    const confirmButton = page.locator('button:has-text("Yes, Clear Data")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // Wait for success message
    await expect(page.locator('text=Mock data cleared successfully')).toBeVisible({ timeout: 5000 });
    console.log('✅ Mock data cleared successfully');
  });

  test('should display game statistics on admin dashboard', async ({ page }) => {
    // Sign in as admin
    const loginButton = page.locator('button:has-text("Sign In")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', TEST_ADMIN.email);
      await page.fill('input[type="password"]', TEST_ADMIN.password);
      await loginButton.click();
      await page.waitForURL('**/');
    }
    
    // Navigate to admin page
    await page.locator('nav a:has-text("Admin")').click();
    await page.waitForURL('**/admin');
    
    // Check for statistics
    await expect(page.locator('p:has-text("Total Games")')).toBeVisible();
    await expect(page.locator('p:has-text("Planned Games")').first()).toBeVisible();
    await expect(page.locator('p:has-text("Unplanned Games")').first()).toBeVisible();
    await expect(page.locator('p:has-text("Expected Attendance")')).toBeVisible();
    console.log('✅ All statistics are displayed');
  });

  test('should persist login across page refreshes', async ({ page }) => {
    // Sign in as admin
    const loginButton = page.locator('button:has-text("Sign In")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', TEST_ADMIN.email);
      await page.fill('input[type="password"]', TEST_ADMIN.password);
      await loginButton.click();
      await page.waitForURL('**/');
    }
    
    // Verify admin link is visible
    await expect(page.locator('nav a:has-text("Admin")')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify admin link is still visible after refresh
    await expect(page.locator('nav a:has-text("Admin")')).toBeVisible({ timeout: 10000 });
    console.log('✅ Admin access persists after page refresh');
  });
});

test.describe('Non-Admin Access Tests', () => {
  test('should not show admin link for non-admin users', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Create a regular user account
    await page.locator('button:has-text("Don\'t have an account")').click();
    
    const timestamp = Date.now();
    const regularEmail = `user_${timestamp}@test.com`;
    
    await page.fill('input[id="name"]', 'Regular User');
    await page.fill('input[type="email"]', regularEmail);
    await page.fill('input[type="password"]', 'RegularPassword123!');
    
    await page.locator('button:has-text("Create Account")').click();
    
    // Wait for successful signup
    await page.waitForURL('**/');
    
    // Check that admin link is NOT visible
    const adminLink = page.locator('nav a:has-text("Admin")');
    await expect(adminLink).not.toBeVisible();
    console.log('✅ Admin link correctly hidden for non-admin users');
  });

  test('should show access denied when trying to access admin URL directly', async ({ page }) => {
    // Create and sign in as regular user
    await page.goto('http://localhost:5173');
    
    const timestamp = Date.now();
    const regularEmail = `user_${timestamp}@test.com`;
    
    await page.locator('button:has-text("Don\'t have an account")').click();
    await page.fill('input[id="name"]', 'Regular User');
    await page.fill('input[type="email"]', regularEmail);
    await page.fill('input[type="password"]', 'RegularPassword123!');
    await page.locator('button:has-text("Create Account")').click();
    await page.waitForURL('**/');
    
    // Try to navigate directly to admin page
    await page.goto('http://localhost:5173/admin');
    
    // Wait a moment for redirect
    await page.waitForTimeout(2000);
    
    // Verify user cannot access admin page - should be redirected
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    
    // Verify admin dashboard is not visible
    await expect(page.locator('h1:has-text("Admin Dashboard")')).not.toBeVisible();
    console.log('✅ Non-admin users correctly blocked from admin page');
  });
});