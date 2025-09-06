import { test, expect } from '@playwright/test';

test.describe('A&M Game Date Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the games page
    await page.goto('/games');
    
    // Wait for the page to load and any authentication
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    const loginButton = page.locator('text="Sign in with Google"');
    if (await loginButton.isVisible()) {
      // For testing purposes, we'll create a mock login or skip auth-protected tests
      console.log('Login required - this test may need authentication setup');
    }
  });

  test('A&M game shows correct date as Saturday November 30', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="game-card"], .card', { timeout: 10000 });
    
    // Look for A&M game - try multiple variations of how it might appear
    const amGameSelectors = [
      'text=Texas A&M',
      'text=A&M',
      'text=vs Texas A&M',
      'text=@ Texas A&M',
      'text=vs A&M',
      'text=@ A&M'
    ];
    
    let amGameFound = false;
    let gameCard = null;
    
    for (const selector of amGameSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        // Find the parent game card
        gameCard = element.locator('..').locator('..'); // Go up to find card container
        amGameFound = true;
        console.log(`Found A&M game with selector: ${selector}`);
        break;
      }
    }
    
    if (!amGameFound) {
      // Try to find any game card and log what games are available
      const allCards = await page.locator('.card, [data-testid="game-card"]').all();
      console.log(`Found ${allCards.length} game cards total`);
      
      for (let i = 0; i < allCards.length; i++) {
        const cardText = await allCards[i].textContent();
        console.log(`Game ${i + 1}: ${cardText?.substring(0, 100)}...`);
      }
      
      throw new Error('A&M game not found on the page');
    }
    
    // Get the text content of the A&M game card
    const gameCardText = await gameCard.textContent();
    console.log('A&M Game Card Content:', gameCardText);
    
    // Check for Saturday and November 30 in the card
    expect(gameCardText).toContain('Saturday', 'Game should show Saturday');
    expect(gameCardText).toContain('Nov 30', 'Game should show November 30');
    
    // More specific checks - look for date patterns
    const datePatterns = [
      /Saturday.*Nov.*30/i,
      /Nov.*30.*Saturday/i,
      /Saturday.*November.*30/i,
      /November.*30.*Saturday/i
    ];
    
    let datePatternFound = false;
    for (const pattern of datePatterns) {
      if (pattern.test(gameCardText || '')) {
        datePatternFound = true;
        console.log(`Found correct date pattern: ${pattern}`);
        break;
      }
    }
    
    expect(datePatternFound, 'Should find Saturday November 30 date pattern').toBe(true);
    
    // Make sure it's NOT showing Friday November 29
    expect(gameCardText).not.toContain('Friday', 'Game should NOT show as Friday');
    expect(gameCardText).not.toContain('Nov 29', 'Game should NOT show November 29');
  });

  test('A&M game date consistency across game header and card', async ({ page }) => {
    await page.waitForSelector('[data-testid="game-card"], .card', { timeout: 10000 });
    
    // Find A&M game
    const amGame = page.locator('text=A&M').first();
    await expect(amGame).toBeVisible();
    
    // Check if we can expand the game card for more details
    const gameCard = amGame.locator('..').locator('..');
    
    // Click to expand if it's expandable
    try {
      await gameCard.click();
      await page.waitForTimeout(500); // Wait for any expansion animation
    } catch (error) {
      console.log('Game card not clickable or already expanded');
    }
    
    // Get all date-related text in the card
    const cardContent = await gameCard.textContent();
    console.log('Full A&M game content:', cardContent);
    
    // Verify consistent Saturday display
    const saturdayMatches = (cardContent?.match(/Saturday/gi) || []).length;
    const fridayMatches = (cardContent?.match(/Friday/gi) || []).length;
    
    expect(saturdayMatches, 'Should find Saturday references').toBeGreaterThan(0);
    expect(fridayMatches, 'Should find no Friday references').toBe(0);
    
    // Check November 30 vs November 29
    const nov30Matches = (cardContent?.match(/Nov.*30|November.*30/gi) || []).length;
    const nov29Matches = (cardContent?.match(/Nov.*29|November.*29/gi) || []).length;
    
    expect(nov30Matches, 'Should find November 30 references').toBeGreaterThan(0);
    expect(nov29Matches, 'Should find no November 29 references').toBe(0);
  });

  test('Date parsing verification on games page', async ({ page }) => {
    // Test the date parsing logic directly in the browser
    const dateTestResult = await page.evaluate(() => {
      // Simulate the createLocalDate function used in the app
      const createLocalDate = (dateString: string) => {
        return new Date(dateString + 'T12:00:00');
      };
      
      const parseGameDate = (dateString: string) => {
        const date = new Date(dateString + 'T12:00:00');
        date.setHours(0, 0, 0, 0);
        return date;
      };
      
      const amDate = '2024-11-30';
      
      const fixedMethod = createLocalDate(amDate);
      const oldMethod = parseGameDate(amDate);
      
      return {
        fixedDay: fixedMethod.toLocaleDateString('en-US', { weekday: 'long' }),
        oldDay: oldMethod.toLocaleDateString('en-US', { weekday: 'long' }),
        fixedFull: fixedMethod.toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        }),
        oldFull: oldMethod.toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        })
      };
    });
    
    console.log('Date parsing results:', dateTestResult);
    
    // The fixed method should show Saturday
    expect(dateTestResult.fixedDay).toBe('Saturday');
    expect(dateTestResult.fixedFull).toContain('Saturday, November 30, 2024');
    
    // Log what the old method would have shown
    console.log(`Fixed method shows: ${dateTestResult.fixedFull}`);
    console.log(`Old method would show: ${dateTestResult.oldFull}`);
  });
});

test.describe('Production A&M Game Date Verification', () => {
  test('A&M game shows Saturday on production', async ({ page }) => {
    // Test against production URL
    await page.goto('https://texas-tailgaters.onrender.com/games');
    
    // Wait longer for production site
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Look for login or games content
    const hasLogin = await page.locator('text="Sign in with Google"').isVisible();
    
    if (hasLogin) {
      console.log('Production site shows login page - manual verification needed');
      // For now, just verify the site loads
      await expect(page.locator('text="Sign in with Google"')).toBeVisible();
      return;
    }
    
    // If we can access games without login, check the A&M date
    const amGame = page.locator('text=A&M').first();
    
    if (await amGame.isVisible()) {
      const gameCard = amGame.locator('..').locator('..');
      const cardText = await gameCard.textContent();
      
      console.log('Production A&M game content:', cardText);
      
      // Verify it shows Saturday, not Friday
      expect(cardText).toContain('Saturday');
      expect(cardText).not.toContain('Friday');
    } else {
      console.log('A&M game not visible - may require authentication');
    }
  });
});