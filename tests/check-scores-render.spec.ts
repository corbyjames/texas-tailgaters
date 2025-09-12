import { test } from '@playwright/test';

test('Check what is actually rendering on games page', async ({ page }) => {
  // Navigate to games page
  await page.goto('http://localhost:5173/games');
  await page.waitForTimeout(3000); // Wait for React to render
  
  // Check if login is required
  const needsLogin = await page.locator('text="Sign in"').isVisible();
  console.log('Needs login:', needsLogin);
  
  // Get all text content from the page
  const pageText = await page.textContent('body');
  console.log('Page contains scores?', pageText?.includes('-') ? 'Maybe' : 'No');
  
  // Look for game cards
  const cards = await page.locator('.card, [class*="rounded"]').all();
  console.log(`Found ${cards.length} card elements`);
  
  // Check each card
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const cardText = await cards[i].textContent();
    console.log(`\nCard ${i + 1} text:`, cardText?.substring(0, 200));
    
    // Check if card has score-like pattern
    if (cardText?.match(/\d+\s*-\s*\d+/)) {
      console.log('  ✅ Contains score pattern');
    } else {
      console.log('  ❌ No score pattern found');
    }
    
    // Get the card's HTML
    const cardHtml = await cards[i].innerHTML();
    
    // Check for score-related classes or elements
    if (cardHtml.includes('homeScore') || cardHtml.includes('awayScore')) {
      console.log('  Has score properties in HTML');
    }
    
    // Check for status
    if (cardHtml.includes('completed') || cardHtml.includes('in-progress')) {
      console.log('  Has completed/in-progress status');
    }
  }
  
  // Execute JavaScript in the page context to check React props
  const gameData = await page.evaluate(() => {
    // Try to find React fiber nodes
    const cards = document.querySelectorAll('.card, [class*="card"]');
    const games = [];
    
    cards.forEach((card: any) => {
      // Try to find React props
      const reactKey = Object.keys(card).find(key => key.startsWith('__react'));
      if (reactKey) {
        const fiber = card[reactKey];
        if (fiber && fiber.memoizedProps && fiber.memoizedProps.game) {
          const game = fiber.memoizedProps.game;
          games.push({
            opponent: game.opponent,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            result: game.result
          });
        }
      }
    });
    
    return games;
  });
  
  console.log('\nGame data from React props:', gameData);
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshots/actual-games-page.png', fullPage: true });
  console.log('\nScreenshot saved: screenshots/actual-games-page.png');
});