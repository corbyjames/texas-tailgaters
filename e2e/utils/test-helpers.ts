import { Page, expect } from '@playwright/test';
import { TIMEOUTS, SELECTORS, VIEWPORT_SIZES } from './test-constants';

/**
 * General Test Helper Functions
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoadingComplete(): Promise<void> {
    const spinner = this.page.locator(SELECTORS.LOADING_SPINNER);
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.LONG });
    }
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Check for JavaScript errors in console
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }

  /**
   * Verify responsive design at different viewport sizes
   */
  async testResponsiveDesign(testCallback: () => Promise<void>): Promise<void> {
    const viewports = Object.entries(VIEWPORT_SIZES);
    
    for (const [name, size] of viewports) {
      console.log(`Testing responsive design at ${name}: ${size.width}x${size.height}`);
      
      await this.page.setViewportSize(size);
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
      await testCallback();
    }
  }

  /**
   * Fill form field with proper waiting
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.fill(selector, value);
  }

  /**
   * Click element with proper waiting
   */
  async clickElement(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.click(selector);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = TIMEOUTS.MEDIUM): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Check if element exists without waiting
   */
  async elementExists(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.count() > 0;
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for network requests to complete
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page performance
   */
  async verifyPagePerformance(): Promise<void> {
    const navigationTiming = await this.page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });

    // Basic performance assertions
    expect(navigationTiming.loadTime).toBeLessThan(5000); // 5 seconds max
    expect(navigationTiming.domContentLoaded).toBeLessThan(3000); // 3 seconds max
  }

  /**
   * Handle dialog boxes (alerts, confirms, prompts)
   */
  async handleDialog(accept = true): Promise<void> {
    this.page.on('dialog', async dialog => {
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Upload file
   */
  async uploadFile(fileSelector: string, filePath: string): Promise<void> {
    const fileInput = this.page.locator(fileSelector);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Verify accessibility basics
   */
  async verifyBasicAccessibility(): Promise<void> {
    // Check for alt text on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const hasAlt = alt !== null && alt !== '';
      
      if (!hasAlt) {
        const src = await img.getAttribute('src');
        console.warn(`Image without alt text found: ${src}`);
      }
    }

    // Check for form labels
    const inputs = this.page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
          const type = await input.getAttribute('type');
          const placeholder = await input.getAttribute('placeholder');
          console.warn(`Input without proper label: type=${type}, placeholder=${placeholder}`);
        }
      }
    }
  }

  /**
   * Compare visual screenshots
   */
  async compareVisual(name: string, options: { threshold?: number } = {}): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold: options.threshold || 0.2,
      mode: 'rgb'
    });
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<void> {
    // Test Tab navigation
    await this.page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key on focused button
    const focusedTag = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    if (focusedTag === 'button' || focusedTag === 'a') {
      // Store current URL to detect navigation
      const currentUrl = this.page.url();
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
    }
  }

  /**
   * Mock network requests for testing
   */
  async mockApiCall(url: string | RegExp, response: any): Promise<void> {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Clear browser storage
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}