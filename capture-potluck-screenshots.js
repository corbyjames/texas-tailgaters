import { chromium, devices } from 'playwright';

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  
  // Test on iPhone 12 Pro
  const iPhone = devices['iPhone 12 Pro'];
  const context = await browser.newContext({
    ...iPhone,
    locale: 'en-US',
  });
  
  const page = await context.newPage();
  
  console.log('📱 Capturing potluck page screenshots...\n');
  
  // Navigate directly to potluck page (assuming first game)
  console.log('1. Navigating to potluck page...');
  
  // Try direct navigation to a potluck page
  await page.goto('http://localhost:5173/games/game-1/potluck');
  await page.waitForLoadState('networkidle');
  
  // Check if redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    console.log('2. Need to login first...');
    await page.screenshot({ 
      path: 'screenshots/potluck-login-required.png',
      fullPage: true 
    });
    
    // Try to login
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait a bit for login
    await page.waitForTimeout(2000);
    
    // Try to navigate to potluck again
    await page.goto('http://localhost:5173/games/game-1/potluck');
    await page.waitForLoadState('networkidle');
  }
  
  // Capture potluck page
  console.log('3. Capturing potluck page viewport...');
  await page.screenshot({ 
    path: 'screenshots/potluck-mobile-viewport.png',
    fullPage: false 
  });
  
  console.log('4. Capturing full potluck page...');
  await page.screenshot({ 
    path: 'screenshots/potluck-mobile-full.png',
    fullPage: true 
  });
  
  // Try to interact with potluck elements
  console.log('5. Looking for potluck items...');
  
  // Check if there's an add item button
  const addButton = page.locator('button:has-text("Add Item"), button:has-text("add")').first();
  if (await addButton.isVisible()) {
    console.log('6. Clicking add item button...');
    await addButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/potluck-mobile-add-form.png',
      fullPage: true 
    });
  }
  
  // Test landscape orientation
  console.log('7. Testing landscape orientation...');
  await context.close();
  
  const landscapeContext = await browser.newContext({
    ...iPhone,
    viewport: { width: 844, height: 390 }, // Landscape dimensions
    locale: 'en-US',
  });
  
  const landscapePage = await landscapeContext.newPage();
  await landscapePage.goto('http://localhost:5173/games/game-1/potluck');
  await landscapePage.waitForLoadState('networkidle');
  
  await landscapePage.screenshot({ 
    path: 'screenshots/potluck-mobile-landscape.png',
    fullPage: true 
  });
  
  // Test on smaller phone (iPhone SE)
  console.log('8. Testing on iPhone SE (smaller screen)...');
  await landscapeContext.close();
  
  const iPhoneSE = devices['iPhone SE'];
  const seContext = await browser.newContext({
    ...iPhoneSE,
    locale: 'en-US',
  });
  
  const sePage = await seContext.newPage();
  await sePage.goto('http://localhost:5173/games/game-1/potluck');
  await sePage.waitForLoadState('networkidle');
  
  await sePage.screenshot({ 
    path: 'screenshots/potluck-mobile-iphonese.png',
    fullPage: true 
  });
  
  // Test tablet size
  console.log('9. Testing on iPad Mini...');
  await seContext.close();
  
  const iPadMini = devices['iPad Mini'];
  const ipadContext = await browser.newContext({
    ...iPadMini,
    locale: 'en-US',
  });
  
  const ipadPage = await ipadContext.newPage();
  await ipadPage.goto('http://localhost:5173/games/game-1/potluck');
  await ipadPage.waitForLoadState('networkidle');
  
  await ipadPage.screenshot({ 
    path: 'screenshots/potluck-ipad.png',
    fullPage: true 
  });
  
  console.log('\n✅ Potluck screenshots captured successfully!');
  console.log('📁 Check the screenshots/ directory for:');
  console.log('   - potluck-mobile-viewport.png');
  console.log('   - potluck-mobile-full.png');
  console.log('   - potluck-mobile-add-form.png');
  console.log('   - potluck-mobile-landscape.png');
  console.log('   - potluck-mobile-iphonese.png');
  console.log('   - potluck-ipad.png');
  
  await browser.close();
})();