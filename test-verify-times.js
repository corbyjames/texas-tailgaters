import { chromium } from 'playwright';

async function verifyGameTimes() {
  console.log('Starting game times verification...');
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Navigate to app
    console.log('Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if login is needed
    const needsLogin = await page.locator('text="Sign in to your account"').isVisible().catch(() => false);
    
    if (needsLogin) {
      console.log('Logging in with test account...');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Sign In")');
      
      // Wait for login to complete
      await page.waitForURL('**/', { timeout: 10000 });
      console.log('Login successful!');
    }
    
    // Click on "View Season Schedule"
    console.log('Navigating to games page...');
    await page.click('text="View Season Schedule"');
    await page.waitForURL('**/games', { timeout: 10000 });
    
    // Wait for games to load
    await page.waitForSelector('.card', { timeout: 10000 });
    console.log('Games page loaded!');
    
    // Take screenshot of games page
    await page.screenshot({ 
      path: 'screenshots/games-page.png',
      fullPage: true 
    });
    
    console.log('\n=== VERIFYING GAME TIMES ===\n');
    
    // Critical games to check
    const criticalGames = [
      { opponent: 'Ohio State', expectedTime: '11:00 AM', expectedDate: 'Aug 30' },
      { opponent: 'Oklahoma', expectedTime: '2:30 PM', expectedDate: 'Oct 11' },
      { opponent: 'San Jose State', expectedTime: 'TBD' },
      { opponent: 'Georgia', expectedTime: 'TBD' },
      { opponent: 'Texas A&M', expectedTime: 'TBD' }
    ];
    
    let allCorrect = true;
    
    for (const game of criticalGames) {
      console.log(`\nChecking ${game.opponent}:`);
      
      // Find game card
      const gameCard = await page.locator('.card', { hasText: game.opponent }).first();
      
      if (await gameCard.isVisible()) {
        const cardText = await gameCard.textContent();
        
        // Check time
        const hasExpectedTime = cardText.includes(game.expectedTime);
        const timeMatch = cardText.match(/(\d{1,2}:\d{2}\s*[AP]M|TBD)/i);
        const displayedTime = timeMatch ? timeMatch[0].toUpperCase().replace(/\s+/g, ' ') : 'Not found';
        
        console.log(`  Expected time: ${game.expectedTime}`);
        console.log(`  Displayed time: ${displayedTime}`);
        
        if (hasExpectedTime) {
          console.log(`  ✅ TIME CORRECT`);
        } else {
          console.log(`  ❌ TIME INCORRECT`);
          allCorrect = false;
          
          // Special check for Ohio State
          if (game.opponent === 'Ohio State' && cardText.includes('7:30 PM')) {
            console.log(`  ⚠️  CRITICAL ERROR: Ohio State still shows 7:30 PM instead of 11:00 AM!`);
          }
        }
        
        // Check date if provided
        if (game.expectedDate) {
          const hasExpectedDate = cardText.includes(game.expectedDate);
          if (hasExpectedDate) {
            console.log(`  ✅ Date correct (${game.expectedDate})`);
          } else {
            console.log(`  ⚠️  Date may be incorrect`);
          }
        }
        
        // Take screenshot of this specific game
        await gameCard.screenshot({ 
          path: `screenshots/game-${game.opponent.replace(/\s+/g, '-').toLowerCase()}.png` 
        });
        
      } else {
        console.log(`  ❌ Game card not found!`);
        allCorrect = false;
      }
    }
    
    // Test mobile view
    console.log('\n\n=== TESTING MOBILE VIEW ===\n');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-games.png',
      fullPage: true 
    });
    
    // Check Ohio State on mobile
    const mobileOhioState = await page.locator('.card', { hasText: 'Ohio State' }).first();
    if (await mobileOhioState.isVisible()) {
      const mobileText = await mobileOhioState.textContent();
      
      console.log('Ohio State on mobile:');
      if (mobileText.includes('11:00 AM')) {
        console.log('  ✅ Shows correct time (11:00 AM)');
      } else if (mobileText.includes('7:30 PM')) {
        console.log('  ❌ Still shows incorrect time (7:30 PM)');
        allCorrect = false;
      } else {
        const timeMatch = mobileText.match(/\d{1,2}:\d{2}\s*[AP]M/);
        if (timeMatch) {
          console.log(`  ⚠️  Shows: ${timeMatch[0]}`);
        }
      }
    }
    
    // Final summary
    console.log('\n\n=== TEST SUMMARY ===\n');
    if (allCorrect) {
      console.log('✅ ALL GAME TIMES ARE CORRECT!');
    } else {
      console.log('❌ SOME GAME TIMES ARE INCORRECT');
      console.log('\nKey issues:');
      console.log('- Ohio State should show 11:00 AM (not 7:30 PM)');
      console.log('- Oklahoma should show 2:30 PM');
      console.log('- Most 2025 games should show TBD');
    }
    
    console.log('\n📸 Screenshots saved to screenshots/ directory');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    
    // Take error screenshot
    const pages = browser.contexts().flatMap(ctx => ctx.pages());
    if (pages.length > 0) {
      await pages[0].screenshot({ path: 'screenshots/error-state.png' });
    }
  } finally {
    // Keep browser open for observation
    console.log('\nKeeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
    console.log('Test complete. Browser closed.');
  }
}

// Run the verification
verifyGameTimes().catch(console.error);