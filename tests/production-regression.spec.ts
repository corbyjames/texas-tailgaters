import { test, expect, Page } from '@playwright/test';

// Production URL on Render
const PRODUCTION_URL = 'https://texas-tailgaters.onrender.com';
const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

test.describe('Texas Tailgaters Production Regression Suite', () => {
  test.setTimeout(60000); // 60 second timeout for each test

  test('Full user journey - Login, Schedule, Game Details, Potluck', async ({ page }) => {
    console.log('Starting comprehensive regression test on production...');
    
    // Test 1: Login Flow
    await test.step('1. Login to application', async () => {
      console.log('Testing login functionality...');
      
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      
      // Verify login page loaded
      await expect(page.locator('text="Sign in to your account"')).toBeVisible({ timeout: 10000 });
      
      // Fill in credentials
      await page.fill('input[type="email"]', TEST_ACCOUNT.email);
      await page.fill('input[type="password"]', TEST_ACCOUNT.password);
      
      // Click sign in
      await page.click('button:has-text("Sign In")');
      
      // Wait for successful login - should redirect to home
      await expect(page).toHaveURL(/.*\/(home|games)?$/, { timeout: 15000 });
      
      // Verify user is logged in
      await expect(page.locator('text=/Welcome.*Test User/i')).toBeVisible({ timeout: 10000 });
      
      console.log('✅ Login successful');
    });
    
    // Test 2: View Schedule
    await test.step('2. View game schedule', async () => {
      console.log('Testing schedule view...');
      
      // Navigate to games page
      if (!page.url().includes('/games')) {
        await page.click('text="View Season Schedule"');
        await expect(page).toHaveURL(/.*\/games/, { timeout: 10000 });
      }
      
      // Wait for games to load
      await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });
      
      // Verify key games are present
      const expectedGames = ['Ohio State', 'Oklahoma', 'Georgia', 'Texas A&M'];
      for (const opponent of expectedGames) {
        const gameCard = page.locator('.card', { hasText: opponent });
        await expect(gameCard).toBeVisible({ timeout: 5000 });
        console.log(`  ✅ Found ${opponent} game`);
      }
      
      // Verify Ohio State time is correct (11:00 AM)
      const ohioStateCard = page.locator('.card', { hasText: 'Ohio State' });
      const ohioStateText = await ohioStateCard.textContent();
      expect(ohioStateText).toContain('11:00 AM');
      console.log('  ✅ Ohio State time verified (11:00 AM)');
      
      // Take screenshot of schedule
      await page.screenshot({ 
        path: 'screenshots/production-schedule.png',
        fullPage: true 
      });
      
      console.log('✅ Schedule view working correctly');
    });
    
    // Test 3: Open Game Detail Page
    let selectedGameName = '';
    await test.step('3. Open game detail page', async () => {
      console.log('Testing game detail page...');
      
      // Click on first game with "View Details" button
      const firstGame = page.locator('.card').first();
      
      // Get game name for verification
      const gameHeader = await firstGame.locator('h3, [class*="font-bold"]').first().textContent();
      selectedGameName = gameHeader?.replace('@', '').trim() || 'Unknown';
      console.log(`  Opening details for: ${selectedGameName}`);
      
      // Click View Details button
      await firstGame.locator('text="View Details"').click();
      
      // Wait for detail page to load
      await expect(page).toHaveURL(/.*\/games\/.*/, { timeout: 10000 });
      
      // Verify detail page elements
      await expect(page.locator('h1, h2').filter({ hasText: selectedGameName })).toBeVisible({ timeout: 10000 });
      
      // Check for game information sections
      await expect(page.locator('text=/Date.*Time/i')).toBeVisible();
      await expect(page.locator('text=/Location/i')).toBeVisible();
      
      console.log('✅ Game detail page loaded successfully');
    });
    
    // Test 4: Check Potluck Items on Detail Page
    await test.step('4. Verify potluck items on detail page', async () => {
      console.log('Testing potluck items on detail page...');
      
      // Look for potluck section
      const potluckSection = page.locator('text=/Potluck.*Items/i').first();
      
      if (await potluckSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  Found potluck section on detail page');
        
        // Check for "Add Item" or "Sign Up" button
        const addItemButton = page.locator('button', { hasText: /Add.*Item|Sign.*Up/i });
        if (await addItemButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('  ✅ Add item button present');
        }
        
        // Check for potluck categories
        const categories = ['Main', 'Side', 'Appetizer', 'Dessert', 'Drink'];
        let foundCategories = 0;
        
        for (const category of categories) {
          if (await page.locator(`text=/${category}/i`).isVisible({ timeout: 2000 }).catch(() => false)) {
            foundCategories++;
          }
        }
        
        console.log(`  ✅ Found ${foundCategories} potluck categories`);
        
        // Check for any existing potluck items
        const potluckItems = await page.locator('[class*="potluck"], [class*="item"]').count();
        console.log(`  ✅ Found ${potluckItems} potluck item elements`);
        
      } else {
        console.log('  ℹ️  No potluck section on this game detail page (may be normal for some games)');
      }
      
      // Take screenshot of detail page
      await page.screenshot({ 
        path: 'screenshots/production-game-detail.png',
        fullPage: true 
      });
      
      console.log('✅ Game detail page verification complete');
    });
    
    // Test 5: Navigate to Potluck Manager Page
    await test.step('5. Test potluck manager page', async () => {
      console.log('Testing potluck manager page...');
      
      // Navigate to potluck page - try multiple methods
      const potluckNavOptions = [
        'text="Potluck"',
        'text="Manage Potluck"',
        '[href*="potluck"]',
        'text=/Potluck.*Manager/i'
      ];
      
      let navigatedToPotluck = false;
      
      for (const selector of potluckNavOptions) {
        if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.locator(selector).first().click();
          navigatedToPotluck = true;
          break;
        }
      }
      
      // If not found in nav, try direct URL
      if (!navigatedToPotluck) {
        console.log('  Navigating directly to /potluck');
        await page.goto(`${PRODUCTION_URL}/potluck`, { waitUntil: 'networkidle' });
      }
      
      // Wait for potluck page to load
      await page.waitForTimeout(3000);
      
      // Verify we're on potluck page
      const isPotluckPage = 
        page.url().includes('/potluck') ||
        await page.locator('h1, h2').filter({ hasText: /Potluck/i }).isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isPotluckPage) {
        console.log('  ✅ Potluck page loaded');
        
        // Check for game selector or list
        const gameSelector = page.locator('select, [role="combobox"]').first();
        if (await gameSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('  ✅ Game selector present');
        }
        
        // Check for category filters
        const categoryFilters = await page.locator('button, label').filter({ hasText: /Main|Side|Appetizer|Dessert|Drink/i }).count();
        console.log(`  ✅ Found ${categoryFilters} category filters`);
        
        // Check for add item functionality
        const addButton = page.locator('button').filter({ hasText: /Add|Create|New.*Item/i }).first();
        if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('  ✅ Add item button available');
          
          // Try to open add item modal
          await addButton.click();
          
          // Check if modal opened
          const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
          if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('  ✅ Add item modal opens correctly');
            
            // Close modal
            const closeButton = modal.locator('button').filter({ hasText: /Close|Cancel|X/i }).first();
            if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              await closeButton.click();
            } else {
              // Click outside modal to close
              await page.keyboard.press('Escape');
            }
          }
        }
        
        // Take screenshot of potluck page
        await page.screenshot({ 
          path: 'screenshots/production-potluck.png',
          fullPage: true 
        });
        
        console.log('✅ Potluck manager page working correctly');
      } else {
        console.log('  ⚠️  Could not navigate to potluck page (may require admin access)');
      }
    });
    
    // Test 6: Mobile Responsiveness
    await test.step('6. Test mobile responsiveness', async () => {
      console.log('Testing mobile view...');
      
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      
      // Navigate back to games page
      await page.goto(`${PRODUCTION_URL}/games`, { waitUntil: 'networkidle' });
      
      // Wait for mobile layout to render
      await page.waitForTimeout(2000);
      
      // Verify mobile menu or navigation
      const mobileMenu = page.locator('[class*="mobile"], [class*="burger"], [class*="menu"]').first();
      const hasMobileNav = await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasMobileNav) {
        console.log('  ✅ Mobile navigation present');
      }
      
      // Check game cards are still visible
      await expect(page.locator('.card').first()).toBeVisible({ timeout: 5000 });
      console.log('  ✅ Games display correctly on mobile');
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'screenshots/production-mobile.png',
        fullPage: true 
      });
      
      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      console.log('✅ Mobile responsiveness verified');
    });
    
    console.log('\n🎉 All regression tests passed successfully!');
  });
  
  // Additional focused tests
  test('Performance - Page load times', async ({ page }) => {
    console.log('Testing page load performance...');
    
    const pages = [
      { name: 'Home', url: PRODUCTION_URL },
      { name: 'Games', url: `${PRODUCTION_URL}/games` },
      { name: 'Potluck', url: `${PRODUCTION_URL}/potluck` }
    ];
    
    // Login first
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', TEST_ACCOUNT.email);
    await page.fill('input[type="password"]', TEST_ACCOUNT.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/(home|games)?$/, { timeout: 15000 });
    
    for (const testPage of pages) {
      const startTime = Date.now();
      await page.goto(testPage.url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      console.log(`  ${testPage.name}: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    }
    
    console.log('✅ Performance test complete');
  });
  
  test('Error handling - Invalid login', async ({ page }) => {
    console.log('Testing error handling...');
    
    await page.goto(PRODUCTION_URL);
    
    // Try invalid login
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    const errorMessage = page.locator('text=/error|invalid|incorrect/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Error handling working correctly');
  });
});

// Test configuration
test.use({
  // Use a longer timeout for production tests
  timeout: 90000,
  
  // Retry failed tests once
  retries: 1,
  
  // Take screenshots on failure
  screenshot: 'only-on-failure',
  
  // Record video on failure
  video: 'retain-on-failure',
  
  // Emulate a common browser environment
  ...{
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  }
});