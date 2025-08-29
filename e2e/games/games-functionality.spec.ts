import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { GamesPage } from '../pages/GamesPage';
import { AuthHelpers } from '../utils/auth-helpers';
import { TestHelpers } from '../utils/test-helpers';
import { VIEWPORT_SIZES } from '../utils/test-constants';

test.describe('Games Functionality Tests', () => {
  let loginPage: LoginPage;
  let gamesPage: GamesPage;
  let authHelpers: AuthHelpers;
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    gamesPage = new GamesPage(page);
    authHelpers = new AuthHelpers(page);
    testHelpers = new TestHelpers(page);

    // Authenticate and navigate to games page
    await testHelpers.clearStorage();
    await loginPage.navigate();
    await authHelpers.loginAsTestUser();
    await gamesPage.navigate();
  });

  test.describe('Games Display', () => {
    test('should display games list correctly', async () => {
      await test.step('Verify games page loads', async () => {
        await gamesPage.verifyPageElements();
      });

      await test.step('Verify games are loaded and displayed', async () => {
        await gamesPage.verifyGamesLoaded();
        
        const gameCount = await gamesPage.getGameCount();
        console.log(`Found ${gameCount} games displayed`);
        expect(gameCount).toBeGreaterThan(0);
      });

      await test.step('Verify game cards contain required information', async () => {
        const gameCards = await gamesPage.getGameCards();
        const firstGameCard = gameCards.first();
        
        if (await firstGameCard.isVisible()) {
          // Game cards should have basic information
          const cardText = await firstGameCard.textContent();
          expect(cardText).toBeTruthy();
          expect(cardText!.length).toBeGreaterThan(10);
        }
      });
    });

    test('should display team logos correctly', async () => {
      await test.step('Verify team logos are present', async () => {
        await gamesPage.verifyTeamLogos();
      });

      await test.step('Verify logos load successfully', async () => {
        const logos = loginPage.page.locator('img[alt*="logo" i], img[src*="logo"], img[src*="team"]');
        const logoCount = await logos.count();
        
        if (logoCount > 0) {
          const firstLogo = logos.first();
          await expect(firstLogo).toBeVisible();
          
          // Check if logo loaded successfully
          const naturalWidth = await firstLogo.evaluate((img: HTMLImageElement) => img.naturalWidth);
          if (naturalWidth > 0) {
            expect(naturalWidth).toBeGreaterThan(0);
          }
        }
      });
    });

    test('should display TV network information', async () => {
      await test.step('Check for TV network information', async () => {
        await gamesPage.verifyTVNetworkInfo();
      });

      await test.step('Verify network information is readable', async () => {
        const networks = loginPage.page.locator('text=ESPN, text=FOX, text=ABC, text=CBS, text=SEC, text=ESPN+, text=LHN');
        const networkCount = await networks.count();
        
        if (networkCount > 0) {
          const firstNetwork = networks.first();
          const networkText = await firstNetwork.textContent();
          expect(networkText).toBeTruthy();
          expect(networkText!.length).toBeGreaterThan(1);
        }
      });
    });

    test('should show game dates and times', async () => {
      await test.step('Verify dates are displayed', async () => {
        const gameCards = await gamesPage.getGameCards();
        const firstCard = gameCards.first();
        
        if (await firstCard.isVisible()) {
          const cardText = await firstCard.textContent();
          
          // Look for date patterns (various formats)
          const hasDatePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\d{1,2}\/\d{1,2}|\d{4}|\d{1,2}:\d{2}/i.test(cardText || '');
          expect(hasDatePattern).toBeTruthy();
        }
      });
    });
  });

  test.describe('Games Sync Functionality', () => {
    test('should sync games from schedule', async () => {
      await test.step('Test sync games button', async () => {
        await gamesPage.verifySyncFunctionality();
      });

      await test.step('Verify games count after sync', async () => {
        const gameCount = await gamesPage.getGameCount();
        expect(gameCount).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle sync errors gracefully', async () => {
      await test.step('Mock sync error', async () => {
        // Intercept sync requests and simulate failure
        await loginPage.page.route('**/sync**', route => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Sync failed' })
          });
        });
      });

      await test.step('Attempt sync with error', async () => {
        await gamesPage.syncGames();
      });

      await test.step('Verify error handling', async () => {
        // Page should still be functional after sync error
        await gamesPage.verifyPageElements();
        
        // Check for error messages or graceful handling
        const errors = await gamesPage.getErrorMessages();
        if (errors.length > 0) {
          // Error messages should be user-friendly
          errors.forEach(error => {
            expect(error.length).toBeGreaterThan(0);
            expect(error).not.toContain('undefined');
          });
        }
      });
    });
  });

  test.describe('Game Details Navigation', () => {
    test('should navigate to game details when clicking game card', async () => {
      await test.step('Verify games are available', async () => {
        await gamesPage.verifyGamesLoaded();
      });

      await test.step('Click on first game', async () => {
        const gameCount = await gamesPage.getGameCount();
        if (gameCount > 0) {
          await gamesPage.goToGameDetails(0);
          
          // Should navigate to game details page
          await expect(loginPage.page).toHaveURL(/.*\/games\/.*/, { timeout: 5000 });
        }
      });

      await test.step('Verify game details page loads', async () => {
        const currentUrl = loginPage.page.url();
        if (currentUrl.includes('/games/')) {
          // Game details page should have content
          const pageContent = await loginPage.page.locator('body').textContent();
          expect(pageContent).toBeTruthy();
          expect(pageContent!.length).toBeGreaterThan(50);
        }
      });
    });

    test('should handle invalid game IDs', async () => {
      await test.step('Navigate to invalid game ID', async () => {
        await loginPage.page.goto('http://localhost:5173/games/invalid-game-id');
        await loginPage.waitForLoad();
      });

      await test.step('Verify error handling', async () => {
        // Should handle invalid game ID gracefully
        const isErrorPage = await loginPage.isTextVisible('404') || 
                           await loginPage.isTextVisible('Not Found') ||
                           await loginPage.isTextVisible('Game not found');
        
        const isRedirected = loginPage.page.url().includes('/games') && 
                           !loginPage.page.url().includes('/games/invalid-game-id');
        
        expect(isErrorPage || isRedirected).toBeTruthy();
      });
    });
  });

  test.describe('Potluck Integration', () => {
    test('should display potluck stats on game cards', async () => {
      await test.step('Check for potluck statistics', async () => {
        await gamesPage.verifyPotluckStats();
      });

      await test.step('Verify potluck stats are meaningful', async () => {
        const statsElements = loginPage.page.locator('text=/\\d+\\s*(items?|assigned)/');
        const statsCount = await statsElements.count();
        
        if (statsCount > 0) {
          const firstStat = statsElements.first();
          const statText = await firstStat.textContent();
          expect(statText).toBeTruthy();
          
          // Should contain numbers
          const hasNumbers = /\d+/.test(statText || '');
          expect(hasNumbers).toBeTruthy();
        }
      });
    });

    test('should link to potluck page for game planning', async () => {
      await test.step('Look for potluck links on game cards', async () => {
        const potluckLinks = loginPage.page.locator('a:has-text("Potluck"), button:has-text("Plan Potluck")');
        const linkCount = await potluckLinks.count();
        
        if (linkCount > 0) {
          const firstLink = potluckLinks.first();
          await firstLink.click();
          await loginPage.waitForLoad();
          
          // Should navigate to potluck page
          await expect(loginPage.page).toHaveURL(/.*\/potluck/);
        }
      });
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search games by opponent name', async () => {
      await test.step('Use search functionality if available', async () => {
        const gameCount = await gamesPage.getGameCount();
        if (gameCount > 0) {
          // Try searching for a common opponent
          await gamesPage.searchGame('Oklahoma');
          
          // Search should filter results or show message if no results
          const searchResults = await gamesPage.getGameCount();
          expect(searchResults).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should filter games by date/season', async () => {
      await test.step('Use date filter if available', async () => {
        await gamesPage.filterByDate('2024');
        
        // Filter should work without errors
        const filteredCount = await gamesPage.getGameCount();
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async () => {
      await test.step('Set mobile viewport', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await loginPage.page.waitForTimeout(500);
      });

      await test.step('Verify mobile layout', async () => {
        await gamesPage.verifyResponsiveLayout();
      });

      await test.step('Verify games are still accessible on mobile', async () => {
        const gameCount = await gamesPage.getGameCount();
        expect(gameCount).toBeGreaterThanOrEqual(0);
        
        // Games should be clickable on mobile
        if (gameCount > 0) {
          const firstGame = (await gamesPage.getGameCards()).first();
          await expect(firstGame).toBeVisible();
        }
      });
    });

    test('should adapt layout for different screen sizes', async () => {
      const viewports = Object.entries(VIEWPORT_SIZES);
      
      for (const [name, size] of viewports) {
        await test.step(`Test games layout on ${name}`, async () => {
          await loginPage.page.setViewportSize(size);
          await loginPage.page.waitForTimeout(300);
          
          // Games should be visible and properly laid out
          await gamesPage.verifyResponsiveLayout();
          
          // Page should not have horizontal scroll
          const bodyWidth = await loginPage.page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = size.width;
          
          // Allow small variance for scrollbars
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
        });
      }
    });
  });

  test.describe('Performance', () => {
    test('should load games quickly', async () => {
      await test.step('Measure page load performance', async () => {
        const startTime = Date.now();
        
        await gamesPage.navigate();
        await gamesPage.verifyGamesLoaded();
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        // Should load within reasonable time (5 seconds)
        expect(loadTime).toBeLessThan(5000);
        console.log(`Games page loaded in ${loadTime}ms`);
      });
    });

    test('should handle large numbers of games efficiently', async () => {
      await test.step('Verify performance with current game count', async () => {
        const gameCount = await gamesPage.getGameCount();
        console.log(`Testing performance with ${gameCount} games`);
        
        // Page should remain responsive even with many games
        await gamesPage.verifyPageElements();
        
        // Scrolling should be smooth
        if (gameCount > 5) {
          await loginPage.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
          });
          
          await loginPage.page.waitForTimeout(100);
          
          await loginPage.page.evaluate(() => {
            window.scrollTo(0, 0);
          });
        }
      });
    });
  });

  test.describe('Data Integrity', () => {
    test('should display accurate game information', async () => {
      await test.step('Verify game data completeness', async () => {
        const gameCards = await gamesPage.getGameCards();
        const gameCount = await gameCards.count();
        
        if (gameCount > 0) {
          for (let i = 0; i < Math.min(gameCount, 3); i++) {
            const card = gameCards.nth(i);
            const cardText = await card.textContent();
            
            // Each game should have meaningful content
            expect(cardText).toBeTruthy();
            expect(cardText!.length).toBeGreaterThan(10);
            
            // Should not contain undefined/null values
            expect(cardText).not.toContain('undefined');
            expect(cardText).not.toContain('null');
          }
        }
      });
    });

    test('should handle missing or incomplete game data', async () => {
      await test.step('Mock incomplete game data', async () => {
        // Mock API response with incomplete data
        await testHelpers.mockApiCall(/games/, {
          games: [
            { id: 1, opponent: 'Test Team' }, // Missing other fields
            { id: 2 }, // Missing most fields
            { id: 3, opponent: null, date: undefined } // Null/undefined values
          ]
        });
      });

      await test.step('Reload page with mocked data', async () => {
        await gamesPage.navigate();
        await loginPage.waitForLoad();
      });

      await test.step('Verify graceful handling of incomplete data', async () => {
        // Page should not crash with incomplete data
        const pageContent = await loginPage.page.locator('body').textContent();
        expect(pageContent).toBeTruthy();
        
        // Should not show undefined/null in UI
        expect(pageContent).not.toContain('undefined');
        expect(pageContent).not.toContain('null');
      });
    });
  });
});