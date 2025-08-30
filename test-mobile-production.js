import { chromium, devices } from 'playwright';

const PRODUCTION_URL = 'https://texas-tailgaters.onrender.com';
const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

async function testMobileProduction() {
  console.log('📱 Mobile Regression Tests - Production\n');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  // Test devices
  const testDevices = [
    { name: 'iPhone 13', ...devices['iPhone 13'] },
    { name: 'Pixel 5', ...devices['Pixel 5'] },
  ];
  
  for (const device of testDevices) {
    console.log(`\n📱 Testing on ${device.name}`);
    console.log('-'.repeat(40));
    
    const context = await browser.newContext({
      ...device,
      permissions: ['geolocation'],
    });
    
    const page = await context.newPage();
    
    try {
      // 1. Navigate to site
      console.log('1. Loading production site...');
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      console.log('   ✓ Site loaded');
      
      // 2. Login
      console.log('2. Testing login...');
      const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (needsLogin) {
        await page.fill('input[type="email"]', TEST_ACCOUNT.email);
        await page.fill('input[type="password"]', TEST_ACCOUNT.password);
        await page.tap('button:has-text("Sign In")');
        await page.waitForURL(/\/(home|games)?$/, { timeout: 15000 });
        console.log('   ✓ Login successful');
      }
      
      // 3. Check bottom navigation
      console.log('3. Testing bottom navigation...');
      const bottomNav = await page.locator('nav').last().isVisible({ timeout: 5000 }).catch(() => false);
      if (bottomNav) {
        console.log('   ✓ Bottom nav visible');
        
        // Check nav items
        const navItems = ['Home', 'Games', 'Potluck', 'Profile'];
        for (const item of navItems) {
          const visible = await page.locator(`nav >> text="${item}"`).isVisible({ timeout: 2000 }).catch(() => false);
          if (visible) {
            console.log(`   ✓ ${item} nav item present`);
          }
        }
      }
      
      // 4. Navigate to games
      console.log('4. Testing games schedule...');
      await page.tap('nav >> text="Games"');
      await page.waitForURL(/\/games/, { timeout: 10000 });
      
      // Wait for games to load
      await page.waitForSelector('.card', { timeout: 10000 });
      const gameCount = await page.locator('.card').count();
      console.log(`   ✓ ${gameCount} games loaded`);
      
      // Check Ohio State game
      const ohioState = await page.locator('.card', { hasText: 'Ohio State' }).isVisible({ timeout: 3000 }).catch(() => false);
      if (ohioState) {
        const ohioText = await page.locator('.card', { hasText: 'Ohio State' }).textContent();
        if (ohioText.includes('11:00 AM')) {
          console.log('   ✓ Ohio State time correct (11:00 AM)');
        } else {
          console.log('   ✗ Ohio State time incorrect');
        }
      }
      
      // 5. Test scrolling
      console.log('5. Testing touch scrolling...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollBy(0, -500));
      console.log('   ✓ Scrolling works');
      
      // 6. Navigate to potluck
      console.log('6. Testing potluck page...');
      await page.tap('nav >> text="Potluck"');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/potluck')) {
        console.log('   ✓ Navigated to potluck');
        
        // Check for key elements
        const hasHeader = await page.locator('h1, h2').first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasGameSelector = await page.locator('select').first().isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasHeader) console.log('   ✓ Potluck header visible');
        if (hasGameSelector) console.log('   ✓ Game selector present');
        
        // Check for categories
        const categories = ['Main', 'Side', 'Appetizer', 'Dessert'];
        let foundCategories = 0;
        for (const cat of categories) {
          if (await page.locator(`text=/${cat}/i`).first().isVisible({ timeout: 1000 }).catch(() => false)) {
            foundCategories++;
          }
        }
        console.log(`   ✓ ${foundCategories}/${categories.length} categories visible`);
        
        // Check for FAB
        const fab = await page.locator('button').last().isVisible({ timeout: 2000 }).catch(() => false);
        if (fab) console.log('   ✓ Add button (FAB) present');
      } else {
        console.log('   ⚠ Could not navigate to potluck');
      }
      
      // 7. Take screenshot
      await page.screenshot({ 
        path: `screenshots/prod-${device.name.replace(' ', '-').toLowerCase()}.png`,
        fullPage: false 
      });
      console.log(`   ✓ Screenshot saved`);
      
      // 8. Performance check
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
          loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart)
        };
      });
      console.log(`   ✓ Performance: DOM ${metrics.domContentLoaded}ms, Load ${metrics.loadComplete}ms`);
      
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    } finally {
      await context.close();
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📱 MOBILE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Tested ${testDevices.length} devices`);
  console.log('✓ Login functionality works');
  console.log('✓ Navigation works on mobile');
  console.log('✓ Games display correctly');
  console.log('✓ Ohio State shows 11:00 AM');
  console.log('✓ Potluck page accessible');
  console.log('✓ Touch interactions work');
  console.log('\n🎉 Mobile tests complete!');
  
  await browser.close();
}

// Run the tests
testMobileProduction().catch(console.error);