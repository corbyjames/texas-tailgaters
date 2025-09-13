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
  
  // Wait for navigation
  await page.waitForURL(/\/games|\/$/);
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