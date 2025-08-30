import { chromium } from 'playwright';

async function testGameTimes() {
  console.log('Starting simplified game times verification test...');
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Navigate directly to games page to bypass login
    console.log('Navigating to http://localhost:5174/games...');
    await page.goto('http://localhost:5174/games', { waitUntil: 'domcontentloaded' });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'screenshots/current-state.png',
      fullPage: true 
    });
    
    // Check if we're on login page
    const pageContent = await page.content();
    const isLoginPage = pageContent.includes('Sign in to your account');
    
    if (isLoginPage) {
      console.log('On login page, attempting to sign in...');
      
      // Try to fill in the form
      try {
        await page.fill('input[type="email"]', 'test@texastailgaters.com');
        await page.fill('input[type="password"]', 'TestPassword123!');
        
        // Click sign in button
        await page.click('button:has-text("Sign In")');
        
        // Wait for navigation or error
        await page.waitForTimeout(3000);
        
        // Take screenshot after login attempt
        await page.screenshot({ 
          path: 'screenshots/after-login.png',
          fullPage: true 
        });
        
      } catch (e) {
        console.log('Login failed, continuing anyway...');
      }
    }
    
    // Check current page content
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for any game-related content
    console.log('\n=== SEARCHING FOR GAME CONTENT ===\n');
    
    // Check for Ohio State game
    const ohioStateVisible = await page.locator('text=/Ohio State/i').isVisible().catch(() => false);
    if (ohioStateVisible) {
      console.log('✅ Found Ohio State game on page');
      
      // Look for time near Ohio State
      const ohioStateCard = await page.locator('*:has-text("Ohio State")').first();
      const cardText = await ohioStateCard.textContent().catch(() => '');
      
      console.log('Ohio State card content:', cardText.substring(0, 200));
      
      // Check for 11:00 AM
      if (cardText.includes('11:00 AM')) {
        console.log('✅ CORRECT: Ohio State game shows 11:00 AM');
      } else if (cardText.includes('7:30 PM')) {
        console.log('❌ INCORRECT: Ohio State game still shows 7:30 PM');
      } else {
        const timeMatch = cardText.match(/\d{1,2}:\d{2}\s*[AP]M/);
        if (timeMatch) {
          console.log(`⚠️  Ohio State game shows: ${timeMatch[0]}`);
        } else {
          console.log('⚠️  No time found for Ohio State game');
        }
      }
      
      // Take screenshot of Ohio State game
      await ohioStateCard.screenshot({ 
        path: 'screenshots/ohio-state-game.png' 
      }).catch(() => console.log('Could not capture Ohio State card'));
    } else {
      console.log('❌ Ohio State game not found on page');
    }
    
    // Check for other games
    const gamesText = ['Oklahoma', 'San Jose State', 'Georgia', 'Texas A&M'];
    for (const game of gamesText) {
      const visible = await page.locator(`text=/${game}/i`).isVisible().catch(() => false);
      if (visible) {
        console.log(`✅ Found ${game} game`);
        
        // Try to get time for this game
        const gameElement = await page.locator(`*:has-text("${game}")`).first();
        const text = await gameElement.textContent().catch(() => '');
        const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[AP]M|TBD)/i);
        if (timeMatch) {
          console.log(`   Time: ${timeMatch[0]}`);
        }
      }
    }
    
    // Take final full page screenshot
    console.log('\nTaking final screenshot...');
    await page.screenshot({ 
      path: 'screenshots/final-page.png',
      fullPage: true 
    });
    
    // Try mobile view
    console.log('\n=== TESTING MOBILE VIEW ===\n');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-view.png',
      fullPage: true 
    });
    
    const mobileOhioState = await page.locator('text=/Ohio State/i').isVisible().catch(() => false);
    if (mobileOhioState) {
      console.log('✅ Ohio State visible in mobile view');
      const mobileCard = await page.locator('*:has-text("Ohio State")').first();
      const mobileText = await mobileCard.textContent().catch(() => '');
      
      if (mobileText.includes('11:00 AM')) {
        console.log('✅ Mobile shows correct time (11:00 AM)');
      } else if (mobileText.includes('7:30 PM')) {
        console.log('❌ Mobile still shows incorrect time (7:30 PM)');
      }
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
    console.log('Screenshots saved to screenshots/ directory');
    
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take error screenshot
    const pages = browser.contexts().flatMap(ctx => ctx.pages());
    if (pages.length > 0) {
      await pages[0].screenshot({ path: 'screenshots/error-state.png' });
    }
  } finally {
    // Keep browser open for 5 seconds to see the result
    console.log('Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
    console.log('Browser closed.');
  }
}

// Run the test
testGameTimes().catch(console.error);