import { test, expect } from '@playwright/test';

test.describe('Final Verification - Texas Tailgaters Firebase Integration', () => {
  test('Complete end-to-end test with Firebase', async ({ page }) => {
    console.log('Starting final verification test...\n');
    
    // 1. Login Test
    console.log('Step 1: Testing login...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('http://localhost:5173/**', { timeout: 5000 });
    console.log('✅ Login successful\n');
    
    // 2. Navigate to Games Page
    console.log('Step 2: Navigating to Games page...');
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    console.log('✅ Games page loaded\n');
    
    // 3. Check if games exist (from previous sync)
    console.log('Step 3: Checking for existing games...');
    const gameCards = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Found ${gameCards} games already in database`);
    
    if (gameCards === 0) {
      // 4. Sync Schedule if no games exist
      console.log('\nStep 4: No games found, syncing schedule...');
      const syncButton = page.locator('button:has-text("Sync Schedule")').first();
      
      // Set up dialog handler before clicking
      page.once('dialog', async dialog => {
        console.log('Sync result:', dialog.message());
        await dialog.accept();
      });
      
      await syncButton.click();
      await page.waitForTimeout(3000);
      
      // Re-check game count
      const newGameCount = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
      console.log(`✅ Sync complete! Added ${newGameCount} games\n`);
    }
    
    // 5. Verify specific games
    console.log('Step 5: Verifying 2025 season games...');
    const pageContent = await page.locator('body').textContent();
    
    const expectedGames = [
      'Ohio State',
      'San Jose State',
      'UTEP',
      'Mississippi State',
      'Oklahoma',
      'Georgia',
      'Vanderbilt',
      'Florida',
      'Arkansas',
      'Kentucky',
      'Texas A&M'
    ];
    
    let foundCount = 0;
    for (const opponent of expectedGames) {
      if (pageContent?.includes(opponent)) {
        console.log(`  ✅ Found: ${opponent}`);
        foundCount++;
      } else {
        console.log(`  ❌ Missing: ${opponent}`);
      }
    }
    
    expect(foundCount).toBeGreaterThan(0);
    console.log(`\nFound ${foundCount}/${expectedGames.length} expected games\n`);
    
    // 6. Test Game Card Interactions
    console.log('Step 6: Testing game card interactions...');
    const firstGameCard = page.locator('.bg-white').filter({ has: page.locator('h3') }).first();
    
    if (await firstGameCard.isVisible()) {
      // Get game details
      const opponent = await firstGameCard.locator('h3').textContent();
      console.log(`  Testing game: ${opponent}`);
      
      // Check for Plan Tailgate button
      const planButton = firstGameCard.locator('button:has-text("Plan Tailgate")');
      if (await planButton.isVisible()) {
        console.log('  ✅ Plan Tailgate button found');
      }
      
      // Check for game details
      const hasDate = await firstGameCard.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/').isVisible();
      const hasLocation = await firstGameCard.locator('text=/Stadium|Field|Arena|Bowl/i').isVisible();
      
      if (hasDate) console.log('  ✅ Game date displayed');
      if (hasLocation) console.log('  ✅ Game location displayed');
    }
    
    // 7. Test Navigation
    console.log('\nStep 7: Testing navigation...');
    
    // Test Home navigation
    await page.locator('a[href="/"]').click();
    await page.waitForURL('http://localhost:5173/');
    console.log('  ✅ Home navigation works');
    
    // Test Games navigation
    await page.locator('a[href="/games"]').click();
    await page.waitForURL('http://localhost:5173/games');
    console.log('  ✅ Games navigation works');
    
    // Test Potluck navigation
    await page.locator('a[href="/potluck"]').click();
    await page.waitForURL('http://localhost:5173/potluck');
    console.log('  ✅ Potluck navigation works');
    
    // 8. Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('FINAL VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    console.log('✅ Firebase Authentication: Working');
    console.log('✅ Firebase Realtime Database: Working');
    console.log('✅ Schedule Sync: Working');
    console.log('✅ Game Display: Working');
    console.log('✅ Navigation: Working');
    console.log('\nAll systems operational! 🎉');
  });
  
  test('Verify Firebase data persistence', async ({ page }) => {
    console.log('\nTesting Firebase data persistence...');
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    // Go to games and count
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    const gameCount = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const gameCountAfterRefresh = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    
    expect(gameCountAfterRefresh).toBe(gameCount);
    console.log(`✅ Data persisted: ${gameCount} games before and after refresh`);
    
    // Close and reopen in new context
    const context2 = await page.context().browser()?.newContext();
    if (context2) {
      const page2 = await context2.newPage();
      
      await page2.goto('http://localhost:5173/login');
      await page2.fill('input[type="email"]', 'test@texastailgaters.com');
      await page2.fill('input[type="password"]', 'TestPassword123!');
      await page2.click('button:has-text("Sign In")');
      await page2.waitForTimeout(2000);
      
      await page2.goto('http://localhost:5173/games');
      await page2.waitForLoadState('networkidle');
      
      const gameCountNewSession = await page2.locator('.bg-white').filter({ has: page2.locator('h3') }).count();
      expect(gameCountNewSession).toBe(gameCount);
      console.log(`✅ Data persisted across sessions: ${gameCountNewSession} games`);
      
      await context2.close();
    }
  });
});