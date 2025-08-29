import { Page, expect } from '@playwright/test';
import { TEST_USERS, URLS, TIMEOUTS, SELECTORS } from './test-constants';

/**
 * Authentication Helper Functions
 */

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Log in with test user credentials
   */
  async loginAsTestUser(): Promise<void> {
    await this.login(TEST_USERS.STANDARD.email, TEST_USERS.STANDARD.password);
  }

  /**
   * Log in with admin user credentials
   */
  async loginAsAdmin(): Promise<void> {
    await this.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
  }

  /**
   * Generic login method
   */
  async login(email: string, password: string): Promise<void> {
    // Go to login page if not already there
    if (!this.page.url().includes('/login')) {
      await this.page.goto(URLS.LOGIN);
    }
    
    await this.page.waitForLoadState('networkidle');

    // Fill in credentials
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
    await this.page.fill(SELECTORS.PASSWORD_INPUT, password);

    // Click sign in
    await this.page.click(SELECTORS.SIGN_IN_BUTTON);

    // Wait for navigation away from login page
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
    
    // Verify we're no longer on login page
    await expect(this.page).not.toHaveURL(/.*\/login/);
  }

  /**
   * Attempt login with invalid credentials
   */
  async attemptInvalidLogin(): Promise<void> {
    await this.page.goto(URLS.LOGIN);
    await this.page.waitForLoadState('networkidle');

    await this.page.fill(SELECTORS.EMAIL_INPUT, TEST_USERS.INVALID.email);
    await this.page.fill(SELECTORS.PASSWORD_INPUT, TEST_USERS.INVALID.password);
    
    await this.page.click(SELECTORS.SIGN_IN_BUTTON);
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Should still be on login page
    await expect(this.page).toHaveURL(/.*\/login/);
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    // Look for logout button/link
    const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out"), text=Logout, text=Sign Out');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // If no logout button visible, try user menu
      const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.click('button:has-text("Logout"), button:has-text("Sign Out")');
      }
    }

    // Wait to be redirected to login
    await this.page.waitForURL(/.*\/login/, { timeout: TIMEOUTS.LONG });
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const currentUrl = this.page.url();
    return !currentUrl.includes('/login');
  }

  /**
   * Verify authentication state
   */
  async verifyAuthenticatedState(): Promise<void> {
    // Should not be on login page
    await expect(this.page).not.toHaveURL(/.*\/login/);
    
    // Should have user-specific content or navigation
    const authIndicators = this.page.locator(
      'text=Games, text=Potluck, [data-testid="user-menu"], .user-menu'
    );
    await expect(authIndicators.first()).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify unauthenticated state
   */
  async verifyUnauthenticatedState(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/login/);
    await expect(this.page.locator(SELECTORS.SIGN_IN_BUTTON)).toBeVisible();
  }

  /**
   * Wait for authentication to complete
   */
  async waitForAuthCompletion(): Promise<void> {
    // Wait for loading spinner to disappear if present
    const spinner = this.page.locator(SELECTORS.LOADING_SPINNER);
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.LONG });
    }

    // Wait a bit more for UI to settle
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Handle authentication errors
   */
  async checkForAuthErrors(): Promise<string[]> {
    const errorElements = this.page.locator(SELECTORS.ERROR_MESSAGE);
    const errors: string[] = [];
    
    const count = await errorElements.count();
    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText);
      }
    }
    
    return errors;
  }
}