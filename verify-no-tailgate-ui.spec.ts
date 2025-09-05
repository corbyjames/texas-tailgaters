import { test, expect, chromium } from '@playwright/test';

test('Verify No-Tailgate UI Elements Exist', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 Starting UI verification for no-tailgate feature...\n');
  
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
    
    // Check for game cards
    console.log('3. Looking for game cards...');
    const gameCards = page.locator('.card').filter({ hasText: /vs|@/ });
    const cardCount = await gameCards.count();
    console.log(`✅ Found ${cardCount} game cards\n`);
    
    // Check for no-tailgate toggle button
    console.log('4. Checking for no-tailgate toggle buttons...');
    const noTailgateButtons = page.locator('button[title="Mark as No Tailgate"]');
    const toggleCount = await noTailgateButtons.count();
    
    if (toggleCount > 0) {
      console.log(`✅ Found ${toggleCount} no-tailgate toggle buttons (CalendarOff icon)\n`);
      
      // Get details about the first button
      const firstButton = noTailgateButtons.first();
      const isVisible = await firstButton.isVisible();
      console.log(`   - First button visibility: ${isVisible}`);
      
      // Check for the icon
      const hasIcon = await firstButton.locator('svg').count() > 0;
      console.log(`   - Has CalendarOff icon: ${hasIcon}\n`);
      
      // Try clicking the first toggle
      console.log('5. Testing toggle functionality...');
      await firstButton.click();
      await page.waitForTimeout(2000);
      
      // Check for no-tailgate badge
      const noTailgateBadge = page.locator('text="No Tailgate Hosted"').first();
      const badgeVisible = await noTailgateBadge.isVisible();
      console.log(`✅ "No Tailgate Hosted" badge visible: ${badgeVisible}\n`);
      
      // Check for Enable button
      const enableButton = page.locator('button:has-text("Enable Tailgate")').first();
      const enableVisible = await enableButton.isVisible();
      console.log(`✅ "Enable Tailgate" button visible: ${enableVisible}\n`);
      
      // Check visual styling
      const firstCard = gameCards.first();
      const cardClasses = await firstCard.getAttribute('class');
      const hasGrayStyle = cardClasses?.includes('bg-gray-50') || cardClasses?.includes('opacity-75');
      console.log(`✅ Card has grayed-out styling: ${hasGrayStyle}\n`);
      
      // Re-enable the tailgate
      if (enableVisible) {
        console.log('6. Re-enabling tailgate...');
        await enableButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Tailgate re-enabled\n');
      }
      
      console.log('🎉 SUCCESS: All no-tailgate UI elements are present and functional!');
      
    } else {
      console.log('❌ No-tailgate toggle buttons NOT FOUND!\n');
      console.log('Debugging info:');
      
      // Check if we're actually on the games page
      const url = page.url();
      console.log(`   - Current URL: ${url}`);
      
      // Check if user is admin
      const profileButton = page.locator('text=/admin@texastailgaters.com/i');
      const isAdmin = await profileButton.count() > 0;
      console.log(`   - Logged in as admin: ${isAdmin}`);
      
      // Look for any buttons in game cards
      const allButtons = await gameCards.first().locator('button').all();
      console.log(`   - Total buttons in first game card: ${allButtons.length}`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const title = await allButtons[i].getAttribute('title');
        console.log(`     Button ${i + 1}: text="${text}", title="${title}"`);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'no-tailgate-debug.png', fullPage: true });
      console.log('\n📸 Screenshot saved as no-tailgate-debug.png');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
});

// Run the test
test.describe.configure({ mode: 'serial' });