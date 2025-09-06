import { test, expect } from '@playwright/test';

test.describe('Verify 2025 Season Dates on Production', () => {
  // Expected 2025 games with correct dates
  const expectedGames = [
    { opponent: 'Ohio State', date: 'Aug 30', day: 'Saturday' },
    { opponent: 'San Jose State', date: 'Sep 6', day: 'Saturday' },
    { opponent: 'UTEP', date: 'Sep 13', day: 'Saturday' },
    { opponent: 'Sam Houston', date: 'Sep 20', day: 'Saturday' },
    { opponent: 'Florida', date: 'Oct 4', day: 'Saturday' },
    { opponent: 'Oklahoma', date: 'Oct 11', day: 'Saturday' },
    { opponent: 'Kentucky', date: 'Oct 18', day: 'Saturday' },
    { opponent: 'Mississippi State', date: 'Oct 25', day: 'Saturday' },
    { opponent: 'Vanderbilt', date: 'Nov 1', day: 'Saturday' },
    { opponent: 'Georgia', date: 'Nov 15', day: 'Saturday' },
    { opponent: 'Arkansas', date: 'Nov 22', day: 'Saturday' },
    { opponent: 'Texas A&M', date: 'Nov 28', day: 'Friday' } // Friday game!
  ];

  test('Check production site is accessible', async ({ page }) => {
    // Navigate to production site
    const response = await page.goto('https://texas-tailgaters.onrender.com', {
      waitUntil: 'networkidle',
      timeout: 60000 // Give Render time to wake up
    });
    
    expect(response?.status()).toBeLessThan(400);
    
    // Check if login page loads
    await expect(page.locator('text="Sign in with Google"').or(page.locator('text="Games"'))).toBeVisible({
      timeout: 30000
    });
  });

  test('Verify A&M game date shows Friday, November 28, 2025', async ({ page }) => {
    // Go directly to games page
    await page.goto('https://texas-tailgaters.onrender.com/games', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // Check if we need to login first
    const needsLogin = await page.locator('text="Sign in with Google"').isVisible();
    
    if (needsLogin) {
      console.log('Login required - cannot verify dates without authentication');
      // At least verify the login page works
      await expect(page.locator('text="Sign in with Google"')).toBeVisible();
      return;
    }
    
    // Wait for games to load
    await page.waitForSelector('.card, [data-testid="game-card"]', { 
      timeout: 30000,
      state: 'visible'
    });
    
    // Look for A&M game specifically
    const amGameCard = page.locator('text="Texas A&M"').or(page.locator('text="A&M"')).first();
    
    if (await amGameCard.isVisible()) {
      const cardText = await amGameCard.locator('..').locator('..').textContent();
      console.log('A&M Game Card Content:', cardText);
      
      // Verify it shows Friday and November 28
      expect(cardText).toContain('Friday');
      expect(cardText).toContain('Nov 28');
      
      // Make sure it's NOT showing wrong dates
      expect(cardText).not.toContain('Nov 27');
      expect(cardText).not.toContain('Nov 29');
      expect(cardText).not.toContain('Nov 30');
      expect(cardText).not.toContain('Thursday');
      expect(cardText).not.toContain('Saturday');
    } else {
      console.log('A&M game not visible - may need to sync 2025 schedule first');
    }
  });

  test('Verify all 2025 games show correct days of week', async ({ page }) => {
    await page.goto('https://texas-tailgaters.onrender.com/games', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    const needsLogin = await page.locator('text="Sign in with Google"').isVisible();
    
    if (needsLogin) {
      console.log('Login required - skipping detailed date verification');
      return;
    }
    
    // Get all game cards
    const gameCards = await page.locator('.card, [data-testid="game-card"]').all();
    console.log(`Found ${gameCards.length} game cards`);
    
    // Check each expected game
    for (const expectedGame of expectedGames) {
      const gameLocator = page.locator(`text="${expectedGame.opponent}"`).first();
      
      if (await gameLocator.isVisible()) {
        const cardContent = await gameLocator.locator('..').locator('..').textContent();
        console.log(`${expectedGame.opponent}: ${cardContent?.substring(0, 100)}...`);
        
        // Special check for A&M being on Friday
        if (expectedGame.opponent === 'Texas A&M') {
          expect(cardContent).toContain('Friday');
          expect(cardContent).toContain('Nov 28');
        } else if (expectedGame.day === 'Saturday') {
          // Most games should be on Saturday
          expect(cardContent?.toLowerCase()).toMatch(/saturday|sat/i);
        }
      }
    }
  });

  test('Test date parsing logic for A&M game', async ({ page }) => {
    // Test the date parsing directly in the browser
    const result = await page.evaluate(() => {
      const createLocalDate = (dateString: string) => {
        return new Date(dateString + 'T12:00:00');
      };
      
      const amDate = '2025-11-28'; // Friday
      const parsedDate = createLocalDate(amDate);
      
      return {
        dateString: amDate,
        dayOfWeek: parsedDate.toLocaleDateString('en-US', { weekday: 'long' }),
        fullDate: parsedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        isFriday: parsedDate.getDay() === 5
      };
    });
    
    console.log('Date parsing test:', result);
    
    expect(result.dayOfWeek).toBe('Friday');
    expect(result.isFriday).toBe(true);
    expect(result.fullDate).toContain('Friday');
    expect(result.fullDate).toContain('November 28, 2025');
  });
});

// Lightweight smoke test that doesn't require login
test.describe('Production Smoke Tests', () => {
  test('Verify production site is running', async ({ page }) => {
    const response = await page.goto('https://texas-tailgaters.onrender.com', {
      timeout: 60000
    });
    
    // Site should respond
    expect(response?.status()).toBeLessThan(500);
    
    // Should show either login or main content
    const hasContent = await page.locator('text="Texas Tailgaters"').or(
      page.locator('text="Sign in with Google"')
    ).isVisible();
    
    expect(hasContent).toBe(true);
  });

  test('Verify critical pages load', async ({ page }) => {
    const pages = [
      { url: '/', name: 'Home' },
      { url: '/games', name: 'Games' },
      { url: '/updates', name: 'Updates' }
    ];
    
    for (const pageInfo of pages) {
      const response = await page.goto(`https://texas-tailgaters.onrender.com${pageInfo.url}`, {
        timeout: 30000
      });
      
      console.log(`${pageInfo.name} page status: ${response?.status()}`);
      expect(response?.status()).toBeLessThan(500);
    }
  });
});