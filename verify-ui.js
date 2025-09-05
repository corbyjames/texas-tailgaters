import { chromium } from 'playwright';

async function verifyNoTailgateUI() {
  console.log('🔍 Starting UI verification for no-tailgate feature...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Login as admin
    console.log('2. Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@texastailgaters.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await page.waitForURL('**/games', { timeout: 10000 });
    console.log('✅ Successfully logged in as admin\n');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Check for game cards
    console.log('3. Looking for game cards...');
    const gameCards = page.locator('.card').filter({ hasText: /vs|@/ });
    const cardCount = await gameCards.count();
    console.log(`✅ Found ${cardCount} game cards\n`);
    
    if (cardCount === 0) {
      console.log('❌ No game cards found!');
      await page.screenshot({ path: 'no-games.png' });
      return;
    }
    
    // Check for no-tailgate toggle button
    console.log('4. Checking for no-tailgate toggle buttons...');
    
    // Try different selectors
    const selectors = [
      'button[title="Mark as No Tailgate"]',
      'button:has(svg.lucide-calendar-off)',
      '.card button:has(svg)',
      'button.text-red-600'
    ];
    
    let foundButton = false;
    for (const selector of selectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`✅ Found ${count} buttons with selector: ${selector}`);
        foundButton = true;
        
        // Click the first one
        console.log('\n5. Testing toggle functionality...');
        await buttons.first().click();
        await page.waitForTimeout(2000);
        
        // Check for no-tailgate badge
        const badge = page.locator('text="No Tailgate Hosted"').first();
        if (await badge.isVisible()) {
          console.log('✅ "No Tailgate Hosted" badge is visible!');
          
          // Check for Enable button
          const enableBtn = page.locator('button:has-text("Enable Tailgate")').first();
          if (await enableBtn.isVisible()) {
            console.log('✅ "Enable Tailgate" button is visible!');
            
            // Re-enable
            await enableBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Tailgate re-enabled successfully!\n');
          }
        }
        break;
      }
    }
    
    if (!foundButton) {
      console.log('\n❌ No-tailgate toggle buttons NOT FOUND!');
      console.log('\nDebugging info:');
      
      // Get all buttons in the first game card
      const firstCard = gameCards.first();
      const allButtons = await firstCard.locator('button').all();
      console.log(`Found ${allButtons.length} buttons in first game card:\n`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        const text = await btn.textContent();
        const title = await btn.getAttribute('title');
        const classes = await btn.getAttribute('class');
        console.log(`  Button ${i + 1}:`);
        console.log(`    Text: "${text}"`);
        console.log(`    Title: "${title}"`);
        console.log(`    Classes: "${classes}"\n`);
      }
      
      // Check for SVG icons
      const svgs = await firstCard.locator('svg').all();
      console.log(`Found ${svgs.length} SVG icons in first card\n`);
      
      // Take screenshot
      await page.screenshot({ path: 'ui-debug.png', fullPage: true });
      console.log('📸 Debug screenshot saved as ui-debug.png');
    }
    
    console.log('\n🎉 Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    await page.screenshot({ path: 'error.png', fullPage: true });
    console.log('📸 Error screenshot saved as error.png');
  } finally {
    console.log('\n👀 Keeping browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Run the verification
verifyNoTailgateUI().catch(console.error);