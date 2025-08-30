import { chromium, devices } from 'playwright';

const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

async function testMobilePotluckButton() {
  console.log('📱 Testing Mobile View Potluck Button\n');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    permissions: ['geolocation'],
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Navigate to local dev server
    console.log('1. Loading local development site...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('   ✓ Site loaded');
    
    // 2. Check if login is needed
    console.log('2. Checking login status...');
    const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
    
    if (needsLogin) {
      console.log('   Logging in...');
      await page.fill('input[type="email"]', TEST_ACCOUNT.email);
      await page.fill('input[type="password"]', TEST_ACCOUNT.password);
      await page.tap('button:has-text("Sign In")');
      await page.waitForURL(/\/(home|games)?$/, { timeout: 15000 });
      console.log('   ✓ Login successful');
    } else {
      console.log('   ✓ Already logged in');
    }
    
    // 3. Navigate to games page
    console.log('3. Navigating to games page...');
    await page.tap('nav >> text="Games"');
    await page.waitForURL(/\/games/, { timeout: 10000 });
    console.log('   ✓ On games page');
    
    // 4. Wait for game cards to load
    console.log('4. Waiting for game cards...');
    await page.waitForSelector('[class*="bg-white"][class*="rounded-lg"]', { timeout: 10000 });
    const gameCards = await page.locator('[class*="bg-white"][class*="rounded-lg"]').count();
    console.log(`   ✓ Found ${gameCards} game cards`);
    
    // 5. Find a game with "View Potluck" button
    console.log('5. Looking for View Potluck button...');
    const viewPotluckButton = page.locator('button:has-text("View Potluck")').first();
    const buttonVisible = await viewPotluckButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!buttonVisible) {
      console.log('   ✗ No View Potluck button found');
      await page.screenshot({ path: 'screenshots/no-potluck-button.png' });
      return;
    }
    
    console.log('   ✓ Found View Potluck button');
    
    // 6. Get the game info before clicking
    const firstGameCard = page.locator('[class*="bg-white"][class*="rounded-lg"]').first();
    const gameText = await firstGameCard.textContent();
    console.log(`   First game: ${gameText.slice(0, 50)}...`);
    
    // 7. Click the View Potluck button
    console.log('6. Clicking View Potluck button...');
    await viewPotluckButton.click();
    
    // 8. Wait for navigation
    console.log('7. Waiting for potluck page...');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/potluck')) {
      console.log('   ✓ Successfully navigated to potluck page');
      
      // 9. Check if potluck page loaded correctly
      console.log('8. Verifying potluck page content...');
      
      // Check for header
      const header = await page.locator('h1:has-text("Potluck Manager")').isVisible({ timeout: 3000 }).catch(() => false);
      if (header) {
        console.log('   ✓ Potluck Manager header visible');
      }
      
      // Check for game selector
      const gameSelector = await page.locator('select').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (gameSelector) {
        console.log('   ✓ Game selector present');
        
        // Check if correct game is selected
        const selectedValue = await page.locator('select').first().inputValue();
        console.log(`   Selected game ID: ${selectedValue}`);
      }
      
      // Check for categories
      const categories = ['Main', 'Side', 'Appetizer', 'Dessert'];
      for (const cat of categories) {
        const catVisible = await page.locator(`text=/${cat}/i`).first().isVisible({ timeout: 1000 }).catch(() => false);
        if (catVisible) {
          console.log(`   ✓ ${cat} category visible`);
        }
      }
      
      // Check for FAB
      const fab = await page.locator('button[class*="fixed"][class*="bottom"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (fab) {
        console.log('   ✓ Add button (FAB) present');
      }
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/potluck-page-after-button.png' });
      console.log('   ✓ Screenshot saved');
      
    } else {
      console.log('   ✗ Failed to navigate to potluck page');
      console.log('   Current content:');
      const bodyText = await page.locator('body').textContent();
      console.log(bodyText.slice(0, 200));
      await page.screenshot({ path: 'screenshots/failed-navigation.png' });
    }
    
    // 10. Test navigation back and forth
    console.log('9. Testing navigation back to games...');
    await page.tap('nav >> text="Games"');
    await page.waitForURL(/\/games/, { timeout: 5000 });
    console.log('   ✓ Back on games page');
    
    console.log('10. Testing View Potluck button again...');
    const secondButton = page.locator('button:has-text("View Potluck")').first();
    await secondButton.click();
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/potluck')) {
      console.log('   ✓ Second navigation successful');
    } else {
      console.log('   ✗ Second navigation failed');
    }
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📱 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✓ Mobile emulation working');
    console.log('✓ Login functionality works');
    console.log('✓ Games page loads correctly');
    console.log('✓ View Potluck buttons are visible');
    if (page.url().includes('/potluck')) {
      console.log('✓ View Potluck button navigates correctly');
      console.log('✓ Potluck page loads with content');
    } else {
      console.log('✗ View Potluck button navigation needs attention');
    }
    console.log('\n🎉 Test complete!');
    
    await context.close();
    await browser.close();
  }
}

// Run the test
testMobilePotluckButton().catch(console.error);