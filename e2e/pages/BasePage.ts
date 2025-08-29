import { Page, expect } from '@playwright/test';
import { TIMEOUTS, SELECTORS } from '../utils/test-constants';

/**
 * Base Page Object Model
 * Contains common functionality shared across all pages
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to load completely
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    
    // Wait for loading spinner to disappear if present
    const spinner = this.page.locator(SELECTORS.LOADING_SPINNER);
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.LONG });
    }
    
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Check for error messages on the page
   */
  async getErrorMessages(): Promise<string[]> {
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

  /**
   * Verify page title
   */
  async verifyTitle(expectedTitle: RegExp | string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Verify page heading
   */
  async verifyHeading(expectedHeading: string): Promise<void> {
    const heading = this.page.locator('h1').first();
    await expect(heading).toContainText(expectedHeading);
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Click navigation link
   */
  async clickNavigation(linkText: string): Promise<void> {
    await this.page.click(`text=${linkText}`);
    await this.waitForLoad();
  }

  /**
   * Verify navigation menu is present
   */
  async verifyNavigation(): Promise<void> {
    await expect(this.page.locator(SELECTORS.NAV_GAMES)).toBeVisible();
    await expect(this.page.locator(SELECTORS.NAV_POTLUCK)).toBeVisible();
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = TIMEOUTS.MEDIUM): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.count() > 0;
  }

  /**
   * Fill form field with proper waiting
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.waitForElement(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Click element with proper waiting
   */
  async clickElement(selector: string): Promise<void> {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.waitForElement(selector);
    await this.page.selectOption(selector, value);
  }

  /**
   * Get text content of element
   */
  async getTextContent(selector: string): Promise<string | null> {
    await this.waitForElement(selector);
    return await this.page.locator(selector).textContent();
  }

  /**
   * Check if text is visible on page
   */
  async isTextVisible(text: string): Promise<boolean> {
    const element = this.page.locator(`text=${text}`);
    return await element.isVisible();
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify current URL
   */
  async verifyURL(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}