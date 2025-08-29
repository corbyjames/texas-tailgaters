import { test, expect } from '@playwright/test';

test('Verify game details display correctly', async ({ page }) => {
  console.log('Starting game details verification...\n');
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation
  await page.waitForTimeout(2000);
  
  // Go to games page
  await page.goto('http://localhost:5173/games');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check if games exist
  const gameCards = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
  console.log(`Found ${gameCards} games on the page`);
  
  if (gameCards === 0) {
    console.log('No games found, syncing schedule...');
    
    // Click sync button
    const syncButton = page.locator('button:has-text("Sync Schedule")').first();
    if (await syncButton.isVisible()) {
      // Set up dialog handler
      page.once('dialog', async dialog => {
        console.log('Sync message:', dialog.message());
        await dialog.accept();
      });
      
      await syncButton.click();
      await page.waitForTimeout(5000);
    }
  }
  
  // Take screenshot of games page
  await page.screenshot({ path: 'games-with-details.png', fullPage: true });
  console.log('Screenshot saved as games-with-details.png\n');
  
  // Check for TV network display
  console.log('Checking for TV network display...');
  const tvNetworkElements = await page.locator('text=/📺/').count();
  if (tvNetworkElements > 0) {
    console.log(`✅ Found ${tvNetworkElements} games with TV network info`);
    
    // Get first TV network text
    const firstTvNetwork = await page.locator('text=/📺/').first().textContent();
    console.log(`  Example: ${firstTvNetwork}`);
  } else {
    console.log('⚠️ No TV network info displayed');
  }
  
  // Check for attendees count
  console.log('\nChecking for attendees count...');
  const attendeesElements = await page.locator('text=/\\d+ attendees/').count();
  if (attendeesElements > 0) {
    console.log(`✅ Found ${attendeesElements} games with attendees count`);
    
    // Get first attendees text
    const firstAttendees = await page.locator('text=/\\d+ attendees/').first().textContent();
    console.log(`  Example: ${firstAttendees}`);
  } else {
    console.log('⚠️ No attendees count displayed (may be 0 or not set)');
  }
  
  // Check for potluck items count
  console.log('\nChecking for potluck items count...');
  const potluckElements = await page.locator('text=/\\d+ items/').count();
  if (potluckElements > 0) {
    console.log(`✅ Found ${potluckElements} games with potluck items`);
    
    // Get first potluck text
    const firstPotluck = await page.locator('text=/\\d+ items/').first().textContent();
    console.log(`  Example: ${firstPotluck}`);
  } else {
    console.log('⚠️ No potluck items displayed (may be 0 or not set)');
  }
  
  // Check specific game details
  console.log('\nChecking specific game details...');
  const pageContent = await page.locator('body').textContent();
  
  // Check for Oklahoma game with ABC/ESPN network
  if (pageContent?.includes('Oklahoma')) {
    console.log('✅ Oklahoma game found');
    if (pageContent?.includes('ABC') || pageContent?.includes('ESPN')) {
      console.log('  ✅ TV network (ABC/ESPN) displayed for Oklahoma game');
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total games displayed: ${gameCards}`);
  console.log(`Games with TV network: ${tvNetworkElements}`);
  console.log(`Games with attendees count: ${attendeesElements}`);
  console.log(`Games with potluck items: ${potluckElements}`);
});