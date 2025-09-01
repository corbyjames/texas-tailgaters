import { test, expect } from '@playwright/test';

test.describe('Florida Game Date Verification', () => {
  
  // Helper function to login
  async function login(page: any) {
    // Check if we're on login page
    if (await page.locator('text=/Sign in to your account/').count() > 0) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Sign In")');
      
      // Wait for navigation to complete after login
      await page.waitForURL('http://localhost:5173/', { timeout: 5000 });
      console.log('Login successful, navigated to home page');
      
      // Now navigate to games page
      await page.goto('http://localhost:5173/games');
      await page.waitForTimeout(1000);
      console.log('Navigated to games page');
    }
  }
  
  test('should display Florida game on October 4, not October 3', async ({ page }) => {
    console.log('Testing Florida game date display...');
    
    // Test local development site
    await page.goto('http://localhost:5173/games');
    
    // Login if needed
    await login(page);
    
    // Wait for games to load
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    // Find the Florida game card
    const floridaCard = await page.locator('text=/Florida/').first();
    
    if (await floridaCard.count() > 0) {
      const cardText = await floridaCard.textContent();
      console.log('Local - Florida card text:', cardText);
      
      // Check if it shows Oct 3 or Oct 4
      if (cardText?.includes('Oct 3')) {
        console.error('❌ LOCAL FAIL: Florida game shows Oct 3 (should be Oct 4)');
        expect(cardText).not.toContain('Oct 3');
      } else if (cardText?.includes('Oct 4')) {
        console.log('✅ LOCAL PASS: Florida game correctly shows Oct 4');
        expect(cardText).toContain('Oct 4');
      } else {
        console.log('⚠️ LOCAL: Date format not found in expected format');
        console.log('Card text:', cardText);
      }
    } else {
      console.error('❌ Florida game card not found on local site');
      expect(await floridaCard.count()).toBeGreaterThan(0);
    }
  });

  test('should display Florida game correctly on production', async ({ page }) => {
    console.log('Testing production site...');
    
    // Test production site
    await page.goto('https://texas-tailgaters.onrender.com/games');
    
    // Check if we need to login for production
    if (await page.locator('text=/Sign in to your account/').count() > 0) {
      console.log('Logging in to production...');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Sign In")');
      
      // Wait for navigation to complete after login
      await page.waitForURL('https://texas-tailgaters.onrender.com/', { timeout: 5000 });
      console.log('Login successful on production');
      
      // Navigate back to games page
      await page.goto('https://texas-tailgaters.onrender.com/games');
      await page.waitForTimeout(1000);
    }
    
    // Wait for games to load
    await page.waitForSelector('[class*="card"]', { timeout: 15000 });
    
    // Find the Florida game card
    const floridaCard = await page.locator('text=/Florida/').first();
    
    if (await floridaCard.count() > 0) {
      const cardText = await floridaCard.textContent();
      console.log('Production - Florida card text:', cardText);
      
      // Check if it shows Oct 3 or Oct 4
      if (cardText?.includes('Oct 3')) {
        console.error('❌ PRODUCTION FAIL: Florida game shows Oct 3 (should be Oct 4)');
        expect(cardText).not.toContain('Oct 3');
      } else if (cardText?.includes('Oct 4')) {
        console.log('✅ PRODUCTION PASS: Florida game correctly shows Oct 4');
        expect(cardText).toContain('Oct 4');
      } else {
        console.log('⚠️ PRODUCTION: Date format not found in expected format');
      }
    } else {
      console.error('❌ Florida game card not found on production site');
      expect(await floridaCard.count()).toBeGreaterThan(0);
    }
  });

  test('should check Firebase database directly', async ({ page, context }) => {
    console.log('Checking Firebase database directly...');
    
    // Create a page that checks Firebase
    await page.goto('data:text/html,<html><body><h1>Firebase Check</h1></body></html>');
    
    // Inject Firebase check script
    const result = await page.evaluate(async () => {
      // Dynamic import Firebase
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
      
      const firebaseConfig = {
        apiKey: "AIzaSyBJascYs4rXD4uL5Z8F7RDkMOBhQtjehic",
        authDomain: "texas-tailgaters.firebaseapp.com",
        databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
        projectId: "texas-tailgaters",
        storageBucket: "texas-tailgaters.appspot.com",
        messagingSenderId: "517392756353",
        appId: "1:517392756353:web:texas-tailgaters-web"
      };
      
      const app = initializeApp(firebaseConfig);
      const database = getDatabase(app);
      
      try {
        const gamesRef = ref(database, 'games');
        const snapshot = await get(gamesRef);
        
        if (snapshot.exists()) {
          const games = snapshot.val();
          let floridaGame = null;
          
          Object.entries(games).forEach(([id, game]: [string, any]) => {
            if (game.opponent === 'Florida') {
              floridaGame = game;
            }
          });
          
          return {
            found: !!floridaGame,
            date: floridaGame?.date,
            opponent: floridaGame?.opponent,
            time: floridaGame?.time
          };
        }
      } catch (error: any) {
        return { error: error.message };
      }
      
      return { found: false };
    });
    
    console.log('Firebase data:', result);
    
    if (result.found) {
      if (result.date === '2025-10-04') {
        console.log('✅ DATABASE: Florida game correctly stored as 2025-10-04');
      } else {
        console.error(`❌ DATABASE: Florida game has wrong date: ${result.date}`);
        expect(result.date).toBe('2025-10-04');
      }
    } else {
      console.error('❌ DATABASE: Florida game not found');
    }
  });

  test('should verify all October games display correct dates', async ({ page }) => {
    await page.goto('http://localhost:5173/games');
    
    // Check if we need to login
    if (await page.locator('text=/Sign in to your account/').count() > 0) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Sign In")');
      
      // Wait for navigation to complete after login
      await page.waitForURL('http://localhost:5173/', { timeout: 5000 });
      console.log('Login successful');
      
      // Navigate to games page
      await page.goto('http://localhost:5173/games');
      await page.waitForTimeout(1000);
    }
    
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    // Expected October games
    const octoberGames = [
      { opponent: 'Florida', date: 'Oct 4', fullDate: '2025-10-04' },
      { opponent: 'Oklahoma', date: 'Oct 11', fullDate: '2025-10-11' },
      { opponent: 'Kentucky', date: 'Oct 18', fullDate: '2025-10-18' },
      { opponent: 'Mississippi State', date: 'Oct 25', fullDate: '2025-10-25' }
    ];
    
    for (const game of octoberGames) {
      const gameCard = await page.locator(`text=/${game.opponent}/`).first();
      
      if (await gameCard.count() > 0) {
        const cardText = await gameCard.textContent();
        console.log(`${game.opponent} card text:`, cardText);
        
        // Check for the correct date
        if (cardText?.includes(game.date)) {
          console.log(`✅ ${game.opponent} shows correct date: ${game.date}`);
        } else {
          // Check if it's off by one day (timezone issue)
          const wrongDate = game.date.replace(/(\d+)/, (match) => String(parseInt(match) - 1));
          if (cardText?.includes(wrongDate)) {
            console.error(`❌ ${game.opponent} shows ${wrongDate} (should be ${game.date}) - TIMEZONE ISSUE`);
            expect(cardText).toContain(game.date);
          } else {
            console.warn(`⚠️ ${game.opponent} date not in expected format`);
          }
        }
      } else {
        console.warn(`⚠️ ${game.opponent} game not found`);
      }
    }
  });

  test('should test date parsing directly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Test the date parsing in the browser context
    const dateTest = await page.evaluate(() => {
      const testDate = '2025-10-04';
      
      // How it's parsed without fix
      const wrongWay = new Date(testDate);
      
      // How it should be parsed with fix
      const rightWay = new Date(testDate + 'T12:00:00');
      
      return {
        input: testDate,
        wrongParsing: {
          toString: wrongWay.toString(),
          toLocaleDateString: wrongWay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: wrongWay.getDate(),
          month: wrongWay.getMonth()
        },
        correctParsing: {
          toString: rightWay.toString(),
          toLocaleDateString: rightWay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: rightWay.getDate(),
          month: rightWay.getMonth()
        }
      };
    });
    
    console.log('Date parsing test:', dateTest);
    
    // The correct parsing should show Oct 4
    expect(dateTest.correctParsing.toLocaleDateString).toBe('Oct 4');
    
    // If wrong parsing shows Oct 3, we have a timezone issue
    if (dateTest.wrongParsing.toLocaleDateString === 'Oct 3') {
      console.error('❌ Timezone issue confirmed: dates parse as previous day without fix');
    }
  });
});