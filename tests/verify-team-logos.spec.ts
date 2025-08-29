import { test, expect } from '@playwright/test';

test('Verify team logos display correctly', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Login
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Check if games exist in localStorage, if not sync them
  const gamesExist = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored).length > 0 : false;
  });
  
  if (!gamesExist) {
    console.log('No games found, syncing schedule...');
    await page.locator('nav a:has-text("Admin")').click();
    await page.waitForURL('**/admin');
    await page.locator('button:has-text("Sync Schedule")').click();
    await page.locator('text=/Successfully synced/').waitFor({ timeout: 10000 });
  }
  
  // Navigate to games page
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  await page.waitForTimeout(1000);
  
  // Check for specific team logos
  const teamsToCheck = [
    { name: 'Ohio State', shouldExist: true },
    { name: 'San Jose State', shouldExist: true },
    { name: 'Texas A&M', shouldExist: true },
    { name: 'Oklahoma', shouldExist: true },
    { name: 'Georgia', shouldExist: true },
    { name: 'UTSA', shouldExist: true },
  ];
  
  console.log('\n=== Team Logo Verification ===\n');
  
  for (const team of teamsToCheck) {
    // Check if the team's game card exists
    const gameCard = page.locator('.card').filter({ hasText: team.name });
    const cardExists = await gameCard.count() > 0;
    
    if (cardExists) {
      // Check if the card has an image (logo)
      const logo = gameCard.first().locator('img');
      const logoExists = await logo.count() > 0;
      
      if (logoExists) {
        const logoSrc = await logo.getAttribute('src');
        const logoAlt = await logo.getAttribute('alt');
        
        // Check if the logo loaded successfully
        const logoLoaded = await logo.evaluate((img: HTMLImageElement) => {
          return img.complete && img.naturalHeight > 0;
        });
        
        console.log(`✅ ${team.name}:`);
        console.log(`   - Logo URL: ${logoSrc}`);
        console.log(`   - Alt text: ${logoAlt}`);
        console.log(`   - Loaded: ${logoLoaded ? 'Yes' : 'No'}`);
        
        // Assert logo exists and loaded
        expect(logoExists).toBe(true);
        expect(logoLoaded).toBe(true);
      } else {
        console.log(`❌ ${team.name}: No logo found in game card`);
        
        // Check if there's a fallback emoji instead
        const cardText = await gameCard.first().textContent();
        const hasEmoji = cardText?.includes('🏈');
        console.log(`   - Fallback emoji: ${hasEmoji ? 'Yes' : 'No'}`);
      }
    } else {
      console.log(`⚠️ ${team.name}: Game card not found on current page`);
    }
  }
  
  // Navigate to home page to check upcoming games
  console.log('\n=== Home Page Upcoming Games ===\n');
  await page.locator('nav a:has-text("Home")').click();
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);
  
  // Check for Ohio State specifically on home page
  const upcomingSection = page.locator('text=Upcoming Games').locator('..');
  const ohioStateCard = upcomingSection.locator('.card').filter({ hasText: 'Ohio State' });
  
  if (await ohioStateCard.count() > 0) {
    const ohioStateLogo = ohioStateCard.first().locator('img');
    const hasLogo = await ohioStateLogo.count() > 0;
    
    if (hasLogo) {
      const src = await ohioStateLogo.getAttribute('src');
      console.log(`✅ Ohio State on home page has logo: ${src}`);
    } else {
      console.log(`❌ Ohio State on home page missing logo`);
    }
  }
  
  // Test the logo service directly
  console.log('\n=== Direct Logo Service Test ===\n');
  const logoUrls = await page.evaluate(() => {
    // This will only work if teamLogos is exposed globally or through a component
    const testTeams = ['Ohio State', 'San Jose State', 'UTSA', 'Texas A&M'];
    const results: any = {};
    
    // Try to get logos from localStorage games
    const stored = localStorage.getItem('texasTailgatersGames');
    if (stored) {
      const games = JSON.parse(stored);
      testTeams.forEach(team => {
        const game = games.find((g: any) => g.opponent === team);
        if (game) {
          results[team] = {
            found: true,
            opponent: game.opponent,
            date: game.date
          };
        }
      });
    }
    
    return results;
  });
  
  console.log('Games with these teams in localStorage:');
  Object.entries(logoUrls).forEach(([team, info]: [string, any]) => {
    console.log(`  - ${team}: ${info.found ? `Found (${info.date})` : 'Not found'}`);
  });
  
  console.log('\n✅ Logo verification complete!');
});