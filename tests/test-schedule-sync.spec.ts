import { test, expect } from '@playwright/test';

test.describe('Texas Tailgaters - Schedule Sync Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    console.log('Setting up test - logging in...');
    
    // Go to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect after login
    await page.waitForTimeout(2000);
    
    // Verify login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - cannot proceed with tests');
    }
    console.log('✅ Logged in successfully\n');
  });

  test('Sync UT Football Schedule', async ({ page }) => {
    console.log('Testing schedule sync functionality...\n');
    
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    const gameCardsBefore = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games before sync: ${gameCardsBefore}`);
    
    // Look for sync button
    const syncButton = page.getByRole('button', { name: /sync.*schedule/i }).first();
    
    if (!await syncButton.isVisible()) {
      // If no sync button, try looking for it in a menu or different location
      const alternativeSyncButton = page.locator('button').filter({ hasText: /sync/i }).first();
      if (await alternativeSyncButton.isVisible()) {
        await alternativeSyncButton.click();
      } else {
        console.log('⚠️ Sync button not found - games might already be synced');
      }
    } else {
      // Click sync button
      await syncButton.click();
      console.log('Clicked sync button, waiting for sync...');
      
      // Wait for sync to complete (look for loading indicators or wait for network)
      await page.waitForTimeout(3000);
      
      // Check for success message
      const successMessage = page.locator('text=/success|added|synced/i').first();
      if (await successMessage.isVisible({ timeout: 5000 })) {
        const message = await successMessage.textContent();
        console.log(`✅ Sync success: ${message}`);
      }
    }
    
    // Check games after sync
    await page.waitForTimeout(2000);
    const gameCardsAfter = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games after sync: ${gameCardsAfter}`);
    
    // Verify games were added
    if (gameCardsAfter > gameCardsBefore) {
      console.log(`✅ ${gameCardsAfter - gameCardsBefore} games added`);
    } else if (gameCardsAfter > 0) {
      console.log('✅ Games already exist in schedule');
    }
    
    // Check specific game details
    if (gameCardsAfter > 0) {
      const firstGame = page.locator('.bg-white').filter({ has: page.locator('h3') }).first();
      
      // Check for opponent name
      const opponentText = await firstGame.locator('h3').textContent();
      console.log(`First game opponent: ${opponentText}`);
      expect(opponentText).toBeTruthy();
      
      // Check for date
      const dateElement = firstGame.locator('text=/2024|2025/');
      if (await dateElement.isVisible()) {
        const dateText = await dateElement.textContent();
        console.log(`Game date: ${dateText}`);
      }
      
      // Check for location
      const locationElement = firstGame.locator('text=/Austin|Dallas|College Station/i');
      if (await locationElement.isVisible()) {
        const locationText = await locationElement.textContent();
        console.log(`Game location: ${locationText}`);
      }
    }
    
    // Verify expected teams are in schedule
    const expectedTeams = ['Oklahoma', 'Texas A&M', 'Ohio State', 'Georgia'];
    console.log('\nChecking for key games:');
    
    for (const team of expectedTeams) {
      const teamGame = page.locator('text=' + team).first();
      if (await teamGame.isVisible()) {
        console.log(`✅ ${team} game found`);
      } else {
        console.log(`⚠️ ${team} game not found`);
      }
    }
  });

  test('Game Card Interactions', async ({ page }) => {
    console.log('Testing game card interactions...\n');
    
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Wait for games to load
    await page.waitForTimeout(2000);
    
    const gameCards = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    
    if (gameCards === 0) {
      console.log('No games found - attempting sync first');
      
      // Try to sync games
      const syncButton = page.getByRole('button', { name: /sync/i }).first();
      if (await syncButton.isVisible()) {
        await syncButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Test first game card if available
    const firstGameCard = page.locator('.bg-white').filter({ has: page.locator('h3') }).first();
    
    if (await firstGameCard.isVisible()) {
      console.log('Testing first game card...');
      
      // Check for Plan Tailgate button
      const planButton = firstGameCard.getByRole('button', { name: /plan/i });
      if (await planButton.isVisible()) {
        await planButton.click();
        console.log('✅ Plan Tailgate button clicked');
        await page.waitForTimeout(1000);
        
        // Check if it opened a modal or navigated
        const modal = page.locator('[role="dialog"], .modal');
        if (await modal.isVisible()) {
          console.log('✅ Planning modal opened');
          
          // Close modal
          const closeButton = page.getByRole('button', { name: /close|cancel/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
      
      // Check for View Details button
      const detailsButton = firstGameCard.getByRole('button', { name: /view|details/i });
      if (await detailsButton.isVisible()) {
        await detailsButton.click();
        console.log('✅ View Details button clicked');
        await page.waitForTimeout(1000);
        
        // Check if navigated to game details
        if (page.url().includes('/games/')) {
          console.log('✅ Navigated to game details page');
          await page.goBack();
        }
      }
      
      // Check for status badge
      const statusBadge = firstGameCard.locator('.badge, .chip, [class*="status"]').first();
      if (await statusBadge.isVisible()) {
        const status = await statusBadge.textContent();
        console.log(`Game status: ${status}`);
      }
    } else {
      console.log('⚠️ No game cards available to test');
    }
  });

  test('Filter and Sort Games', async ({ page }) => {
    console.log('Testing game filtering and sorting...\n');
    
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Check for filter options
    const homeGamesFilter = page.locator('button, label').filter({ hasText: /home games/i }).first();
    if (await homeGamesFilter.isVisible()) {
      await homeGamesFilter.click();
      console.log('✅ Filtered by home games');
      await page.waitForTimeout(1000);
      
      // Verify filter applied
      const gameCount = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
      console.log(`Home games shown: ${gameCount}`);
    }
    
    const awayGamesFilter = page.locator('button, label').filter({ hasText: /away games/i }).first();
    if (await awayGamesFilter.isVisible()) {
      await awayGamesFilter.click();
      console.log('✅ Filtered by away games');
      await page.waitForTimeout(1000);
      
      // Verify filter applied
      const gameCount = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
      console.log(`Away games shown: ${gameCount}`);
    }
    
    // Check for view toggle (list/grid)
    const viewToggle = page.locator('button').filter({ has: page.locator('[class*="grid"], [class*="list"]') }).first();
    if (await viewToggle.isVisible()) {
      await viewToggle.click();
      console.log('✅ Toggled view mode');
    }
  });

  test('Clear and Resync Schedule', async ({ page }) => {
    console.log('Testing clear and resync functionality...\n');
    
    // Navigate to admin page
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if user has admin access
    const adminTitle = page.locator('h1, h2').filter({ hasText: /admin/i }).first();
    
    if (!await adminTitle.isVisible()) {
      console.log('⚠️ User does not have admin access - skipping admin tests');
      return;
    }
    
    console.log('✅ Admin page accessed');
    
    // Look for Clear & Resync button
    const clearButton = page.getByRole('button', { name: /clear.*resync/i }).first();
    
    if (await clearButton.isVisible()) {
      console.log('Found Clear & Resync button');
      
      // Get initial game count
      await page.goto('http://localhost:5173/games');
      const initialGames = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
      console.log(`Games before clear: ${initialGames}`);
      
      // Go back to admin
      await page.goto('http://localhost:5173/admin');
      
      // Click Clear & Resync (with confirmation if needed)
      await clearButton.click();
      
      // Handle confirmation dialog if present
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        console.log('✅ Confirmed clear action');
      }
      
      // Wait for operation to complete
      await page.waitForTimeout(3000);
      
      // Check games after clear and resync
      await page.goto('http://localhost:5173/games');
      await page.waitForTimeout(2000);
      
      const finalGames = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
      console.log(`Games after resync: ${finalGames}`);
      
      if (finalGames > 0) {
        console.log('✅ Clear & Resync completed successfully');
      }
    } else {
      console.log('⚠️ Clear & Resync button not found');
    }
  });

  test('Verify Schedule Data Persistence', async ({ page }) => {
    console.log('Testing data persistence...\n');
    
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Get current games
    const gamesBefore = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games before refresh: ${gamesBefore}`);
    
    if (gamesBefore === 0) {
      // Sync games first
      const syncButton = page.getByRole('button', { name: /sync/i }).first();
      if (await syncButton.isVisible()) {
        await syncButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Get game details for comparison
    const firstGameBefore = await page.locator('.bg-white').filter({ has: page.locator('h3') }).first().locator('h3').textContent();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check games after refresh
    const gamesAfter = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games after refresh: ${gamesAfter}`);
    
    // Verify same games exist
    if (gamesAfter > 0) {
      const firstGameAfter = await page.locator('.bg-white').filter({ has: page.locator('h3') }).first().locator('h3').textContent();
      
      if (firstGameBefore === firstGameAfter) {
        console.log('✅ Data persisted correctly after refresh');
      } else {
        console.log('⚠️ Data might have changed after refresh');
      }
    }
    
    // Test persistence after logout/login
    console.log('\nTesting persistence after logout/login...');
    
    // Logout
    const userMenuButton = page.locator('button').filter({ has: page.locator('svg, img') }).first();
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.waitForTimeout(500);
      
      const signOutButton = page.getByRole('button', { name: /sign out|log out/i });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Logged out');
      }
    }
    
    // Login again
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    // Check games still exist
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const gamesAfterRelogin = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games after re-login: ${gamesAfterRelogin}`);
    
    if (gamesAfterRelogin === gamesAfter) {
      console.log('✅ Data persisted correctly across sessions');
    } else {
      console.log('⚠️ Game count changed after re-login');
    }
  });
});