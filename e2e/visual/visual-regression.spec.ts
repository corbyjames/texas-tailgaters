import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { GamesPage } from '../pages/GamesPage';
import { PotluckPage } from '../pages/PotluckPage';
import { AdminPage } from '../pages/AdminPage';
import { AuthHelpers } from '../utils/auth-helpers';
import { TestHelpers } from '../utils/test-helpers';
import { VIEWPORT_SIZES } from '../utils/test-constants';

test.describe('Visual Regression Tests', () => {
  let loginPage: LoginPage;
  let gamesPage: GamesPage;
  let potluckPage: PotluckPage;
  let adminPage: AdminPage;
  let authHelpers: AuthHelpers;
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    gamesPage = new GamesPage(page);
    potluckPage = new PotluckPage(page);
    adminPage = new AdminPage(page);
    authHelpers = new AuthHelpers(page);
    testHelpers = new TestHelpers(page);

    // Set consistent viewport for baseline screenshots
    await page.setViewportSize(VIEWPORT_SIZES.DESKTOP);
  });

  test.describe('Login Page Visual Tests', () => {
    test('should match login page baseline', async () => {
      await test.step('Navigate to login page', async () => {
        await loginPage.navigate();
        await loginPage.waitForLoad();
      });

      await test.step('Take login page screenshot', async () => {
        // Hide any dynamic elements that might change
        await loginPage.page.addStyleTag({
          content: `
            .cursor-blink, .loading-spinner { display: none !important; }
            input:focus { outline: none; }
          `
        });

        await expect(loginPage.page).toHaveScreenshot('login-page-desktop.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });

    test('should match login page on mobile', async () => {
      await test.step('Set mobile viewport and navigate', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await loginPage.navigate();
        await loginPage.waitForLoad();
      });

      await test.step('Take mobile login screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('login-page-mobile.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });

    test('should match login form with validation errors', async () => {
      await test.step('Navigate and trigger validation', async () => {
        await loginPage.navigate();
        await loginPage.verifyEmptyFormValidation();
      });

      await test.step('Take validation error screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('login-validation-errors.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });
  });

  test.describe('Games Page Visual Tests', () => {
    test.beforeEach(async () => {
      // Authenticate for games page tests
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match games page layout', async () => {
      await test.step('Navigate to games page', async () => {
        await gamesPage.navigate();
        await gamesPage.waitForLoad();
      });

      await test.step('Take games page screenshot', async () => {
        // Wait for games to load and stabilize
        await gamesPage.verifyGamesLoaded();
        await loginPage.page.waitForTimeout(1000);

        // Hide dynamic elements
        await loginPage.page.addStyleTag({
          content: `
            .loading, .spinner, .animate-spin { display: none !important; }
            .transition-all { transition: none !important; }
          `
        });

        await expect(loginPage.page).toHaveScreenshot('games-page-desktop.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });

    test('should match games page on tablet', async () => {
      await test.step('Set tablet viewport', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.TABLET);
        await gamesPage.navigate();
        await gamesPage.waitForLoad();
      });

      await test.step('Take tablet games screenshot', async () => {
        await gamesPage.verifyGamesLoaded();
        await expect(loginPage.page).toHaveScreenshot('games-page-tablet.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });

    test('should match game card hover states', async () => {
      await test.step('Navigate and hover game card', async () => {
        await gamesPage.navigate();
        await gamesPage.verifyGamesLoaded();

        const gameCards = await gamesPage.getGameCards();
        const firstCard = gameCards.first();
        
        if (await firstCard.isVisible()) {
          await firstCard.hover();
          await loginPage.page.waitForTimeout(500); // Allow hover effects
        }
      });

      await test.step('Take hover state screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('game-card-hover.png', {
          fullPage: false,
          threshold: 0.3
        });
      });
    });
  });

  test.describe('Potluck Page Visual Tests', () => {
    test.beforeEach(async () => {
      // Authenticate for potluck page tests
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match potluck page layout', async () => {
      await test.step('Navigate to potluck page', async () => {
        await potluckPage.navigate();
        await potluckPage.waitForLoad();
      });

      await test.step('Take potluck page screenshot', async () => {
        // Ensure consistent state
        await potluckPage.verifyPageElements();
        
        await expect(loginPage.page).toHaveScreenshot('potluck-page-desktop.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });

    test('should match add item modal', async () => {
      await test.step('Open add item modal', async () => {
        await potluckPage.navigate();
        await potluckPage.openAddItemForm();
      });

      await test.step('Take add item modal screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('potluck-add-item-modal.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });

    test('should match potluck categories expanded', async () => {
      await test.step('Expand all categories', async () => {
        await potluckPage.navigate();
        await potluckPage.expandAllCategories();
      });

      await test.step('Take expanded categories screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('potluck-categories-expanded.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });

    test('should match potluck page on mobile', async () => {
      await test.step('Set mobile viewport and navigate', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await potluckPage.navigate();
        await potluckPage.waitForLoad();
      });

      await test.step('Take mobile potluck screenshot', async () => {
        await expect(loginPage.page).toHaveScreenshot('potluck-page-mobile.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });
  });

  test.describe('Admin Page Visual Tests', () => {
    test.beforeEach(async () => {
      // Authenticate for admin page tests
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match admin page or access denied', async () => {
      await test.step('Navigate to admin page', async () => {
        await adminPage.navigate();
        await adminPage.waitForLoad();
      });

      await test.step('Take admin page screenshot', async () => {
        try {
          await adminPage.verifyAdminAccess();
          
          // User has admin access - take admin dashboard screenshot
          await expect(loginPage.page).toHaveScreenshot('admin-dashboard.png', {
            fullPage: true,
            threshold: 0.4
          });
          
        } catch (error) {
          // User doesn't have admin access - take access denied screenshot
          await expect(loginPage.page).toHaveScreenshot('admin-access-denied.png', {
            fullPage: true,
            threshold: 0.3
          });
        }
      });
    });
  });

  test.describe('Navigation Visual Tests', () => {
    test.beforeEach(async () => {
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match navigation states', async () => {
      await test.step('Test navigation on different pages', async () => {
        const pages = [
          { name: 'home', navigate: () => gamesPage.goto('http://localhost:5173/') },
          { name: 'games', navigate: () => gamesPage.navigate() },
          { name: 'potluck', navigate: () => potluckPage.navigate() }
        ];

        for (const page of pages) {
          await page.navigate();
          await loginPage.waitForLoad();

          // Take screenshot of navigation area only
          const navElement = loginPage.page.locator('nav, header, .navigation');
          if (await navElement.isVisible()) {
            await expect(navElement).toHaveScreenshot(`navigation-${page.name}.png`, {
              threshold: 0.3
            });
          }
        }
      });
    });

    test('should match mobile navigation menu', async () => {
      await test.step('Test mobile navigation', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await gamesPage.navigate();
        await gamesPage.waitForLoad();

        // Look for mobile menu toggle
        const mobileToggle = loginPage.page.locator(
          '[data-testid="mobile-menu-toggle"], .mobile-menu-toggle, button[aria-label*="menu" i]'
        );

        if (await mobileToggle.isVisible()) {
          await mobileToggle.click();
          await loginPage.page.waitForTimeout(500);

          await expect(loginPage.page).toHaveScreenshot('mobile-navigation-open.png', {
            fullPage: true,
            threshold: 0.3
          });
        }
      });
    });
  });

  test.describe('Responsive Layout Visual Tests', () => {
    test.beforeEach(async () => {
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match layouts across different viewport sizes', async () => {
      const viewports = Object.entries(VIEWPORT_SIZES);
      
      for (const [sizeName, viewport] of viewports) {
        await test.step(`Test ${sizeName} layout`, async () => {
          await loginPage.page.setViewportSize(viewport);
          await gamesPage.navigate();
          await gamesPage.waitForLoad();
          
          // Wait for layout to stabilize
          await loginPage.page.waitForTimeout(500);

          await expect(loginPage.page).toHaveScreenshot(`layout-${sizeName.toLowerCase()}.png`, {
            fullPage: true,
            threshold: 0.4
          });
        });
      }
    });
  });

  test.describe('Interactive Element Visual Tests', () => {
    test.beforeEach(async () => {
      await testHelpers.clearStorage();
      await loginPage.navigate();
      await authHelpers.loginAsTestUser();
    });

    test('should match button states', async () => {
      await test.step('Test button hover and focus states', async () => {
        await gamesPage.navigate();
        await gamesPage.waitForLoad();

        // Find a button to test
        const button = loginPage.page.locator('button').first();
        
        if (await button.isVisible()) {
          // Normal state
          await expect(button).toHaveScreenshot('button-normal.png');

          // Hover state
          await button.hover();
          await expect(button).toHaveScreenshot('button-hover.png');

          // Focus state
          await button.focus();
          await expect(button).toHaveScreenshot('button-focus.png');
        }
      });
    });

    test('should match form input states', async () => {
      await test.step('Test form input visual states', async () => {
        await loginPage.navigate();

        const emailInput = loginPage['emailInput'];
        
        // Empty state
        await expect(emailInput).toHaveScreenshot('input-empty.png');

        // Filled state
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveScreenshot('input-filled.png');

        // Focus state
        await emailInput.focus();
        await expect(emailInput).toHaveScreenshot('input-focus.png');
      });
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('should match error page layouts', async () => {
      await test.step('Test 404 error page', async () => {
        await loginPage.page.goto('http://localhost:5173/nonexistent-page');
        await loginPage.waitForLoad();

        await expect(loginPage.page).toHaveScreenshot('error-404.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });

    test('should match form validation error states', async () => {
      await test.step('Test login form validation errors', async () => {
        await loginPage.navigate();
        await loginPage.verifyInvalidEmailValidation();

        await expect(loginPage.page).toHaveScreenshot('form-validation-errors.png', {
          fullPage: true,
          threshold: 0.3
        });
      });
    });
  });

  test.describe('Loading State Visual Tests', () => {
    test('should match loading states', async () => {
      await test.step('Test page loading states', async () => {
        // Navigate to page and capture loading state if visible
        await gamesPage.navigate();
        
        // Look for loading indicators
        const loadingIndicators = loginPage.page.locator('.loading, .spinner, .animate-spin');
        
        if (await loadingIndicators.first().isVisible()) {
          await expect(loginPage.page).toHaveScreenshot('loading-state.png', {
            fullPage: true,
            threshold: 0.2
          });
        }
        
        // Wait for loading to complete
        await gamesPage.waitForLoad();
        
        // Take final loaded state
        await expect(loginPage.page).toHaveScreenshot('loaded-state.png', {
          fullPage: true,
          threshold: 0.4
        });
      });
    });
  });

  test.describe('Theme and Color Scheme Tests', () => {
    test('should maintain consistent branding colors', async () => {
      await test.step('Test color consistency across pages', async () => {
        await testHelpers.clearStorage();
        await loginPage.navigate();
        await authHelpers.loginAsTestUser();

        const pages = [
          { name: 'games', navigate: () => gamesPage.navigate() },
          { name: 'potluck', navigate: () => potluckPage.navigate() }
        ];

        for (const page of pages) {
          await page.navigate();
          await loginPage.waitForLoad();

          // Take screenshot focusing on branded elements
          const brandedElements = loginPage.page.locator('header, nav, .btn-primary, .text-orange');
          if (await brandedElements.first().isVisible()) {
            await expect(loginPage.page).toHaveScreenshot(`branding-${page.name}.png`, {
              fullPage: true,
              threshold: 0.3
            });
          }
        }
      });
    });
  });
});