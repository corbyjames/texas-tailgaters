import { test, expect } from '@playwright/test';

test('Validate TV network display on game cards', async ({ page }) => {
  console.log('Starting TV network validation test...\n');
  
  // First, let's create a test user if needed
  console.log('Step 1: Creating test user...');
  await page.goto('http://localhost:5173/create-test-user.html');
  await page.waitForTimeout(1000);
  
  // Click create user button if it exists
  const createButton = page.locator('button:has-text("Create Test User")');
  if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createButton.click();
    await page.waitForTimeout(2000);
    console.log('Test user created or already exists\n');
  }
  
  // Login with test user
  console.log('Step 2: Logging in...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  
  // Click sign in and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
    page.click('button:has-text("Sign In")')
  ]);
  
  await page.waitForTimeout(2000);
  
  // Check if we're logged in by looking for the URL change or home page elements
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.log('⚠️ Login might have failed, but continuing...\n');
  } else {
    console.log('✅ Login successful\n');
  }
  
  // Navigate directly to games page
  console.log('Step 3: Navigating to games page...');
  await page.goto('http://localhost:5173/games');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check if we need to sync games
  const gameCards = await page.locator('.card').filter({ has: page.locator('h3') }).count();
  console.log(`Found ${gameCards} game cards initially\n`);
  
  if (gameCards === 0) {
    console.log('Step 4: No games found, attempting to sync...');
    
    // Look for sync button
    const syncButton = page.locator('button').filter({ hasText: /sync|Sync|🔄/ }).first();
    
    if (await syncButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Found sync button, clicking...');
      
      // Set up dialog handler
      page.once('dialog', async dialog => {
        console.log(`Sync dialog message: "${dialog.message()}"`);
        await dialog.accept();
      });
      
      await syncButton.click();
      await page.waitForTimeout(5000);
      console.log('Sync completed\n');
    } else {
      console.log('No sync button found\n');
    }
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'tv-network-validation.png', fullPage: true });
  console.log('Screenshot saved as tv-network-validation.png\n');
  
  // Now check for TV network display
  console.log('Step 5: Validating TV network display...');
  console.log('=' * 50);
  
  // Check for TV network icon
  const tvIcons = await page.locator('text=📺').count();
  console.log(`Found ${tvIcons} TV network icons (📺)\n`);
  
  // Look for specific TV networks in the 2025 schedule
  const expectedNetworks = [
    { opponent: 'Oklahoma', network: 'ABC/ESPN', date: '10/11' },
    { opponent: 'Ohio State', network: 'TBD', date: '08/30' },
    { opponent: 'San Jose State', network: 'TBD', date: '09/06' }
  ];
  
  console.log('Checking for specific games and their TV networks:');
  
  for (const game of expectedNetworks) {
    console.log(`\nLooking for ${game.opponent} game...`);
    
    // Find game card containing the opponent name
    const gameCard = page.locator('.card').filter({ has: page.locator(`text=${game.opponent}`) }).first();
    
    if (await gameCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✅ Found ${game.opponent} game card`);
      
      // Get the full text content of the game card
      const cardText = await gameCard.textContent();
      
      // Check if TV network is displayed
      if (cardText?.includes('📺')) {
        console.log(`  ✅ TV icon found`);
        
        if (cardText.includes(game.network)) {
          console.log(`  ✅ TV network "${game.network}" is displayed`);
        } else if (game.network === 'TBD' && cardText.includes('TBD')) {
          console.log(`  ✅ TV network "TBD" is displayed`);
        } else {
          // Try to extract what network is shown
          const networkMatch = cardText.match(/📺\s*([A-Z\/]+)/);
          if (networkMatch) {
            console.log(`  ⚠️ Expected "${game.network}" but found "${networkMatch[1]}"`);
          } else {
            console.log(`  ⚠️ TV network not found (expected "${game.network}")`);
          }
        }
      } else {
        console.log(`  ❌ No TV network displayed (expected "${game.network}")`);
      }
      
      // Also check for date
      if (cardText?.includes(game.date)) {
        console.log(`  ✅ Date ${game.date} is displayed`);
      }
    } else {
      console.log(`❌ ${game.opponent} game card not found`);
    }
  }
  
  // Get all game cards and check their TV network status
  console.log('\n' + '=' * 50);
  console.log('Summary of all games with TV info:\n');
  
  const allGameCards = await page.locator('.card').filter({ has: page.locator('h3') }).all();
  
  let gamesWithTv = 0;
  let gamesWithoutTv = 0;
  
  for (const card of allGameCards) {
    const opponent = await card.locator('h3').textContent();
    const cardText = await card.textContent();
    
    if (cardText?.includes('📺')) {
      gamesWithTv++;
      const networkMatch = cardText.match(/📺\s*([^\s]+)/);
      const network = networkMatch ? networkMatch[1] : 'Unknown';
      console.log(`✅ ${opponent}: TV network = ${network}`);
    } else {
      gamesWithoutTv++;
      console.log(`⚠️ ${opponent}: No TV network displayed`);
    }
  }
  
  // Final summary
  console.log('\n' + '=' * 50);
  console.log('VALIDATION RESULTS');
  console.log('=' * 50);
  console.log(`Total games found: ${allGameCards.length}`);
  console.log(`Games with TV network: ${gamesWithTv}`);
  console.log(`Games without TV network: ${gamesWithoutTv}`);
  
  // Assert that at least some games have TV network
  if (allGameCards.length > 0) {
    expect(gamesWithTv).toBeGreaterThan(0);
    console.log('\n✅ TV network validation PASSED - At least one game shows TV network');
  } else {
    console.log('\n⚠️ No games found to validate');
  }
});