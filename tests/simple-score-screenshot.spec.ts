import { test } from '@playwright/test';

test('Capture score display screenshots', async ({ page }) => {
  console.log('📸 Starting screenshot capture...');
  
  // Navigate to games page
  await page.goto('http://localhost:5174/games');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait a bit for content to render
  await page.waitForTimeout(2000);
  
  // Full page screenshot
  await page.screenshot({
    path: 'screenshots/score-display-full.png',
    fullPage: true
  });
  console.log('✅ Full page: screenshots/score-display-full.png');
  
  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: 'screenshots/score-display-desktop.png'
  });
  console.log('✅ Desktop view: screenshots/score-display-desktop.png');
  
  // Tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({
    path: 'screenshots/score-display-tablet.png'
  });
  console.log('✅ Tablet view: screenshots/score-display-tablet.png');
  
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({
    path: 'screenshots/score-display-mobile.png'
  });
  console.log('✅ Mobile view: screenshots/score-display-mobile.png');
  
  // Look for specific score elements
  const hasScores = await page.locator('text=/\\d+\\s*-\\s*\\d+/').count();
  console.log(`📊 Found ${hasScores} score displays on the page`);
  
  // Highlight scores for visibility
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    elements.forEach(el => {
      if (el.textContent?.match(/\d+\s*-\s*\d+/) && !el.children.length) {
        (el as HTMLElement).style.backgroundColor = '#ffeb3b';
        (el as HTMLElement).style.padding = '4px';
        (el as HTMLElement).style.borderRadius = '4px';
      }
    });
  });
  
  await page.screenshot({
    path: 'screenshots/score-display-highlighted.png'
  });
  console.log('✅ Highlighted scores: screenshots/score-display-highlighted.png');
});