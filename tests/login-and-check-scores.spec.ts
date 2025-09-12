import { test, expect } from '@playwright/test';

test('Create test user, login, and check scores', async ({ page }) => {
  // Collect console logs
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    
    // Print important logs
    if (text.includes('useGames:') || text.includes('GameCard rendering')) {
      console.log('🎯', text);
    }
  });

  // First, try to create a new test account
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`Creating test account: ${testEmail}`);
  
  // Navigate to login page
  await page.goto('http://localhost:5173/login');
  
  // Click sign up link
  const signUpLink = page.locator('text="Sign up"');
  if (await signUpLink.isVisible()) {
    await signUpLink.click();
    await page.waitForTimeout(1000);
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Look for name field (might be present in signup)
    const nameField = page.locator('input[placeholder*="name" i]');
    if (await nameField.isVisible()) {
      await page.fill('input[placeholder*="name" i]', 'Test User');
    }
    
    // Click sign up button
    await page.click('button:has-text("Sign Up"), button:has-text("Create Account"), button:has-text("Register")');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
  }
  
  // Check if we're logged in by looking for URL change or content change
  let currentUrl = page.url();
  console.log('URL after signup attempt:', currentUrl);
  
  // If still on login, try to sign in
  if (currentUrl.includes('/login')) {
    console.log('Attempting to sign in with created account...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  }
  
  // Navigate to games page
  currentUrl = page.url();
  if (!currentUrl.includes('/games')) {
    console.log('Navigating to games page...');
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(3000);
  }
  
  // Check if we made it to games page
  const finalUrl = page.url();
  const pageContent = await page.textContent('body');
  
  console.log('\n📍 Final URL:', finalUrl);
  console.log('📍 On login page?', pageContent?.includes('Sign In') && pageContent?.includes('Password'));
  
  // Look for game cards
  const gameCards = await page.locator('.card, [class*="rounded"]').count();
  console.log(`📍 Found ${gameCards} game cards`);
  
  // Look for score patterns in the page
  const scoresVisible = await page.locator('text=/\\d+\\s*-\\s*\\d+/').count();
  console.log(`📍 Found ${scoresVisible} score displays`);
  
  // Get text from all cards
  const cards = await page.locator('.card, [class*="rounded"]').all();
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const cardText = await cards[i].textContent();
    console.log(`\n📇 Card ${i + 1} content:`, cardText?.substring(0, 150));
  }
  
  // Try alternate login with a known working account
  // Update these credentials to match your actual account
  const knownEmail = 'admin@example.com'; // <-- UPDATE THIS
  const knownPassword = 'admin123';        // <-- UPDATE THIS
  
  if (pageContent?.includes('Sign In')) {
    console.log('\n🔄 Trying alternate login with known account...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', knownEmail);
    await page.fill('input[type="password"]', knownPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Try games page again
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(3000);
    
    const afterKnownLogin = await page.textContent('body');
    console.log('📍 After known account login - On games page?', !afterKnownLogin?.includes('Sign In'));
  }
  
  // Print filtered console logs
  console.log('\n=== RELEVANT CONSOLE LOGS ===');
  consoleLogs
    .filter(log => log.includes('useGames') || log.includes('GameCard') || log.includes('score'))
    .forEach(log => console.log(log));
  
  // Take final screenshot
  await page.screenshot({ path: 'screenshots/final-games-page.png', fullPage: true });
  console.log('\n📸 Screenshot saved: screenshots/final-games-page.png');
});

test('Direct check with manual intervention', async ({ page }) => {
  console.log('\n' + '='.repeat(60));
  console.log('MANUAL LOGIN REQUIRED');
  console.log('='.repeat(60));
  console.log('1. The browser will open');
  console.log('2. Please login manually with your credentials');
  console.log('3. The test will continue after you login');
  console.log('='.repeat(60) + '\n');
  
  // Set longer timeout for manual login
  test.setTimeout(120000); // 2 minutes
  
  // Collect console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('useGames:') || text.includes('GameCard rendering')) {
      console.log('🎯 Console:', text);
    }
  });
  
  // Navigate to login
  await page.goto('http://localhost:5173/login');
  
  // Wait for manual login (watch for URL change)
  console.log('⏳ Waiting for you to login manually...');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60000 });
  
  console.log('✅ Login detected!');
  
  // Navigate to games
  await page.goto('http://localhost:5173/games');
  await page.waitForTimeout(3000);
  
  // Check for scores
  const scoresVisible = await page.locator('text=/\\d+\\s*-\\s*\\d+/').count();
  console.log(`\n📊 SCORES FOUND: ${scoresVisible}`);
  
  // Get game data
  const gameData = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card, [class*="card"]');
    const games: any[] = [];
    
    cards.forEach((card: any) => {
      const text = card.textContent || '';
      if (text && !text.includes('Sign In')) {
        games.push(text.substring(0, 200));
      }
    });
    
    return games;
  });
  
  console.log('\n📇 GAME CARDS CONTENT:');
  gameData.forEach((game, i) => {
    console.log(`Card ${i + 1}:`, game);
  });
  
  await page.screenshot({ path: 'screenshots/manual-login-games.png', fullPage: true });
  console.log('\n📸 Screenshot: screenshots/manual-login-games.png');
});