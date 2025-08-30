import { chromium } from 'playwright';

async function testGameTimes() {
  console.log('Starting game times verification test...');
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Navigate to the app (using port 5174 since 5173 is in use)
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    
    // Check if we need to login
    const isLoginPage = await page.locator('text="Sign in to your account"').isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('Login required, signing in...');
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('**/games', { timeout: 10000 });
    }
    
    // Navigate to games page if not already there
    if (!page.url().includes('/games')) {
      console.log('Navigating to games page...');
      await page.goto('http://localhost:5174/games', { waitUntil: 'networkidle' });
    }
    
    // Wait for games to load
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    console.log('\n=== CHECKING GAME TIMES ===\n');
    
    // Expected game times for verification
    const expectedGames = [
      { opponent: 'Ohio State', expectedTime: '11:00 AM', date: '2025-08-30' },
      { opponent: 'Oklahoma', expectedTime: '2:30 PM', date: '2025-10-11' },
      { opponent: 'San Jose State', expectedTime: 'TBD', date: '2025-09-06' },
      { opponent: 'Georgia', expectedTime: 'TBD', date: '2025-10-18' },
      { opponent: 'Texas A&M', expectedTime: 'TBD', date: '2025-11-29' }
    ];
    
    // Check each expected game
    for (const expectedGame of expectedGames) {
      console.log(`\nChecking ${expectedGame.opponent}:`);
      console.log(`  Expected: ${expectedGame.date} at ${expectedGame.expectedTime}`);
      
      // Find the game card containing the opponent name
      const gameCard = await page.locator('.card', { hasText: expectedGame.opponent }).first();
      
      if (await gameCard.isVisible()) {
        // Extract the time from the game card
        const gameHeaderText = await gameCard.locator('[class*="text-sm"], [class*="text-xs"]').allTextContents();
        const fullText = gameHeaderText.join(' ');
        
        // Look for time pattern (e.g., "11:00 AM", "2:30 PM", "TBD")
        const timeMatch = fullText.match(/(\d{1,2}:\d{2}\s*[AP]M|TBD)/i);
        const displayedTime = timeMatch ? timeMatch[0].toUpperCase().replace(/\s+/g, ' ') : 'Not found';
        
        // Look for date
        const dateMatch = fullText.match(/(\w+,\s+\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/);
        const displayedDate = dateMatch ? dateMatch[0] : 'Not found';
        
        console.log(`  Displayed: ${displayedDate} at ${displayedTime}`);
        
        // Verify the time matches
        if (displayedTime === expectedGame.expectedTime.toUpperCase().replace(/\s+/g, ' ')) {
          console.log(`  ✅ TIME CORRECT`);
        } else {
          console.log(`  ❌ TIME MISMATCH!`);
        }
        
        // Take a screenshot of this game card
        await gameCard.screenshot({ 
          path: `screenshots/game-${expectedGame.opponent.replace(/\s+/g, '-').toLowerCase()}.png` 
        });
        
      } else {
        console.log(`  ⚠️  Game card not found`);
      }
    }
    
    // Take a full page screenshot
    console.log('\nTaking full page screenshot...');
    await page.screenshot({ 
      path: 'screenshots/games-page-full.png',
      fullPage: true 
    });
    
    // Check for any "completed" games with scores
    console.log('\n=== CHECKING FOR COMPLETED GAMES ===\n');
    const completedGames = await page.locator('.card:has-text("Final")').all();
    
    if (completedGames.length > 0) {
      console.log(`Found ${completedGames.length} completed game(s):`);
      
      for (const game of completedGames) {
        const opponent = await game.locator('h3, [class*="font-bold"]').first().textContent();
        const scoreText = await game.locator('text=/\\d+\\s*-\\s*\\d+/').textContent().catch(() => 'No score');
        const result = await game.locator('text=/W|L|T/').first().textContent().catch(() => 'No result');
        
        console.log(`  ${opponent}: ${scoreText} (${result})`);
      }
    } else {
      console.log('No completed games found (this is normal for future games)');
    }
    
    // Check for bowl games
    console.log('\n=== CHECKING FOR BOWL GAMES ===\n');
    const bowlGames = await page.locator('.card:has-text("Bowl")').all();
    
    if (bowlGames.length > 0) {
      console.log(`Found ${bowlGames.length} bowl game(s):`);
      for (const game of bowlGames) {
        const bowlName = await game.locator('text=/Bowl|Playoff|Championship/i').first().textContent();
        console.log(`  ${bowlName}`);
      }
    } else {
      console.log('No bowl games currently scheduled');
    }
    
    // Test mobile view
    console.log('\n=== TESTING MOBILE VIEW ===\n');
    await context.close();
    
    // Create mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });
    
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:5174/games', { waitUntil: 'networkidle' });
    
    // Check Ohio State game on mobile
    await mobilePage.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    const mobileOhioState = await mobilePage.locator('.card', { hasText: 'Ohio State' }).first();
    if (await mobileOhioState.isVisible()) {
      const mobileText = await mobileOhioState.textContent();
      console.log('Ohio State game on mobile:');
      
      if (mobileText.includes('11:00 AM')) {
        console.log('  ✅ Time displays correctly on mobile (11:00 AM)');
      } else {
        console.log('  ❌ Time not found or incorrect on mobile');
      }
      
      await mobilePage.screenshot({ 
        path: 'screenshots/mobile-games-ohio-state.png',
        fullPage: false 
      });
    }
    
    await mobilePage.screenshot({ 
      path: 'screenshots/mobile-games-full.png',
      fullPage: true 
    });
    
    console.log('\n=== TEST SUMMARY ===\n');
    console.log('✅ Game times verification completed');
    console.log('📸 Screenshots saved to screenshots/ directory');
    console.log('\nKey findings:');
    console.log('- Ohio State game should show 11:00 AM (not 7:30 PM)');
    console.log('- Oklahoma game should show 2:30 PM');
    console.log('- Most 2025 games should show TBD for time');
    
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take error screenshot
    const pages = browser.contexts().flatMap(ctx => ctx.pages());
    if (pages.length > 0) {
      await pages[0].screenshot({ path: 'screenshots/error-state.png' });
    }
  } finally {
    await browser.close();
    console.log('\nTest completed. Browser closed.');
  }
}

// Run the test
testGameTimes().catch(console.error);