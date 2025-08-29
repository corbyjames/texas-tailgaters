import { test, expect } from '@playwright/test';

test('Verify 2025 schedule syncs correctly', async ({ page }) => {
  // Clear localStorage and start fresh
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.removeItem('texasTailgatersGames');
  });
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Navigate to admin page
  await page.locator('nav a:has-text("Admin")').click();
  await page.waitForURL('**/admin');
  
  // Click sync button
  console.log('Syncing schedule...');
  await page.locator('button:has-text("Sync Schedule")').click();
  
  // Wait for success message
  const successMessage = await page.locator('text=/Successfully synced|Updated|Schedule is already up to date/').textContent({ timeout: 10000 });
  console.log('Sync message:', successMessage);
  
  // Get all synced games from localStorage
  const syncedGames = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored) : [];
  });
  
  console.log(`\nTotal games synced: ${syncedGames.length}`);
  
  // Separate games by year
  const games2024 = syncedGames.filter((g: any) => g.date && g.date.startsWith('2024'));
  const games2025 = syncedGames.filter((g: any) => g.date && g.date.startsWith('2025'));
  const gamesOther = syncedGames.filter((g: any) => !g.date || (!g.date.startsWith('2024') && !g.date.startsWith('2025')));
  
  console.log(`2024 games: ${games2024.length}`);
  console.log(`2025 games: ${games2025.length}`);
  console.log(`Other games: ${gamesOther.length}`);
  
  // Expected 2025 games (corrected schedule)
  const expected2025Games = [
    { date: '2025-08-30', opponent: 'Ohio State', location: 'Columbus, OH', isHome: false },
    { date: '2025-09-06', opponent: 'San Jose State', location: 'Austin, TX', isHome: true },
    { date: '2025-09-13', opponent: 'UTSA', location: 'Austin, TX', isHome: true },
    { date: '2025-09-20', opponent: 'Colorado State', location: 'Austin, TX', isHome: true },
    { date: '2025-10-04', opponent: 'Mississippi State', location: 'Austin, TX', isHome: true },
    { date: '2025-10-11', opponent: 'Oklahoma', location: 'Dallas, TX', isHome: false },
    { date: '2025-10-18', opponent: 'Georgia', location: 'Austin, TX', isHome: true },
    { date: '2025-10-25', opponent: 'Vanderbilt', location: 'Nashville, TN', isHome: false },
    { date: '2025-11-01', opponent: 'Florida', location: 'Austin, TX', isHome: true },
    { date: '2025-11-15', opponent: 'Arkansas', location: 'Fayetteville, AR', isHome: false },
    { date: '2025-11-22', opponent: 'Kentucky', location: 'Austin, TX', isHome: true },
    { date: '2025-11-29', opponent: 'Texas A&M', location: 'College Station, TX', isHome: false },
  ];
  
  console.log('\n=== 2025 Schedule Verification ===');
  console.log(`Expected 2025 games: ${expected2025Games.length}`);
  console.log(`Actual 2025 games synced: ${games2025.length}`);
  
  // Check each expected game
  console.log('\nDetailed 2025 game check:');
  for (const expectedGame of expected2025Games) {
    const found = games2025.find((g: any) => 
      g.date === expectedGame.date && 
      g.opponent === expectedGame.opponent
    );
    
    if (found) {
      console.log(`✅ ${expectedGame.date} - ${expectedGame.opponent} (${expectedGame.isHome ? 'Home' : 'Away'})`);
    } else {
      console.log(`❌ MISSING: ${expectedGame.date} - ${expectedGame.opponent} (${expectedGame.isHome ? 'Home' : 'Away'})`);
    }
  }
  
  // List actual 2025 games synced
  console.log('\nActual 2025 games in system:');
  games2025.forEach((game: any) => {
    console.log(`  - ${game.date}: ${game.opponent} at ${game.location} (${game.isHome ? 'Home' : 'Away'})`);
  });
  
  // Navigate to games page to see displayed games
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  await page.waitForTimeout(1000);
  
  // Count displayed games
  const displayedCards = await page.locator('.card').filter({ hasText: /vs\.|@/ }).all();
  console.log(`\nGames displayed on Games page: ${displayedCards.length}`);
  
  // Check for specific 2025 games on the page
  console.log('\nChecking for 2025 games on display:');
  const key2025Games = ['Ohio State', 'Texas A&M', 'Oklahoma', 'Georgia'];
  
  for (const opponent of key2025Games) {
    const gameCard = page.locator('.card').filter({ hasText: opponent });
    const isVisible = await gameCard.count() > 0;
    console.log(`${isVisible ? '✅' : '❌'} ${opponent} ${isVisible ? 'is displayed' : 'not displayed'}`);
  }
  
  // Assertions
  expect(games2025.length).toBe(expected2025Games.length);
  expect(games2025.length).toBe(12); // Should have all 12 games for 2025
  
  // Verify critical games exist
  const hasOhioState = games2025.some((g: any) => g.opponent === 'Ohio State');
  const hasTexasAM = games2025.some((g: any) => g.opponent === 'Texas A&M');
  const hasOklahoma = games2025.some((g: any) => g.opponent === 'Oklahoma');
  
  // Verify Ohio State is the FIRST game of 2025
  const firstGame2025 = games2025.sort((a: any, b: any) => a.date.localeCompare(b.date))[0];
  console.log(`\n🏈 First game of 2025: ${firstGame2025?.date} - ${firstGame2025?.opponent} at ${firstGame2025?.location}`);
  
  expect(hasOhioState).toBe(true);
  expect(hasTexasAM).toBe(true);
  expect(hasOklahoma).toBe(true);
  expect(firstGame2025?.opponent).toBe('Ohio State');
  expect(firstGame2025?.date).toBe('2025-08-30');
  expect(firstGame2025?.isHome).toBe(false);
  
  console.log('\n✅ Test complete!');
});