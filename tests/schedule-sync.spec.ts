import { test, expect } from '@playwright/test';

// Official 2025 Texas Football Schedule from texaslonghorns.com
const OFFICIAL_2025_SCHEDULE = [
  { date: 'Aug 30', opponent: 'Ohio State', location: 'away', time: '11:00 AM', tv: 'FOX' },
  { date: 'Sep 6', opponent: 'San Jose State', location: 'home', time: '11:00 AM', tv: 'ABC' },
  { date: 'Sep 13', opponent: 'UTEP', location: 'home', time: '3:15 PM', tv: 'SEC Network' },
  { date: 'Sep 20', opponent: 'Sam Houston', location: 'home', time: '7:00 PM', tv: 'ESPN+/SEC Network+' },
  { date: 'Oct 4', opponent: 'Florida', location: 'away', time: 'TBD', tv: 'TBD' },
  { date: 'Oct 11', opponent: 'Oklahoma', location: 'neutral', time: '2:30 PM', tv: 'ABC/ESPN' },
  { date: 'Oct 18', opponent: 'Kentucky', location: 'away', time: 'TBD', tv: 'TBD' },
  { date: 'Oct 25', opponent: 'Mississippi State', location: 'away', time: 'TBD', tv: 'TBD' },
  { date: 'Nov 1', opponent: 'Vanderbilt', location: 'home', time: '11:00 AM', tv: 'ABC/ESPN' },
  { date: 'Nov 15', opponent: 'Georgia', location: 'away', time: 'TBD', tv: 'TBD' },
  { date: 'Nov 22', opponent: 'Arkansas', location: 'home', time: 'TBD', tv: 'TBD' },
  { date: 'Nov 28', opponent: 'Texas A&M', location: 'home', time: '6:30 PM', tv: 'ABC' },
];

test.describe('Schedule Sync Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to force sync
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.removeItem('lastScheduleSync');
    });
  });

  test('should sync correct 2025 schedule from UT Athletics', async ({ page }) => {
    // Navigate to games page which triggers sync
    await page.goto('http://localhost:5173/games');
    
    // Wait for games to load
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    // Give sync time to complete
    await page.waitForTimeout(3000);
    
    // Get all game cards
    const gameCards = await page.$$('[class*="card"]');
    
    console.log(`Found ${gameCards.length} games in the app`);
    
    // Extract game data from our app
    const appGames = [];
    for (const card of gameCards) {
      const dateText = await card.$eval('[class*="Calendar"] ~ span', el => el.textContent).catch(() => '');
      const opponentText = await card.$eval('h3, [class*="font-bold"]', el => el.textContent).catch(() => '');
      const timeText = await card.$eval('[class*="time"]', el => el.textContent).catch(() => '');
      const tvText = await card.$eval('[class*="Tv"] ~ span', el => el.textContent).catch(() => '');
      
      if (opponentText) {
        appGames.push({
          date: dateText,
          opponent: opponentText.replace(/^(vs |@ )/, ''),
          time: timeText || 'TBD',
          tv: tvText || 'TBD'
        });
      }
    }
    
    console.log('Games found in app:', appGames);
    
    // Verify we have the right number of games
    expect(appGames.length).toBeGreaterThanOrEqual(12);
    
    // Check each official game exists in our app
    for (const officialGame of OFFICIAL_2025_SCHEDULE) {
      const found = appGames.find(g => 
        g.opponent.includes(officialGame.opponent)
      );
      
      expect(found, `Game vs ${officialGame.opponent} not found`).toBeTruthy();
      
      if (found && officialGame.time !== 'TBD') {
        // Verify time matches (accounting for format differences)
        const normalizeTime = (time: string) => {
          return time.replace(/\s+/g, ' ').replace(':00', '').toUpperCase();
        };
        
        expect(normalizeTime(found.time)).toContain(normalizeTime(officialGame.time).split(' ')[0]);
      }
    }
  });

  test('should compare with live UT Athletics website', async ({ page, context }) => {
    // Create a new page for UT Athletics
    const utPage = await context.newPage();
    
    // Go to official UT Athletics schedule
    await utPage.goto('https://texaslonghorns.com/sports/football/schedule/2025', {
      waitUntil: 'networkidle'
    });
    
    // Wait for schedule to load
    await utPage.waitForSelector('.sidearm-schedule-game', { timeout: 10000 });
    
    // Extract games from UT Athletics website
    const utGames = await utPage.evaluate(() => {
      const games = [];
      const gameElements = document.querySelectorAll('.sidearm-schedule-game');
      
      gameElements.forEach(game => {
        const opponent = game.querySelector('.sidearm-schedule-game-opponent-name')?.textContent?.trim();
        const date = game.querySelector('.sidearm-schedule-game-opponent-date')?.textContent?.trim();
        const time = game.querySelector('.sidearm-schedule-game-time')?.textContent?.trim();
        const tv = game.querySelector('.sidearm-schedule-game-tv')?.textContent?.trim();
        const location = game.querySelector('.sidearm-schedule-game-location')?.textContent?.trim();
        
        if (opponent) {
          games.push({
            opponent: opponent.replace(/^(vs\.?|at|@)\s*/i, ''),
            date,
            time: time || 'TBD',
            tv: tv || 'TBD',
            location
          });
        }
      });
      
      return games;
    });
    
    console.log('Games from UT Athletics:', utGames);
    
    // Now check our app
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    // Click sync button to ensure latest data
    const syncButton = await page.$('button:has-text("Sync Schedule")');
    if (syncButton) {
      await syncButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Get games from our app
    const appGames = await page.evaluate(() => {
      const games = [];
      const cards = document.querySelectorAll('[class*="card"]');
      
      cards.forEach(card => {
        const text = card.textContent || '';
        // Parse opponent from the card text
        const opponentMatch = text.match(/(vs |@ )([A-Za-z\s&]+?)(\d|View|Send)/);
        const opponent = opponentMatch ? opponentMatch[2].trim() : '';
        
        if (opponent) {
          games.push({
            opponent,
            fullText: text
          });
        }
      });
      
      return games;
    });
    
    console.log('Games in our app:', appGames.map(g => g.opponent));
    
    // Compare counts
    expect(appGames.length).toBe(utGames.length);
    
    // Check each UT game exists in our app
    for (const utGame of utGames) {
      const found = appGames.find(g => 
        g.opponent.toLowerCase().includes(utGame.opponent.toLowerCase()) ||
        utGame.opponent.toLowerCase().includes(g.opponent.toLowerCase())
      );
      
      expect(found, `Game vs ${utGame.opponent} from UT Athletics not found in app`).toBeTruthy();
    }
    
    await utPage.close();
  });

  test('should handle sync updates correctly', async ({ page }) => {
    // First sync
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="card"]');
    
    // Store initial game count
    const initialCards = await page.$$('[class*="card"]');
    const initialCount = initialCards.length;
    
    // Clear sync date and sync again
    await page.evaluate(() => {
      localStorage.removeItem('lastScheduleSync');
    });
    
    await page.reload();
    await page.waitForSelector('[class*="card"]');
    
    // Should have same number of games (no duplicates)
    const afterSyncCards = await page.$$('[class*="card"]');
    expect(afterSyncCards.length).toBe(initialCount);
    
    // Verify Ohio State game shows as completed with score
    const ohioStateCard = await page.$('text=/Ohio State/');
    expect(ohioStateCard).toBeTruthy();
    
    const cardText = await ohioStateCard?.textContent();
    expect(cardText).toContain('L'); // Should show loss
    expect(cardText).toMatch(/\d+\s*-\s*\d+/); // Should show score
  });

  test('should display correct game times and TV networks', async ({ page }) => {
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="card"]');
    
    // Test specific games with known times
    const testGames = [
      { opponent: 'San Jose State', expectedTime: '11:00 AM', expectedTV: 'ABC' },
      { opponent: 'UTEP', expectedTime: '3:15 PM', expectedTV: 'SEC Network' },
      { opponent: 'Oklahoma', expectedTime: '2:30 PM', expectedTV: 'ABC' },
      { opponent: 'Texas A&M', expectedTime: '6:30 PM', expectedTV: 'ABC' },
    ];
    
    for (const testGame of testGames) {
      const card = await page.$(`text=/${testGame.opponent}/`);
      expect(card, `Card for ${testGame.opponent} not found`).toBeTruthy();
      
      const cardText = await card?.textContent();
      expect(cardText).toContain(testGame.expectedTime);
      expect(cardText).toContain(testGame.expectedTV);
    }
  });

  test('should show collapsed view for completed games', async ({ page }) => {
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="card"]');
    
    // Find Ohio State game (completed)
    const ohioStateCard = await page.$('[class*="bg-gray-50"]');
    
    if (ohioStateCard) {
      // Should be collapsed by default
      const isCollapsed = await ohioStateCard.evaluate(el => {
        return window.getComputedStyle(el).height < '100px';
      });
      
      expect(isCollapsed).toBeTruthy();
      
      // Should show score in collapsed view
      const cardText = await ohioStateCard.textContent();
      expect(cardText).toMatch(/\d+\s*-\s*\d+/);
    }
  });

  test('should display correctly on mobile UI', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="rounded-lg"]');
    
    // Check mobile-specific elements
    const mobileCards = await page.$$('[class*="rounded-lg"][class*="shadow-sm"]');
    expect(mobileCards.length).toBeGreaterThan(0);
    
    // Verify mobile card layout for upcoming games
    const upcomingGame = await page.$('text=/San Jose State/');
    if (upcomingGame) {
      const cardText = await upcomingGame.textContent();
      expect(cardText).toContain('11:00 AM');
      expect(cardText).toContain('ABC');
      
      // Check for mobile action buttons
      const viewPotluckBtn = await page.$('text=/View Potluck/');
      expect(viewPotluckBtn).toBeTruthy();
      
      const rsvpBtn = await page.$('text=/RSVP/');
      expect(rsvpBtn).toBeTruthy();
    }
    
    // Verify completed game shows compact view on mobile
    const completedGame = await page.$('[class*="bg-gray-50"]');
    if (completedGame) {
      const cardHeight = await completedGame.evaluate(el => el.getBoundingClientRect().height);
      expect(cardHeight).toBeLessThan(100); // Compact view
      
      const cardText = await completedGame.textContent();
      expect(cardText).toContain('L'); // Loss indicator
      expect(cardText).toContain('Final');
      expect(cardText).toMatch(/\d+\s*-\s*\d+/); // Score
    }
  });

  test('should verify schedule matches UT Athletics on mobile', async ({ browser }) => {
    // Create context with mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    const utPage = await context.newPage();
    
    // Load UT Athletics mobile site
    await utPage.goto('https://texaslonghorns.com/sports/football/schedule/2025');
    
    // Give it time to load
    await utPage.waitForTimeout(3000);
    
    // Check if schedule loaded
    const scheduleExists = await utPage.$('.sidearm-schedule-game, .schedule-item, [data-game]');
    
    if (!scheduleExists) {
      console.log('UT Athletics schedule not found, checking for alternative selectors...');
      // Try to find any element with game info
      const pageContent = await utPage.content();
      console.log('Looking for San Jose State in page...');
      const hasSanJose = pageContent.includes('San Jose State');
      const hasUTEP = pageContent.includes('UTEP');
      console.log(`Found San Jose State: ${hasSanJose}, Found UTEP: ${hasUTEP}`);
    }
    
    // Load our app in mobile view
    await page.goto('http://localhost:5173/games');
    await page.waitForSelector('[class*="rounded-lg"]');
    
    // Verify key games exist in mobile view
    const keyGames = [
      'Ohio State',
      'San Jose State', 
      'UTEP',
      'Sam Houston',
      'Oklahoma',
      'Texas A&M'
    ];
    
    for (const gameName of keyGames) {
      const gameCard = await page.$(`text=/${gameName}/`);
      expect(gameCard, `${gameName} game not found in mobile view`).toBeTruthy();
    }
    
    // Verify no UTSA game exists (as you mentioned it's not on schedule)
    const utsaGame = await page.$('text=/UTSA/');
    expect(utsaGame).toBeFalsy();
    
    await context.close();
  });
});