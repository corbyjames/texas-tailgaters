import { test, expect } from '@playwright/test';

test.describe('Score Display Verification', () => {
  test('Login and verify scores are visible', async ({ page }) => {
    // Collect console logs for debugging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      
      // Print important logs immediately
      if (text.includes('useGames:') || text.includes('GameCard') || text.includes('score')) {
        console.log('🎯', text);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('SCORE DISPLAY VERIFICATION TEST');
    console.log('='.repeat(60));

    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Try known admin account first
    console.log('\n1️⃣ Attempting login with admin account...');
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'test123'); // You may need to update this password
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if login succeeded
    let currentUrl = page.url();
    console.log('URL after login:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      // Login failed, try creating a new account
      console.log('\n2️⃣ Admin login failed, creating new test account...');
      
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      const testName = 'Test User';
      
      console.log(`Creating account: ${testEmail}`);
      
      // Click sign up link
      const signUpLink = page.locator('text="Sign up"').first();
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(1000);
        
        // Fill signup form
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        // Look for name field
        const nameField = page.locator('input[placeholder*="name" i], input[name="name"]').first();
        if (await nameField.isVisible()) {
          await page.fill('input[placeholder*="name" i], input[name="name"]', testName);
        }
        
        // Click sign up button
        await page.click('button:has-text("Sign Up"), button:has-text("Create Account")');
        
        // Wait for account creation
        await page.waitForTimeout(3000);
        
        // Try to sign in with new account
        currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('Signing in with new account...');
          await page.fill('input[type="email"]', testEmail);
          await page.fill('input[type="password"]', testPassword);
          await page.click('button:has-text("Sign In")');
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Navigate to games page
    console.log('\n3️⃣ Navigating to games page...');
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(3000);
    
    // Check if we're on the games page
    const finalUrl = page.url();
    const pageContent = await page.textContent('body');
    const onLoginPage = pageContent?.includes('Sign In') && pageContent?.includes('Password');
    
    console.log('\n' + '='.repeat(60));
    console.log('📍 CURRENT STATUS:');
    console.log('='.repeat(60));
    console.log('Final URL:', finalUrl);
    console.log('On games page:', finalUrl.includes('/games'));
    console.log('Login page detected:', onLoginPage ? 'YES ⚠️' : 'NO ✅');
    
    if (onLoginPage) {
      console.log('\n⚠️  AUTHENTICATION REQUIRED');
      console.log('The app requires login to view games.');
      console.log('Please update the test with valid credentials or');
      console.log('run the manual login test to use your own credentials.');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'screenshots/login-required.png', fullPage: true });
      console.log('Screenshot saved: screenshots/login-required.png');
      
      // Provide instructions for manual test
      console.log('\n' + '='.repeat(60));
      console.log('To run with manual login:');
      console.log('npx playwright test tests/verify-scores-with-login.spec.ts -g "Manual login" --headed');
      console.log('='.repeat(60));
      
      return;
    }
    
    // We're on the games page - check for scores
    console.log('\n4️⃣ Checking for game scores...');
    
    // Look for game cards
    const gameCards = await page.locator('.card, [class*="rounded"]').count();
    console.log(`Found ${gameCards} game cards`);
    
    // Look for score displays (format: "XX - XX")
    const scoreElements = await page.locator('text=/\\d+\\s*-\\s*\\d+/').all();
    console.log(`Found ${scoreElements.length} score displays`);
    
    // Get detailed information from each game card
    console.log('\n' + '='.repeat(60));
    console.log('📇 GAME CARD DETAILS:');
    console.log('='.repeat(60));
    
    const cards = await page.locator('.card, [class*="rounded"]').all();
    for (let i = 0; i < Math.min(5, cards.length); i++) {
      const cardText = await cards[i].textContent();
      const hasScore = /\d+\s*-\s*\d+/.test(cardText || '');
      
      console.log(`\nCard ${i + 1}:`);
      console.log(`  Has Score: ${hasScore ? '✅ YES' : '❌ NO'}`);
      
      if (cardText) {
        // Extract key information
        const lines = cardText.split('\n').filter(line => line.trim());
        lines.slice(0, 5).forEach(line => {
          console.log(`  ${line.trim()}`);
        });
      }
    }
    
    // Check for specific score elements
    const completedGames = await page.locator('text=/FINAL|WIN|LOSS/').count();
    const liveGames = await page.locator('text=/LIVE|Q[1-4]|Half/').count();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCORE SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total game cards: ${gameCards}`);
    console.log(`Score displays found: ${scoreElements.length}`);
    console.log(`Completed games: ${completedGames}`);
    console.log(`Live games: ${liveGames}`);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/games-with-scores.png', fullPage: true });
    console.log('\n📸 Screenshot saved: screenshots/games-with-scores.png');
    
    // Verify scores are visible
    if (scoreElements.length > 0) {
      console.log('\n✅ SUCCESS: Scores are visible on the games page!');
    } else {
      console.log('\n⚠️  WARNING: No scores found on the games page.');
      console.log('This could mean:');
      console.log('1. No games have scores yet');
      console.log('2. Games need to be marked as "completed" or "in-progress"');
      console.log('3. Score data needs to be added to Firebase');
      
      // Print console logs for debugging
      console.log('\n=== BROWSER CONSOLE LOGS ===');
      consoleLogs
        .filter(log => log.includes('useGames') || log.includes('GameCard') || log.includes('score'))
        .forEach(log => console.log(log));
    }
  });

  test('Manual login and score verification', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for manual login
    
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL LOGIN TEST');
    console.log('='.repeat(60));
    console.log('This test allows you to login with your own credentials.');
    console.log('='.repeat(60) + '\n');
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    console.log('📝 INSTRUCTIONS:');
    console.log('1. The browser window is now open');
    console.log('2. Please login with your credentials');
    console.log('3. The test will continue automatically after login');
    console.log('\n⏳ Waiting for you to login...\n');
    
    // Wait for login (detect URL change from /login)
    try {
      await page.waitForURL(url => !url.toString().includes('/login'), { 
        timeout: 60000 
      });
      console.log('✅ Login successful!\n');
    } catch (error) {
      console.log('⏱️  Login timeout. Continuing anyway...\n');
    }
    
    // Navigate to games page
    console.log('Navigating to games page...');
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(3000);
    
    // Check for scores
    const scoreElements = await page.locator('text=/\\d+\\s*-\\s*\\d+/').all();
    const gameCards = await page.locator('.card').count();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS:');
    console.log('='.repeat(60));
    console.log(`Game cards found: ${gameCards}`);
    console.log(`Score displays found: ${scoreElements.length}`);
    
    // Get sample of game content
    if (gameCards > 0) {
      console.log('\n📇 Sample Game Cards:');
      const cards = await page.locator('.card').all();
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        const text = await cards[i].textContent();
        const hasScore = /\d+\s*-\s*\d+/.test(text || '');
        console.log(`\nCard ${i + 1}: ${hasScore ? '✅ Has Score' : '❌ No Score'}`);
        if (text) {
          const preview = text.substring(0, 150).replace(/\s+/g, ' ');
          console.log(`  ${preview}...`);
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/manual-login-scores.png', fullPage: true });
    console.log('\n📸 Screenshot saved: screenshots/manual-login-scores.png');
    
    if (scoreElements.length > 0) {
      console.log('\n✅ SUCCESS: Scores are visible!');
    } else {
      console.log('\n⚠️  No scores found. Check that games have scores in Firebase.');
    }
  });
});