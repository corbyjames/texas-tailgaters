import { test } from '@playwright/test';

test('Capture console logs from games page', async ({ page }) => {
  // Collect all console messages
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    
    // Print important logs immediately
    if (text.includes('useGames:') || text.includes('GameCard rendering')) {
      console.log(text);
    }
  });

  // Navigate to login page
  await page.goto('http://localhost:5173/login');
  
  // Try to login with test credentials
  // You may need to update these credentials
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation or error
  await page.waitForTimeout(3000);
  
  // Check if we're still on login page
  const currentUrl = page.url();
  console.log('Current URL after login attempt:', currentUrl);
  
  if (currentUrl.includes('/login')) {
    console.log('Login failed or not configured. Trying to navigate directly...');
    
    // Try to navigate directly to games
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(2000);
  }
  
  // Check if we made it to games page
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  // Wait for React to render
  await page.waitForTimeout(3000);
  
  // Get page content
  const pageContent = await page.textContent('body');
  console.log('Page contains "Sign In":', pageContent?.includes('Sign In') ? 'YES - Still on login' : 'NO - On games page');
  
  // Execute JavaScript to check for game data
  const gameData = await page.evaluate(() => {
    // Try to get React component data
    const elements = document.querySelectorAll('[class*="card"]');
    const results: any[] = [];
    
    elements.forEach((el: any) => {
      // Try to find React fiber
      const reactKeys = Object.keys(el).filter(key => key.startsWith('__react'));
      if (reactKeys.length > 0) {
        const fiber = el[reactKeys[0]];
        if (fiber?.memoizedProps?.game) {
          results.push({
            opponent: fiber.memoizedProps.game.opponent,
            status: fiber.memoizedProps.game.status,
            homeScore: fiber.memoizedProps.game.homeScore,
            awayScore: fiber.memoizedProps.game.awayScore
          });
        }
      }
    });
    
    // Also check localStorage for any auth tokens
    const authData = {
      hasToken: !!localStorage.getItem('authToken'),
      hasUser: !!localStorage.getItem('user'),
      keys: Object.keys(localStorage)
    };
    
    return { games: results, auth: authData };
  });
  
  console.log('\n=== GAME DATA FROM PAGE ===');
  console.log(JSON.stringify(gameData, null, 2));
  
  console.log('\n=== ALL CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Take screenshot
  await page.screenshot({ path: 'screenshots/games-page-debug.png', fullPage: true });
  console.log('\nScreenshot saved: screenshots/games-page-debug.png');
});