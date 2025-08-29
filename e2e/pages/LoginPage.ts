import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS, SELECTORS, TIMEOUTS } from '../utils/test-constants';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Page elements
  private emailInput = this.page.locator(SELECTORS.EMAIL_INPUT);
  private passwordInput = this.page.locator(SELECTORS.PASSWORD_INPUT);
  private signInButton = this.page.locator(SELECTORS.SIGN_IN_BUTTON);
  private signUpButton = this.page.locator(SELECTORS.SIGN_UP_BUTTON);
  private nameInput = this.page.locator('input[placeholder*="name" i], input[name="name"]');
  private confirmPasswordInput = this.page.locator('input[placeholder*="confirm" i]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto(URLS.LOGIN);
  }

  /**
   * Verify login page elements are present
   */
  async verifyPageElements(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  /**
   * Sign in with credentials
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
  }

  /**
   * Click sign up button to show sign up form
   */
  async clickSignUp(): Promise<void> {
    await this.signUpButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Fill sign up form
   */
  async signUp(name: string, email: string, password: string): Promise<void> {
    await this.clickSignUp();
    
    // Wait for sign up form to appear
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill(name);
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      
      if (await this.confirmPasswordInput.isVisible()) {
        await this.confirmPasswordInput.fill(password);
      }
      
      // Submit sign up form
      const submitButton = this.page.getByRole('button', { name: /sign up|create account|register/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
      }
    }
  }

  /**
   * Verify sign in was successful (redirected away from login)
   */
  async verifySignInSuccess(): Promise<void> {
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
    await expect(this.page).not.toHaveURL(/.*\/login/);
  }

  /**
   * Verify sign in failed (still on login page)
   */
  async verifySignInFailure(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/login/);
  }

  /**
   * Verify validation error for empty form
   */
  async verifyEmptyFormValidation(): Promise<void> {
    await this.signInButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
    
    // Should still be on login page
    await this.verifySignInFailure();
  }

  /**
   * Verify validation error for invalid email
   */
  async verifyInvalidEmailValidation(): Promise<void> {
    await this.emailInput.fill('invalid-email');
    await this.passwordInput.fill('password123');
    await this.signInButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
    
    // Should still be on login page
    await this.verifySignInFailure();
  }

  /**
   * Check for specific error message
   */
  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    const errorMessages = await this.getErrorMessages();
    const hasExpectedMessage = errorMessages.some(msg => 
      msg.toLowerCase().includes(expectedMessage.toLowerCase())
    );
    expect(hasExpectedMessage).toBeTruthy();
  }

  /**
   * Verify no error messages are present
   */
  async verifyNoErrors(): Promise<void> {
    const errorMessages = await this.getErrorMessages();
    expect(errorMessages).toHaveLength(0);
  }

  /**
   * Test form validation
   */
  async testFormValidation(): Promise<void> {
    // Test empty form
    await this.verifyEmptyFormValidation();
    
    // Test invalid email
    await this.verifyInvalidEmailValidation();
    
    // Clear form
    await this.emailInput.fill('');
    await this.passwordInput.fill('');
  }

  /**
   * Check if sign up form is visible
   */
  async isSignUpFormVisible(): Promise<boolean> {
    return await this.nameInput.isVisible();
  }

  /**
   * Verify page title
   */
  async verifyTitle(): Promise<void> {
    await this.verifyTitle(/Texas Tailgaters/);
  }

  /**
   * Toggle between sign in and sign up
   */
  async toggleToSignUp(): Promise<void> {
    if (!await this.isSignUpFormVisible()) {
      await this.clickSignUp();
    }
  }

  /**
   * Toggle back to sign in
   */
  async toggleToSignIn(): Promise<void> {
    const signInToggle = this.page.getByRole('button', { name: /sign in|login/i });
    if (await signInToggle.isVisible()) {
      await signInToggle.click();
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.emailInput.fill('');
    await this.passwordInput.fill('');
    
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill('');
    }
    
    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill('');
    }
  }
}