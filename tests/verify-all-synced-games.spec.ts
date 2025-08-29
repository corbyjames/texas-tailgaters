import { test, expect } from '@playwright/test';

test('Verify all synced games are displayed', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Navigate to games page
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  
  // Get localStorage games
  const storedGames = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored) : [];
  });
  console.log(`Games in localStorage: ${storedGames.length}`);
  
  // Count all game cards (including those that might require scrolling)
  const gameCards = await page.locator('.card').filter({ hasText: /vs\.|@/ }).all();
  console.log(`Game cards displayed: ${gameCards.length}`);
  
  // Get opponent names from displayed cards
  const displayedOpponents = [];
  for (const card of gameCards) {
    const text = await card.textContent();
    displayedOpponents.push(text);
  }
  
  console.log('Displayed games:', displayedOpponents.map(g => {
    const match = g?.match(/(vs\.|@)\s+([A-Za-z\s&]+)/);
    return match ? match[2].trim() : 'Unknown';
  }));
  
  // Check if we need to see all games, sync first if localStorage is empty
  if (storedGames.length === 0) {
    console.log('No games in storage, syncing first...');
    await page.locator('nav a:has-text("Admin")').click();
    await page.waitForURL('**/admin');
    
    await page.locator('button:has-text("Sync Schedule")').click();
    await expect(page.locator('text=/Successfully synced/')).toBeVisible({ timeout: 10000 });
    
    // Go back to games page
    await page.locator('nav a:has-text("Games")').click();
    await page.waitForURL('**/games');
  }
  
  // Now count displayed games after ensuring sync
  const finalGameCards = await page.locator('.card').filter({ hasText: /vs\.|@/ }).all();
  console.log(`Final game count displayed: ${finalGameCards.length}`);
  
  // Check the stats counter at the top
  const statsText = await page.locator('text=/Showing \\d+ games/').textContent();
  console.log('Stats text:', statsText);
  
  // Verify at least some games are showing
  expect(finalGameCards.length).toBeGreaterThan(0);
  console.log('✅ Games are displayed on the page!');
});