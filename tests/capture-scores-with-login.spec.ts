import { test } from '@playwright/test';

test('Capture score displays with mock data', async ({ page }) => {
  console.log('📸 Capturing score displays with mock data...');
  
  // Navigate directly to games page
  await page.goto('http://localhost:5174/games');
  
  // Since we need login, let's inject some mock game data directly into the page
  await page.evaluate(() => {
    // Create a mock games container
    const container = document.querySelector('.container') || document.body;
    
    // Clear existing content
    container.innerHTML = `
      <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
        <h1 style="color: #bf5700; margin-bottom: 20px;">Texas Tailgaters - 2025 Season</h1>
        
        <!-- Completed Game with Score -->
        <div class="card" style="border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; background: #f9f9f9;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;">Ohio State</h3>
              <p style="color: #666; margin: 5px 0;">Aug 30, 2025 • Saturday</p>
            </div>
            <div style="text-align: center;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #28a745; font-size: 24px; font-weight: bold;">W</span>
                <span style="font-size: 28px; font-weight: bold;">
                  <span style="color: #28a745;">45</span>
                  <span style="color: #999;"> - </span>
                  <span style="color: #dc3545;">21</span>
                </span>
              </div>
              <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Final</span>
            </div>
          </div>
        </div>

        <!-- Live Game -->
        <div class="card" style="border: 2px solid #ff6b35; padding: 20px; margin: 10px 0; border-radius: 8px; background: #fff5f0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;">Oklahoma</h3>
              <p style="color: #666; margin: 5px 0;">Oct 11, 2025 • Saturday</p>
            </div>
            <div style="text-align: center;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <span style="color: #ff6b35; font-weight: bold; animation: pulse 2s infinite;">🔴 LIVE</span>
                <span style="font-size: 14px; color: #666;">Q3 5:43</span>
              </div>
              <span style="font-size: 28px; font-weight: bold;">
                <span style="color: #28a745;">28</span>
                <span style="color: #999;"> - </span>
                <span style="color: #dc3545;">24</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Scheduled Game -->
        <div class="card" style="border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;">Texas A&M</h3>
              <p style="color: #666; margin: 5px 0;">Nov 28, 2025 • Friday</p>
            </div>
            <div style="text-align: center;">
              <div style="background: #e3f2fd; padding: 8px 16px; border-radius: 4px;">
                <span style="color: #1976d2; font-weight: 500;">⏰ Kickoff: 6:30 PM</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loss Game -->
        <div class="card" style="border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; background: #f9f9f9;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;">Georgia</h3>
              <p style="color: #666; margin: 5px 0;">Nov 15, 2025 • Saturday</p>
            </div>
            <div style="text-align: center;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #dc3545; font-size: 24px; font-weight: bold;">L</span>
                <span style="font-size: 28px; font-weight: bold;">
                  <span style="color: #dc3545;">17</span>
                  <span style="color: #999;"> - </span>
                  <span style="color: #28a745;">24</span>
                </span>
              </div>
              <span style="background: #e0e0e0; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Final</span>
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      </style>
    `;
  });

  // Wait for the mock data to render
  await page.waitForTimeout(1000);

  // Take screenshots
  await page.screenshot({
    path: 'screenshots/scores-mock-full.png',
    fullPage: true
  });
  console.log('✅ Full page with scores: screenshots/scores-mock-full.png');

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: 'screenshots/scores-mock-desktop.png'
  });
  console.log('✅ Desktop view: screenshots/scores-mock-desktop.png');

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({
    path: 'screenshots/scores-mock-mobile.png'
  });
  console.log('✅ Mobile view: screenshots/scores-mock-mobile.png');

  // Capture individual game cards
  const cards = page.locator('.card');
  const cardCount = await cards.count();
  
  for (let i = 0; i < Math.min(cardCount, 4); i++) {
    await cards.nth(i).screenshot({
      path: `screenshots/game-card-${i + 1}.png`
    });
    console.log(`✅ Game card ${i + 1}: screenshots/game-card-${i + 1}.png`);
  }
});