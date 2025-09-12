import { test } from '@playwright/test';

test.describe('Capture Score Display Screenshots', () => {
  test('Capture desktop score displays', async ({ page }) => {
    // Navigate to games page
    await page.goto('http://localhost:5174/games');
    await page.waitForLoadState('networkidle');
    
    // Wait for game cards to load
    await page.waitForSelector('.card, [data-testid="game-card"]', { timeout: 10000 });
    
    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/score-display-full-page.png',
      fullPage: true
    });
    console.log('✅ Full page screenshot saved: screenshots/score-display-full-page.png');
    
    // Find and screenshot individual game cards with scores
    const completedGames = page.locator('.card').filter({ hasText: /Final|W|L|T/ });
    const completedCount = await completedGames.count();
    
    if (completedCount > 0) {
      // Screenshot first completed game
      await completedGames.first().screenshot({
        path: 'screenshots/completed-game-score.png'
      });
      console.log('✅ Completed game screenshot saved: screenshots/completed-game-score.png');
    }
    
    // Look for live games
    const liveGames = page.locator('.card').filter({ hasText: 'LIVE' });
    const liveCount = await liveGames.count();
    
    if (liveCount > 0) {
      await liveGames.first().screenshot({
        path: 'screenshots/live-game-score.png'
      });
      console.log('✅ Live game screenshot saved: screenshots/live-game-score.png');
    }
    
    // Screenshot the games section
    const gamesSection = page.locator('main, .container').first();
    await gamesSection.screenshot({
      path: 'screenshots/games-section.png'
    });
    console.log('✅ Games section screenshot saved: screenshots/games-section.png');
  });

  test('Capture mobile score displays', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    await page.goto('http://localhost:5174/games');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.rounded-lg, .card', { timeout: 10000 });
    
    // Mobile full page screenshot
    await page.screenshot({
      path: 'screenshots/mobile-score-display-full.png',
      fullPage: true
    });
    console.log('✅ Mobile full page screenshot saved: screenshots/mobile-score-display-full.png');
    
    // Screenshot first few mobile cards
    const mobileCards = page.locator('.rounded-lg, .card').locator('visible=true');
    const cardCount = await mobileCards.count();
    
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      await mobileCards.nth(i).screenshot({
        path: `screenshots/mobile-game-card-${i + 1}.png`
      });
      console.log(`✅ Mobile card ${i + 1} screenshot saved: screenshots/mobile-game-card-${i + 1}.png`);
    }
  });

  test('Capture score details with annotations', async ({ page }) => {
    await page.goto('http://localhost:5174/games');
    await page.waitForLoadState('networkidle');
    
    // Wait for content
    await page.waitForSelector('.card, [data-testid="game-card"]', { timeout: 10000 });
    
    // Highlight score elements before screenshot
    await page.evaluate(() => {
      // Highlight all score displays
      const scoreElements = document.querySelectorAll('[class*="text-2xl"], [class*="font-bold"]');
      scoreElements.forEach(el => {
        if (el.textContent?.match(/\d+\s*-\s*\d+/)) {
          (el as HTMLElement).style.border = '3px solid red';
          (el as HTMLElement).style.padding = '2px';
        }
      });
      
      // Highlight W/L/T indicators
      const resultElements = document.querySelectorAll('[class*="text-green"], [class*="text-red"]');
      resultElements.forEach(el => {
        if (el.textContent?.match(/W|L|T/)) {
          (el as HTMLElement).style.backgroundColor = 'yellow';
        }
      });
      
      // Highlight LIVE badges
      const liveElements = Array.from(document.querySelectorAll('*')).filter(
        el => el.textContent === 'LIVE'
      );
      liveElements.forEach(el => {
        (el as HTMLElement).style.outline = '3px solid orange';
      });
    });
    
    // Take annotated screenshot
    await page.screenshot({
      path: 'screenshots/score-display-annotated.png',
      fullPage: false
    });
    console.log('✅ Annotated screenshot saved: screenshots/score-display-annotated.png');
  });

  test('Capture different game states', async ({ page }) => {
    await page.goto('http://localhost:5174/games');
    await page.waitForLoadState('networkidle');
    
    // Create a composite screenshot showing different states
    const viewport = page.viewportSize();
    if (viewport) {
      // Take viewport screenshot
      await page.screenshot({
        path: 'screenshots/score-display-viewport.png',
        clip: {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height
        }
      });
      console.log('✅ Viewport screenshot saved: screenshots/score-display-viewport.png');
    }
    
    // Scroll and capture more content
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'screenshots/score-display-scrolled.png',
      fullPage: false
    });
    console.log('✅ Scrolled view screenshot saved: screenshots/score-display-scrolled.png');
  });
});