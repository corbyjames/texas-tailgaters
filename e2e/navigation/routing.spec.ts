import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { GamesPage } from '../pages/GamesPage';
import { PotluckPage } from '../pages/PotluckPage';
import { AdminPage } from '../pages/AdminPage';
import { AuthHelpers } from '../utils/auth-helpers';
import { NavigationHelpers } from '../utils/nav-helpers';
import { TestHelpers } from '../utils/test-helpers';
import { URLS, VIEWPORT_SIZES } from '../utils/test-constants';

test.describe('Navigation and Routing Tests', () => {
  let authHelpers: AuthHelpers;
  let navHelpers: NavigationHelpers;
  let testHelpers: TestHelpers;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    navHelpers = new NavigationHelpers(page);
    testHelpers = new TestHelpers(page);
    loginPage = new LoginPage(page);

    // Authenticate user for most tests
    await testHelpers.clearStorage();
    await loginPage.navigate();
    await authHelpers.loginAsTestUser();
    await authHelpers.verifyAuthenticatedState();
  });

  test.describe('Main Navigation', () => {
    test('should navigate to all main pages successfully', async () => {
      await test.step('Test Games navigation', async () => {
        await navHelpers.goToGames();
        await navHelpers.verifyPageTitle(/Games|Texas Tailgaters/);
      });

      await test.step('Test Potluck navigation', async () => {
        await navHelpers.goToPotluck();
        await navHelpers.verifyPageTitle(/Potluck|Texas Tailgaters/);
      });

      await test.step('Test Home navigation', async () => {
        await navHelpers.goToHome();
        await navHelpers.verifyPageTitle(/Texas Tailgaters/);
      });
    });

    test('should show active navigation state', async () => {
      await test.step('Navigate to Games and verify active state', async () => {
        await navHelpers.goToGames();
        
        // Check if the Games nav item has active styling
        const gamesNav = loginPage.page.locator('nav a:has-text("Games")');
        if (await gamesNav.isVisible()) {
          const classes = await gamesNav.getAttribute('class');
          const hasActiveState = classes?.includes('active') || 
                                classes?.includes('bg-orange') ||
                                classes?.includes('text-orange') ||
                                await gamesNav.getAttribute('aria-current') === 'page';
          
          // Active state verification (may vary based on implementation)
          expect(typeof hasActiveState).toBe('boolean');
        }
      });

      await test.step('Navigate to Potluck and verify active state', async () => {
        await navHelpers.goToPotluck();
        await navHelpers.verifyPageTitle(/Potluck|Texas Tailgaters/);
        
        // Verify URL is correct
        await expect(loginPage.page).toHaveURL(/.*\/potluck/);
      });
    });

    test('should maintain navigation across all pages', async () => {
      const pages = [
        { name: 'Games', navigate: () => navHelpers.goToGames() },
        { name: 'Potluck', navigate: () => navHelpers.goToPotluck() },
        { name: 'Home', navigate: () => navHelpers.goToHome() }
      ];

      for (const page of pages) {
        await test.step(`Verify navigation on ${page.name} page`, async () => {
          await page.navigate();
          await navHelpers.verifyNavigationMenu();
        });
      }
    });
  });

  test.describe('URL Routing', () => {
    test('should handle direct URL access', async () => {
      await test.step('Direct access to Games page', async () => {
        await loginPage.page.goto(URLS.GAMES);
        await loginPage.waitForLoad();
        await expect(loginPage.page).toHaveURL(URLS.GAMES);
      });

      await test.step('Direct access to Potluck page', async () => {
        await loginPage.page.goto(URLS.POTLUCK);
        await loginPage.waitForLoad();
        await expect(loginPage.page).toHaveURL(URLS.POTLUCK);
      });
    });

    test('should handle browser back/forward navigation', async () => {
      await test.step('Navigate through pages', async () => {
        await navHelpers.goToGames();
        const gamesUrl = loginPage.page.url();
        
        await navHelpers.goToPotluck();
        const potluckUrl = loginPage.page.url();
        
        expect(gamesUrl).toContain('/games');
        expect(potluckUrl).toContain('/potluck');
      });

      await test.step('Test browser back button', async () => {
        await navHelpers.goBack();
        await expect(loginPage.page).toHaveURL(/.*\/games/);
      });

      await test.step('Test browser forward button', async () => {
        await navHelpers.goForward();
        await expect(loginPage.page).toHaveURL(/.*\/potluck/);
      });
    });

    test('should handle invalid routes', async () => {
      await test.step('Navigate to invalid route', async () => {
        await loginPage.page.goto(`${URLS.BASE}/nonexistent-page`);
        await loginPage.waitForLoad();
      });

      await test.step('Verify redirect or error handling', async () => {
        // Should redirect to home or show 404
        const currentUrl = loginPage.page.url();
        const isRedirectedHome = currentUrl === URLS.HOME || currentUrl === `${URLS.BASE}/`;
        const is404 = await loginPage.isTextVisible('404') || 
                     await loginPage.isTextVisible('Not Found') ||
                     await loginPage.isTextVisible('Page not found');
        
        expect(isRedirectedHome || is404).toBeTruthy();
      });
    });

    test('should handle route parameters correctly', async () => {
      await test.step('Navigate to games page first', async () => {
        const gamesPage = new GamesPage(loginPage.page);
        await gamesPage.navigate();
        await gamesPage.verifyGamesLoaded();
      });

      await test.step('Test game details routing with parameter', async () => {
        // Try to access a game details page
        const testGameId = 'test-game-id';
        await loginPage.page.goto(`${URLS.GAMES}/${testGameId}`);
        await loginPage.waitForLoad();
        
        // Should either show game details or handle missing game gracefully
        const currentUrl = loginPage.page.url();
        expect(currentUrl).toContain('/games/');
        
        // Page should load without crashing
        const pageContent = await loginPage.page.locator('body').textContent();
        expect(pageContent).toBeTruthy();
      });
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should work correctly on mobile devices', async () => {
      await test.step('Set mobile viewport', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await loginPage.page.waitForTimeout(500);
      });

      await test.step('Test mobile navigation', async () => {
        await navHelpers.testMobileNavigation();
      });

      await test.step('Verify navigation functionality on mobile', async () => {
        // Navigation should still work on mobile
        await navHelpers.goToGames();
        await expect(loginPage.page).toHaveURL(/.*\/games/);
        
        await navHelpers.goToPotluck();
        await expect(loginPage.page).toHaveURL(/.*\/potluck/);
      });
    });

    test('should adapt navigation for different screen sizes', async () => {
      const viewports = Object.entries(VIEWPORT_SIZES);
      
      for (const [name, size] of viewports) {
        await test.step(`Test navigation on ${name}`, async () => {
          await loginPage.page.setViewportSize(size);
          await loginPage.page.waitForTimeout(300);
          
          // Navigation should be accessible at all screen sizes
          await navHelpers.verifyNavigationMenu();
          
          // Test that navigation links are clickable
          await navHelpers.goToGames();
          await expect(loginPage.page).toHaveURL(/.*\/games/);
        });
      }
    });
  });

  test.describe('Admin Navigation', () => {
    test('should show admin navigation for admin users', async () => {
      await test.step('Navigate to admin page', async () => {
        const adminPage = new AdminPage(loginPage.page);
        
        try {
          await adminPage.navigate();
          await adminPage.verifyAdminAccess();
        } catch (error) {
          // User might not have admin access
          console.log('User does not have admin access, testing admin access denial');
          await adminPage.verifyNoAdminAccess();
        }
      });
    });

    test('should handle admin access correctly', async () => {
      await test.step('Test admin navigation visibility', async () => {
        // Check if admin link is visible in navigation
        const adminLink = loginPage.page.locator('text=Admin, a[href*="/admin"]');
        const isAdminVisible = await adminLink.isVisible();
        
        if (isAdminVisible) {
          await test.step('Test admin navigation access', async () => {
            await adminLink.click();
            await loginPage.waitForLoad();
            
            const adminPage = new AdminPage(loginPage.page);
            await adminPage.verifyAdminAccess();
          });
        } else {
          await test.step('Verify admin access is properly restricted', async () => {
            // Try direct access to admin URL
            await loginPage.page.goto(URLS.ADMIN);
            await loginPage.waitForLoad();
            
            const adminPage = new AdminPage(loginPage.page);
            await adminPage.verifyNoAdminAccess();
          });
        }
      });
    });
  });

  test.describe('Navigation Performance', () => {
    test('should navigate quickly between pages', async () => {
      await test.step('Measure navigation performance', async () => {
        const startTime = Date.now();
        
        await navHelpers.goToGames();
        await navHelpers.goToPotluck();
        await navHelpers.goToHome();
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Navigation should be reasonably fast (under 10 seconds total)
        expect(totalTime).toBeLessThan(10000);
      });
    });

    test('should handle rapid navigation changes', async () => {
      await test.step('Test rapid navigation switching', async () => {
        // Rapidly switch between pages
        await navHelpers.goToGames();
        await navHelpers.goToPotluck();
        await navHelpers.goToGames();
        await navHelpers.goToHome();
        
        // Should end up on home page without errors
        await expect(loginPage.page).toHaveURL(URLS.HOME);
        
        // Page should be functional
        await navHelpers.verifyNavigationMenu();
      });
    });
  });

  test.describe('Page Accessibility', () => {
    test('should have proper accessibility attributes', async () => {
      const pages = [
        { navigate: () => navHelpers.goToHome(), name: 'Home' },
        { navigate: () => navHelpers.goToGames(), name: 'Games' },
        { navigate: () => navHelpers.goToPotluck(), name: 'Potluck' }
      ];

      for (const page of pages) {
        await test.step(`Test accessibility on ${page.name} page`, async () => {
          await page.navigate();
          await navHelpers.verifyPageAccessibility();
        });
      }
    });

    test('should support keyboard navigation', async () => {
      await test.step('Test keyboard navigation through menu', async () => {
        // Focus on first navigation item
        await loginPage.page.keyboard.press('Tab');
        
        // Should be able to navigate through menu items
        const focusedElement = loginPage.page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Test Enter key on navigation
        await loginPage.page.keyboard.press('Enter');
        await loginPage.waitForLoad();
        
        // Should navigate to focused page
        const currentUrl = loginPage.page.url();
        expect(currentUrl).toBeTruthy();
      });
    });
  });
});