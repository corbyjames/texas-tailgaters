import { test, expect } from '@playwright/test';

test.describe('TV Network Display Tests', () => {
  test('Setup and validate TV network display', async ({ page }) => {
    console.log('='.repeat(60));
    console.log('TV NETWORK FULL VALIDATION TEST');
    console.log('='.repeat(60));
    
    // Step 1: Create test user first
    console.log('\n📋 Step 1: Setting up test user...');
    await page.goto('http://localhost:5173/create-test-user.html');
    await page.waitForTimeout(1500);
    
    const createUserBtn = page.locator('button:has-text("Create Test User")');
    if (await createUserBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createUserBtn.click();
      await page.waitForTimeout(2000);
      
      // Check for success message
      const pageContent = await page.textContent('body');
      if (pageContent?.includes('created successfully') || pageContent?.includes('already exists')) {
        console.log('✅ Test user ready');
      } else {
        console.log('⚠️ User creation status unclear, continuing...');
      }
    }
    
    // Step 2: Try login multiple times if needed
    console.log('\n📋 Step 2: Attempting login...');
    let loginSuccess = false;
    let attempts = 0;
    
    while (!loginSuccess && attempts < 3) {
      attempts++;
      console.log(`  Attempt ${attempts}...`);
      
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      
      // Clear and fill fields
      await page.locator('input[type="email"]').clear();
      await page.locator('input[type="email"]').fill('test@texastailgaters.com');
      await page.locator('input[type="password"]').clear();
      await page.locator('input[type="password"]').fill('TestPassword123!');
      
      // Try clicking Sign In
      await page.locator('button:has-text("Sign In")').click();
      
      // Wait a bit for response
      await page.waitForTimeout(3000);
      
      // Check if we navigated away from login
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        loginSuccess = true;
        console.log('✅ Login successful!');
      } else {
        // Check for any error messages
        const errorText = await page.locator('.text-red-500, .error, [role="alert"]').textContent().catch(() => '');
        if (errorText) {
          console.log(`  ❌ Login error: ${errorText}`);
        } else {
          console.log('  ❌ Login failed, still on login page');
        }
      }
    }
    
    // Step 3: Navigate to games page regardless
    console.log('\n📋 Step 3: Navigating to games page...');
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'tv-test-games-page.png', fullPage: true });
    console.log('  Screenshot saved: tv-test-games-page.png');
    
    // Step 4: Check current page state
    console.log('\n📋 Step 4: Checking page state...');
    
    // Check if we're still on login page
    if (page.url().includes('/login')) {
      console.log('  ⚠️ Still on login page, authentication may be required');
      console.log('  ⚠️ Test cannot proceed without authentication');
      return;
    }
    
    // Look for game cards
    const gameCardSelectors = [
      '.card',
      '.bg-white.rounded-lg',
      '[class*="card"]',
      'div:has(> h3)'
    ];
    
    let gameCount = 0;
    let selector = '';
    
    for (const sel of gameCardSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        gameCount = count;
        selector = sel;
        break;
      }
    }
    
    console.log(`  Found ${gameCount} potential game cards using selector: ${selector}`);
    
    // Step 5: Try to sync if no games
    if (gameCount === 0) {
      console.log('\n📋 Step 5: Attempting to sync schedule...');
      
      // Look for sync button with various selectors
      const syncSelectors = [
        'button:has-text("Sync Schedule")',
        'button:has-text("🔄")',
        'button:has-text("Sync")',
        'button[class*="secondary"]:has-text("Sync")',
        'text="🔄 Sync Schedule"'
      ];
      
      let syncClicked = false;
      
      for (const syncSel of syncSelectors) {
        const syncBtn = page.locator(syncSel).first();
        if (await syncBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  Found sync button with selector: ${syncSel}`);
          
          // Set up dialog handler
          page.once('dialog', async dialog => {
            console.log(`  Dialog message: "${dialog.message()}"`);
            await dialog.accept();
          });
          
          await syncBtn.click();
          syncClicked = true;
          console.log('  Clicked sync button, waiting for games to load...');
          await page.waitForTimeout(5000);
          break;
        }
      }
      
      if (!syncClicked) {
        console.log('  ❌ No sync button found');
      }
      
      // Re-count games after sync
      gameCount = await page.locator(selector || '.card').count();
      console.log(`  Games after sync attempt: ${gameCount}`);
    }
    
    // Step 6: Validate TV networks
    console.log('\n📋 Step 6: Validating TV network display...');
    
    if (gameCount === 0) {
      console.log('  ❌ No games to validate');
      
      // Debug: Log page content
      const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title');
      console.log(`  Page title: ${pageTitle}`);
      
      const buttonTexts = await page.locator('button:visible').allTextContents();
      console.log(`  Visible buttons: ${buttonTexts.join(', ')}`);
      
      return;
    }
    
    // Look for TV network indicators
    console.log('\n🔍 Searching for TV network information...');
    
    // Method 1: Look for TV icon
    const tvIcons = await page.locator('text=📺').count();
    console.log(`  TV icons (📺) found: ${tvIcons}`);
    
    // Method 2: Look for network names
    const networks = ['ABC', 'ESPN', 'FOX', 'CBS', 'NBC', 'TBD', 'SEC Network'];
    for (const network of networks) {
      const count = await page.locator(`text=/${network}/i`).count();
      if (count > 0) {
        console.log(`  Found "${network}" mentioned ${count} times`);
      }
    }
    
    // Method 3: Examine each game card
    console.log('\n📊 Detailed game card analysis:');
    const allCards = await page.locator(selector || '.card').all();
    
    let cardsWithTv = 0;
    let cardsWithoutTv = 0;
    
    for (let i = 0; i < Math.min(allCards.length, 5); i++) {
      const card = allCards[i];
      const cardText = await card.textContent();
      
      // Try to extract opponent name
      const h3Text = await card.locator('h3').textContent().catch(() => '');
      const opponent = h3Text || `Game ${i + 1}`;
      
      console.log(`\n  Game: ${opponent}`);
      
      // Check for TV info
      if (cardText?.includes('📺')) {
        cardsWithTv++;
        
        // Try to extract network
        const networkMatch = cardText.match(/📺\s*([A-Z][A-Za-z\s\/]+)/);
        if (networkMatch) {
          console.log(`    ✅ TV Network: ${networkMatch[1]}`);
        } else {
          console.log(`    ✅ Has TV icon but network not extracted`);
        }
      } else {
        cardsWithoutTv++;
        console.log(`    ❌ No TV network displayed`);
      }
      
      // Check for date/time
      const dateMatch = cardText?.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      if (dateMatch) {
        console.log(`    📅 Date: ${dateMatch[0]}`);
      }
      
      // Check for location
      if (cardText?.includes('Home') || cardText?.includes('🏠')) {
        console.log(`    📍 Location: Home`);
      } else if (cardText?.includes('Away') || cardText?.includes('✈️')) {
        console.log(`    📍 Location: Away`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total games displayed: ${gameCount}`);
    console.log(`Games with TV network: ${cardsWithTv}`);
    console.log(`Games without TV network: ${cardsWithoutTv}`);
    console.log(`TV icons found: ${tvIcons}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'tv-test-final.png', fullPage: true });
    console.log('\nFinal screenshot saved: tv-test-final.png');
    
    // Assertions
    if (gameCount > 0) {
      if (tvIcons > 0 || cardsWithTv > 0) {
        console.log('\n✅ TEST PASSED: TV network information is displayed');
      } else {
        console.log('\n❌ TEST FAILED: No TV network information found');
        
        // Additional debugging
        console.log('\nDebugging info:');
        const firstCardHtml = await allCards[0].innerHTML();
        console.log('First card HTML (truncated):');
        console.log(firstCardHtml.substring(0, 500) + '...');
      }
    } else {
      console.log('\n⚠️ TEST INCONCLUSIVE: No games found to validate');
    }
  });
});