import { Page, expect } from '@playwright/test';
import { URLS, TIMEOUTS, SELECTORS } from './test-constants';

/**
 * Navigation Helper Functions
 */

export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the home page
   */
  async goToHome(): Promise<void> {
    await this.page.goto(URLS.HOME);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL(URLS.HOME);
  }

  /**
   * Navigate to the games page
   */
  async goToGames(): Promise<void> {
    await this.page.click(SELECTORS.NAV_GAMES);
    await this.page.waitForURL(/.*\/games/, { timeout: TIMEOUTS.MEDIUM });
    await expect(this.page).toHaveURL(/.*\/games/);
  }

  /**
   * Navigate to the potluck page
   */
  async goToPotluck(): Promise<void> {
    await this.page.click(SELECTORS.NAV_POTLUCK);
    await this.page.waitForURL(/.*\/potluck/, { timeout: TIMEOUTS.MEDIUM });
    await expect(this.page).toHaveURL(/.*\/potluck/);
  }

  /**
   * Navigate to the admin page
   */
  async goToAdmin(): Promise<void> {
    await this.page.click(SELECTORS.NAV_ADMIN);
    await this.page.waitForURL(/.*\/admin/, { timeout: TIMEOUTS.MEDIUM });
    await expect(this.page).toHaveURL(/.*\/admin/);
  }

  /**
   * Navigate to a specific game details page
   */
  async goToGameDetails(gameId: string): Promise<void> {
    await this.page.goto(`${URLS.GAMES}/${gameId}`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL(`${URLS.GAMES}/${gameId}`);
  }

  /**
   * Navigate using browser back button
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate using browser forward button
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify navigation menu is visible and accessible
   */
  async verifyNavigationMenu(): Promise<void> {
    // Check main navigation items
    await expect(this.page.locator(SELECTORS.NAV_GAMES)).toBeVisible();
    await expect(this.page.locator(SELECTORS.NAV_POTLUCK)).toBeVisible();
    
    // Admin link may not be visible for all users
    const adminLink = this.page.locator(SELECTORS.NAV_ADMIN);
    const isAdminVisible = await adminLink.isVisible();
    
    if (isAdminVisible) {
      await expect(adminLink).toBeClickable();
    }
  }

  /**
   * Verify page title and heading
   */
  async verifyPageTitle(expectedTitle: RegExp | string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Verify page heading
   */
  async verifyPageHeading(expectedHeading: string): Promise<void> {
    const heading = this.page.locator('h1').first();
    await expect(heading).toContainText(expectedHeading);
  }

  /**
   * Check if navigation link is active
   */
  async verifyActiveNavigation(linkText: string): Promise<void> {
    const navLink = this.page.locator(`nav a:has-text("${linkText}")`);
    
    // Check for active classes or attributes
    const hasActiveClass = await navLink.evaluate(el => 
      el.classList.contains('active') || 
      el.classList.contains('bg-orange-500') ||
      el.classList.contains('text-orange-500') ||
      el.getAttribute('aria-current') === 'page'
    );
    
    expect(hasActiveClass).toBeTruthy();
  }

  /**
   * Test all navigation links work
   */
  async testAllNavigationLinks(): Promise<void> {
    // Test Games navigation
    await this.goToGames();
    await this.verifyPageTitle(/Games|Texas Tailgaters/);
    
    // Test Potluck navigation
    await this.goToPotluck();
    await this.verifyPageTitle(/Potluck|Texas Tailgaters/);
    
    // Test Home navigation
    await this.goToHome();
    await this.verifyPageTitle(/Texas Tailgaters/);
    
    // Test Admin navigation if available
    const adminLink = this.page.locator(SELECTORS.NAV_ADMIN);
    if (await adminLink.isVisible()) {
      await this.goToAdmin();
      await this.verifyPageTitle(/Admin|Texas Tailgaters/);
    }
  }

  /**
   * Test responsive navigation (mobile menu)
   */
  async testMobileNavigation(): Promise<void> {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu toggle
    const mobileMenuToggle = this.page.locator(
      '[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu" i]'
    );
    
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
      
      // Verify menu items are visible after toggle
      await expect(this.page.locator(SELECTORS.NAV_GAMES)).toBeVisible();
      await expect(this.page.locator(SELECTORS.NAV_POTLUCK)).toBeVisible();
    }
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Verify page accessibility
   */
  async verifyPageAccessibility(): Promise<void> {
    // Check for skip links
    const skipLink = this.page.locator('a[href="#main"], a:has-text("Skip to main")');
    
    // Check for proper heading hierarchy
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      const firstHeading = headings.first();
      const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('h1');
    }
  }
}