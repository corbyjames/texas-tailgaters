import { test, expect } from '@playwright/test';

test('Test Sync Schedule Button', async ({ page }) => {
  console.log('Testing sync button directly...\n');
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@texastailgaters.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2000);
  
  // Go to games page
  await page.goto('http://localhost:5173/games');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot to see what's on the page
  await page.screenshot({ path: 'games-page.png' });
  console.log('Screenshot saved as games-page.png');
  
  // Log all visible buttons
  const buttons = await page.locator('button:visible').allTextContents();
  console.log('Visible buttons on page:', buttons);
  
  // Try multiple selectors for sync button
  const syncSelectors = [
    'button:has-text("Sync Schedule")',
    'button:has-text("Sync")',
    'button:has-text("🔄")',
    'text=🔄 Sync Schedule',
    '.btn-secondary:has-text("Sync")'
  ];
  
  let syncButton = null;
  for (const selector of syncSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      syncButton = button;
      console.log(`✅ Found sync button with selector: ${selector}`);
      break;
    }
  }
  
  if (syncButton) {
    // Click the sync button
    await syncButton.click();
    console.log('Clicked sync button, waiting for response...');
    
    // Wait for alert or success message
    page.on('dialog', async dialog => {
      console.log('Alert message:', dialog.message());
      await dialog.accept();
    });
    
    await page.waitForTimeout(5000);
    
    // Check if games were added
    const gameCards = await page.locator('.bg-white').filter({ has: page.locator('h3') }).count();
    console.log(`Games after sync: ${gameCards}`);
    
    if (gameCards > 0) {
      // Get first game details
      const firstGame = page.locator('.bg-white').filter({ has: page.locator('h3') }).first();
      const opponent = await firstGame.locator('h3').textContent();
      console.log(`First game opponent: ${opponent}`);
      
      // Check for specific teams
      const pageContent = await page.locator('body').textContent();
      if (pageContent?.includes('Oklahoma')) console.log('✅ Oklahoma game found');
      if (pageContent?.includes('Texas A&M')) console.log('✅ Texas A&M game found');
      if (pageContent?.includes('Ohio State')) console.log('✅ Ohio State game found');
    }
  } else {
    console.log('❌ Sync button not found');
    
    // Log page content for debugging
    const pageTitle = await page.locator('h1').textContent();
    console.log('Page title:', pageTitle);
    
    const errorMessage = await page.locator('.text-red-500, .error').textContent().catch(() => null);
    if (errorMessage) {
      console.log('Error on page:', errorMessage);
    }
  }
});