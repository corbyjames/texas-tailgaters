import { chromium } from 'playwright';

async function testMobilePotluck() {
  console.log('🔍 Testing Mobile Potluck Navigation Issue\n');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  try {
    // Test on local dev server
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Login if needed
    const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
    if (needsLogin) {
      console.log('2. Logging in...');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/\/(home|games)?$/, { timeout: 10000 });
      console.log('   ✓ Login successful');
    }
    
    // Test 1: Bottom Nav Potluck Button
    console.log('\n3. Testing Bottom Nav Potluck Button...');
    
    // Look for bottom nav
    const bottomNav = page.locator('nav').filter({ hasText: 'Potluck' });
    const potluckNavButton = bottomNav.locator('a[href="/potluck"], a:has-text("Potluck")').first();
    
    if (await potluckNavButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   ✓ Found potluck button in bottom nav');
      
      // Take screenshot before click
      await page.screenshot({ 
        path: 'screenshots/mobile-before-potluck.png',
        fullPage: false 
      });
      
      // Click potluck button
      await potluckNavButton.click();
      console.log('   ✓ Clicked potluck button');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check URL
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      // Take screenshot after navigation
      await page.screenshot({ 
        path: 'screenshots/mobile-after-potluck.png',
        fullPage: false 
      });
      
      // Check page content
      const pageContent = await page.content();
      const hasContent = pageContent.length > 500;
      console.log(`   Page content length: ${pageContent.length} characters`);
      
      // Check for specific elements
      const hasHeader = await page.locator('h1, h2, h3').first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasGameSelector = await page.locator('select, [role="combobox"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasCategories = await page.locator('text=/Main|Side|Appetizer/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   Has header: ${hasHeader}`);
      console.log(`   Has game selector: ${hasGameSelector}`);
      console.log(`   Has categories: ${hasCategories}`);
      
      // Check for loading state
      const hasLoading = await page.locator('.animate-spin, text=/loading/i').isVisible({ timeout: 1000 }).catch(() => false);
      if (hasLoading) {
        console.log('   ⚠️  Page is stuck in loading state');
      }
      
      // Check viewport
      const viewport = page.viewportSize();
      console.log(`   Viewport: ${viewport.width}x${viewport.height}`);
      
      // Check if MobilePotluckPage is rendering
      const bodyClasses = await page.locator('body').getAttribute('class');
      console.log(`   Body classes: ${bodyClasses || 'none'}`);
      
    } else {
      console.log('   ❌ Potluck button not found in bottom nav');
    }
    
    // Test 2: Game Card Potluck Button
    console.log('\n4. Testing Game Card Potluck Buttons...');
    
    // Navigate to games page
    await page.goto('http://localhost:5174/games', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Look for game cards
    const gameCards = await page.locator('.card').count();
    console.log(`   Found ${gameCards} game cards`);
    
    if (gameCards > 0) {
      // Check first game card for potluck-related buttons
      const firstCard = page.locator('.card').first();
      const cardText = await firstCard.textContent();
      console.log(`   First card: ${cardText.substring(0, 100)}...`);
      
      // Look for potluck button on card
      const potluckButton = firstCard.locator('button, a').filter({ hasText: /potluck|items|food/i }).first();
      if (await potluckButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   ✓ Found potluck button on game card');
        
        await potluckButton.click();
        await page.waitForTimeout(2000);
        
        const afterClickUrl = page.url();
        console.log(`   After click URL: ${afterClickUrl}`);
        
        await page.screenshot({ 
          path: 'screenshots/mobile-game-potluck.png',
          fullPage: false 
        });
      } else {
        console.log('   ℹ️  No potluck button on game cards');
      }
    }
    
    // Test 3: Direct URL Navigation
    console.log('\n5. Testing Direct URL Navigation...');
    await page.goto('http://localhost:5174/potluck', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const directUrl = page.url();
    console.log(`   Direct navigation URL: ${directUrl}`);
    
    // Check if page has content
    const mainContent = await page.locator('main, #root, [role="main"]').first();
    const contentBox = await mainContent.boundingBox().catch(() => null);
    
    if (contentBox) {
      console.log(`   Content dimensions: ${contentBox.width}x${contentBox.height}`);
      if (contentBox.height < 100) {
        console.log('   ⚠️  Content area is very small - possible blank screen');
      }
    }
    
    // Check for React errors
    const reactError = await page.locator('text=/error|Error:|React/i').isVisible({ timeout: 1000 }).catch(() => false);
    if (reactError) {
      console.log('   ❌ React error detected on page');
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-potluck-direct.png',
      fullPage: true 
    });
    
    console.log('\n=== DIAGNOSTICS SUMMARY ===');
    console.log('Screenshots saved to screenshots/ directory');
    console.log('Check the screenshots to see what\'s rendering');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testMobilePotluck().catch(console.error);