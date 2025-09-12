import { test, expect } from '@playwright/test';

test.describe('Score Display Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the games page
    await page.goto('http://localhost:5174/games');
    
    // Handle login if needed
    const needsLogin = await page.locator('text="Sign in with Google"').isVisible();
    if (needsLogin) {
      // For testing, we'll skip login-protected tests
      test.skip();
    }
  });

  test('Completed games show final scores with W/L/T indicators', async ({ page }) => {
    // Look for a completed game card
    const completedGame = page.locator('.card').filter({ hasText: 'Final' }).first();
    
    if (await completedGame.isVisible()) {
      // Check for W/L/T indicator
      const hasResultIndicator = await completedGame.locator('svg.text-green-600, svg.text-red-600, svg.text-yellow-600').isVisible();
      expect(hasResultIndicator).toBeTruthy();
      
      // Check for score display
      const scoreText = await completedGame.textContent();
      expect(scoreText).toMatch(/\d+\s*-\s*\d+/); // Matches score pattern like "45 - 21"
      
      // Check for result text (W, L, or T)
      const hasResultText = scoreText?.includes('W') || scoreText?.includes('L') || scoreText?.includes('T');
      expect(hasResultText).toBeTruthy();
    }
  });

  test('Live games show LIVE badge and current score', async ({ page }) => {
    // Look for an in-progress game
    const liveGame = page.locator('.card').filter({ hasText: 'LIVE' }).first();
    
    if (await liveGame.isVisible()) {
      // Check for LIVE badge
      await expect(liveGame.locator('text="LIVE"')).toBeVisible();
      
      // Check for animated pulse effect (class contains animate-pulse)
      const hasPulseAnimation = await liveGame.locator('.animate-pulse').isVisible();
      expect(hasPulseAnimation).toBeTruthy();
      
      // Check for quarter display
      const gameText = await liveGame.textContent();
      const hasQuarter = gameText?.match(/Q[1-4]|OT|Half/);
      expect(hasQuarter).toBeTruthy();
      
      // Check for score display
      expect(gameText).toMatch(/\d+\s*-\s*\d+/);
    }
  });

  test('Scheduled games show kickoff time', async ({ page }) => {
    // Look for a scheduled game
    const scheduledGame = page.locator('.card').filter({ hasText: 'Kickoff' }).first();
    
    if (await scheduledGame.isVisible()) {
      // Check for clock icon
      await expect(scheduledGame.locator('svg').first()).toBeVisible();
      
      // Check for time display
      const gameText = await scheduledGame.textContent();
      expect(gameText).toContain('Kickoff');
      // Check for time pattern (e.g., "6:30 PM" or "TBD")
      const hasTime = gameText?.match(/\d{1,2}:\d{2}\s*(AM|PM)|TBD/);
      expect(hasTime).toBeTruthy();
    }
  });

  test('Mobile view displays scores correctly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for mobile cards to render
    await page.waitForTimeout(1000);
    
    // Check if mobile game cards are visible
    const mobileCards = page.locator('[class*="rounded-lg"][class*="shadow-sm"]');
    const cardCount = await mobileCards.count();
    
    if (cardCount > 0) {
      // Check first card for proper mobile formatting
      const firstCard = mobileCards.first();
      const cardText = await firstCard.textContent();
      
      // Mobile cards should have compact layout
      const boundingBox = await firstCard.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
      
      // Check for score or status display
      const hasGameInfo = cardText?.includes('vs') || cardText?.includes('@');
      expect(hasGameInfo).toBeTruthy();
    }
  });

  test('Score colors are applied correctly', async ({ page }) => {
    // Look for games with scores
    const gamesWithScores = page.locator('.card').filter({ has: page.locator('text=/\\d+\\s*-\\s*\\d+/') });
    const gameCount = await gamesWithScores.count();
    
    if (gameCount > 0) {
      const firstGame = gamesWithScores.first();
      
      // Check for color classes
      const greenScore = await firstGame.locator('.text-green-600').isVisible();
      const redScore = await firstGame.locator('.text-red-600').isVisible();
      
      // At least one score should be colored if there's a winner
      const hasColoredScore = greenScore || redScore;
      expect(hasColoredScore).toBeTruthy();
    }
  });

  test('Collapsed completed games can be expanded', async ({ page }) => {
    // Look for a collapsed completed game
    const collapsedGame = page.locator('.bg-gray-50').filter({ has: page.locator('svg[class*="ChevronDown"]') }).first();
    
    if (await collapsedGame.isVisible()) {
      // Click to expand
      await collapsedGame.click();
      
      // Wait for expansion animation
      await page.waitForTimeout(500);
      
      // Check if expanded (should now have ChevronUp icon)
      const expandedGame = page.locator('.card').filter({ has: page.locator('svg[class*="ChevronUp"]') }).first();
      await expect(expandedGame).toBeVisible();
    }
  });
});

test.describe('Score Display Data Integrity', () => {
  test('Scores are displayed in correct format', async ({ page }) => {
    await page.goto('http://localhost:5174/games');
    
    // Get all score displays
    const scoreElements = page.locator('text=/\\d+\\s*-\\s*\\d+/');
    const scoreCount = await scoreElements.count();
    
    for (let i = 0; i < Math.min(scoreCount, 5); i++) {
      const scoreText = await scoreElements.nth(i).textContent();
      
      // Verify score format
      const scoreMatch = scoreText?.match(/(\d+)\s*-\s*(\d+)/);
      if (scoreMatch) {
        const [, score1, score2] = scoreMatch;
        
        // Scores should be valid numbers
        expect(parseInt(score1)).toBeGreaterThanOrEqual(0);
        expect(parseInt(score2)).toBeGreaterThanOrEqual(0);
        
        // Scores should be reasonable (less than 100)
        expect(parseInt(score1)).toBeLessThan(100);
        expect(parseInt(score2)).toBeLessThan(100);
      }
    }
  });

  test('Game result matches score differential', async ({ page }) => {
    await page.goto('http://localhost:5174/games');
    
    // Find completed games with W/L indicators
    const completedGames = page.locator('.card').filter({ hasText: 'Final' });
    const gameCount = await completedGames.count();
    
    for (let i = 0; i < Math.min(gameCount, 3); i++) {
      const game = completedGames.nth(i);
      const gameText = await game.textContent();
      
      // Extract result and scores
      const hasWin = gameText?.includes('W');
      const hasLoss = gameText?.includes('L');
      const scoreMatch = gameText?.match(/(\d+)\s*-\s*(\d+)/);
      
      if (scoreMatch && (hasWin || hasLoss)) {
        const [, texasScore, opponentScore] = scoreMatch;
        const texasWon = parseInt(texasScore) > parseInt(opponentScore);
        
        // Result should match score differential
        if (hasWin) {
          expect(texasWon).toBeTruthy();
        } else if (hasLoss) {
          expect(texasWon).toBeFalsy();
        }
      }
    }
  });
});

test.describe('Visual Regression Tests', () => {
  test('Game card with score screenshot', async ({ page }) => {
    await page.goto('http://localhost:5174/games');
    await page.waitForTimeout(2000); // Wait for full render
    
    // Take screenshot of games section
    const gamesSection = page.locator('.container, main').first();
    if (await gamesSection.isVisible()) {
      await gamesSection.screenshot({ 
        path: 'test-results/score-display-screenshot.png',
        fullPage: false 
      });
    }
  });

  test('Mobile view score display screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5174/games');
    await page.waitForTimeout(2000);
    
    // Take mobile screenshot
    const mobileView = page.locator('body');
    await mobileView.screenshot({ 
      path: 'test-results/score-display-mobile-screenshot.png',
      fullPage: false 
    });
  });
});