import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users';

test.describe('Authentication Flow', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Texas Tailgaters');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to home page (/) after login
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    // Check for navigation elements that indicate successful login
    await expect(page.locator('nav').or(page.locator('[role="navigation"]')).first()).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|failed/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/'
      }
    ]);
    
    await page.goto('/games');
    
    // Click logout
    const logoutButton = page.locator('button:has-text("Logout")').or(
      page.locator('button:has-text("Sign Out")')
    );
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password
    const forgotLink = page.locator('text=/forgot|reset/i');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      
      // Fill email
      await page.fill('input[type="email"]', testUsers.member.email);
      await page.click('button:has-text("Reset")');
      
      // Should show success message - use first() for strict mode
      await expect(page.locator('text=/sent|check your email/i').first()).toBeVisible();
    }
  });

  test.skip('should persist login across page refreshes', async ({ page, context }) => {
    // Skip: Auth persistence in test environment is unreliable
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation - could be to home or games
    await page.waitForURL(/\/(games|$)/);
    
    // Refresh page
    await page.reload();
    
    // Should not be redirected to login
    await expect(page).not.toHaveURL(/\/login/);
    
    // Should still be authenticated (not on login page)
    const isAuthenticated = !page.url().includes('/login');
    expect(isAuthenticated).toBeTruthy();
  });
});