import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://texas-tailgaters.onrender.com';
const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

async function runProductionTests() {
  console.log('🧪 Texas Tailgaters Production Regression Test Suite');
  console.log('================================================\n');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Test 1: Login
    console.log('TEST 1: Login Flow');
    console.log('-------------------');
    try {
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('  ✓ Page loaded');
      
      // Check if login page
      const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (needsLogin) {
        await page.fill('input[type="email"]', TEST_ACCOUNT.email);
        await page.fill('input[type="password"]', TEST_ACCOUNT.password);
        console.log('  ✓ Credentials entered');
        
        await page.click('button:has-text("Sign In")');
        await page.waitForURL(/\/(home|games)?$/, { timeout: 15000 });
        console.log('  ✓ Login successful');
        
        results.passed.push('Login');
      } else {
        console.log('  ℹ Already logged in or different page structure');
        results.warnings.push('Login page not found - may already be logged in');
      }
    } catch (error) {
      console.log(`  ✗ Login failed: ${error.message}`);
      results.failed.push(`Login: ${error.message}`);
    }
    
    // Test 2: Schedule View
    console.log('\nTEST 2: Game Schedule');
    console.log('----------------------');
    try {
      // Navigate to games
      if (!page.url().includes('/games')) {
        const scheduleLink = await page.locator('text="View Season Schedule"').isVisible({ timeout: 3000 }).catch(() => false);
        if (scheduleLink) {
          await page.click('text="View Season Schedule"');
        } else {
          await page.goto(`${PRODUCTION_URL}/games`, { waitUntil: 'networkidle' });
        }
      }
      
      await page.waitForSelector('.card', { timeout: 10000 });
      console.log('  ✓ Games page loaded');
      
      // Count games
      const gameCount = await page.locator('.card').count();
      console.log(`  ✓ Found ${gameCount} games`);
      
      // Check critical games
      const criticalGames = ['Ohio State', 'Oklahoma', 'Texas A&M'];
      for (const game of criticalGames) {
        const found = await page.locator('.card', { hasText: game }).isVisible({ timeout: 3000 }).catch(() => false);
        if (found) {
          console.log(`  ✓ ${game} game found`);
          
          // Special check for Ohio State time
          if (game === 'Ohio State') {
            const ohioCard = await page.locator('.card', { hasText: 'Ohio State' }).textContent();
            if (ohioCard.includes('11:00 AM')) {
              console.log('    ✓ Time correct (11:00 AM)');
            } else if (ohioCard.includes('7:30 PM')) {
              console.log('    ✗ WRONG TIME: Shows 7:30 PM instead of 11:00 AM');
              results.failed.push('Ohio State game time incorrect');
            }
          }
        } else {
          console.log(`  ⚠ ${game} game not found`);
          results.warnings.push(`${game} game not visible`);
        }
      }
      
      results.passed.push('Schedule View');
      
      // Screenshot
      await page.screenshot({ 
        path: 'screenshots/prod-schedule.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`  ✗ Schedule test failed: ${error.message}`);
      results.failed.push(`Schedule: ${error.message}`);
    }
    
    // Test 3: Game Detail Page
    console.log('\nTEST 3: Game Detail Page');
    console.log('-------------------------');
    try {
      const firstGame = page.locator('.card').first();
      const gameName = await firstGame.locator('h3, [class*="font-bold"]').first().textContent();
      console.log(`  Opening: ${gameName}`);
      
      await firstGame.locator('text="View Details"').click();
      await page.waitForURL(/\/games\//, { timeout: 10000 });
      console.log('  ✓ Detail page loaded');
      
      // Check for key elements
      const hasDate = await page.locator('text=/Date|Time/i').isVisible({ timeout: 3000 }).catch(() => false);
      const hasLocation = await page.locator('text=/Location/i').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasDate) console.log('  ✓ Date/Time displayed');
      if (hasLocation) console.log('  ✓ Location displayed');
      
      // Check for potluck section
      const hasPotluck = await page.locator('text=/Potluck/i').isVisible({ timeout: 3000 }).catch(() => false);
      if (hasPotluck) {
        console.log('  ✓ Potluck section present');
        
        // Count potluck items
        const itemCount = await page.locator('[class*="item"], [class*="potluck"]').count();
        console.log(`  ✓ ${itemCount} potluck elements found`);
      }
      
      results.passed.push('Game Detail Page');
      
      await page.screenshot({ 
        path: 'screenshots/prod-detail.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`  ✗ Detail page test failed: ${error.message}`);
      results.failed.push(`Detail Page: ${error.message}`);
    }
    
    // Test 4: Potluck Manager
    console.log('\nTEST 4: Potluck Manager');
    console.log('------------------------');
    try {
      // Try to navigate to potluck
      const potluckLink = await page.locator('a[href*="potluck"], text=/Potluck/i').first();
      
      if (await potluckLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await potluckLink.click();
      } else {
        await page.goto(`${PRODUCTION_URL}/potluck`, { waitUntil: 'networkidle' });
      }
      
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/potluck')) {
        console.log('  ✓ Potluck page loaded');
        
        // Check for game selector
        const hasGameSelector = await page.locator('select, [role="combobox"]').isVisible({ timeout: 3000 }).catch(() => false);
        if (hasGameSelector) console.log('  ✓ Game selector present');
        
        // Check for categories
        const categories = ['Main', 'Side', 'Dessert', 'Drink'];
        let foundCategories = 0;
        for (const cat of categories) {
          if (await page.locator(`text=/${cat}/i`).isVisible({ timeout: 1000 }).catch(() => false)) {
            foundCategories++;
          }
        }
        console.log(`  ✓ ${foundCategories}/${categories.length} categories found`);
        
        // Check for add button
        const hasAddButton = await page.locator('button').filter({ hasText: /Add|New/i }).isVisible({ timeout: 3000 }).catch(() => false);
        if (hasAddButton) console.log('  ✓ Add item button present');
        
        results.passed.push('Potluck Manager');
        
        await page.screenshot({ 
          path: 'screenshots/prod-potluck.png',
          fullPage: true 
        });
        
      } else {
        console.log('  ⚠ Could not access potluck page');
        results.warnings.push('Potluck page not accessible');
      }
      
    } catch (error) {
      console.log(`  ✗ Potluck test failed: ${error.message}`);
      results.failed.push(`Potluck: ${error.message}`);
    }
    
    // Test 5: Mobile View
    console.log('\nTEST 5: Mobile Responsiveness');
    console.log('------------------------------');
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${PRODUCTION_URL}/games`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const mobileCardsVisible = await page.locator('.card').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (mobileCardsVisible) {
        console.log('  ✓ Games display on mobile');
        
        // Check if text is readable (not overlapping)
        const firstCard = page.locator('.card').first();
        const boundingBox = await firstCard.boundingBox();
        if (boundingBox && boundingBox.height > 50) {
          console.log('  ✓ Card layout appears correct');
        }
        
        results.passed.push('Mobile View');
      } else {
        console.log('  ✗ Mobile view issues');
        results.failed.push('Mobile view not working');
      }
      
      await page.screenshot({ 
        path: 'screenshots/prod-mobile.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`  ✗ Mobile test failed: ${error.message}`);
      results.failed.push(`Mobile: ${error.message}`);
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`\n✅ PASSED: ${results.passed.length} tests`);
    results.passed.forEach(test => console.log(`   • ${test}`));
    
    if (results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${results.warnings.length}`);
      results.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${results.failed.length} tests`);
      results.failed.forEach(test => console.log(`   • ${test}`));
    }
    
    const allPassed = results.failed.length === 0;
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 ALL CRITICAL TESTS PASSED!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW NEEDED');
    }
    console.log('='.repeat(50));
    
    // Return status
    return allPassed;
    
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    return false;
  } finally {
    console.log('\nTest duration: Keep browser open for 10 seconds for review...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
    console.log('Browser closed. Test complete.');
  }
}

// Run the tests
runProductionTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });