import { Page } from '@playwright/test';
import { testUsers } from '../fixtures/users';

export async function loginAsUser(page: Page, userType: 'admin' | 'member' = 'member') {
  const user = testUsers[userType];
  
  // Go to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  try {
    // Wait for navigation to home page or any non-login page
    await page.waitForURL(/^http:\/\/localhost:\d+\/((?!login).)*$/, { timeout: 5000 });
    
    // Additional wait to ensure page is fully loaded
    await page.waitForSelector('nav, [role="navigation"]', { timeout: 5000 });
  } catch (error) {
    // If login fails, check for Firebase error
    const errorMessage = await page.locator('text=/Firebase|invalid-credential/').first().isVisible();
    if (errorMessage) {
      console.log(`Warning: Firebase authentication failed for ${user.email}`);
      // Continue anyway for tests that don't require auth
    }
    throw error;
  }
}

export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout")').or(
    page.locator('button:has-text("Sign Out")')
  );
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/login/);
  }
}