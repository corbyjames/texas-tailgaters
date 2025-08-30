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
  
  console.log('📱 Capturing mobile screenshots...\n');
  
  // Go to login page
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/mobile-login.png',
    fullPage: true 
  });
  
  // Login
  console.log('2. Logging in...');
  try {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Screenshot before clicking submit
    await page.screenshot({ 
      path: 'screenshots/mobile-login-filled.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    
    // Wait for navigation to games page
    await page.waitForURL('**/games', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('Login failed, continuing with available pages...');
    // Try to navigate directly to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
  }
  
  // Capture games schedule view
  console.log('3. Capturing games schedule view...');
  await page.screenshot({ 
    path: 'screenshots/mobile-games-full.png',
    fullPage: true 
  });
  
  // Capture just the viewport (what user sees without scrolling)
  await page.screenshot({ 
    path: 'screenshots/mobile-games-viewport.png',
    fullPage: false 
  });
  
  // Scroll to middle and capture
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/mobile-games-middle.png',
    fullPage: false 
  });
  
  // Click on first game card if available
  const gameCard = page.locator('.bg-white').first();
  const hasGames = await gameCard.isVisible();
  
  if (hasGames) {
    console.log('4. Clicking on first game...');
    await gameCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'screenshots/mobile-game-detail.png',
      fullPage: true 
    });
  }
  
  // Test landscape orientation
  console.log('5. Testing landscape orientation...');
  await context.close();
  
  const landscapeContext = await browser.newContext({
    ...iPhone,
    viewport: { width: 844, height: 390 }, // Landscape dimensions
    locale: 'en-US',
  });
  
  const landscapePage = await landscapeContext.newPage();
  
  // Login again in landscape
  try {
    await landscapePage.goto('http://localhost:5173/login');
    await landscapePage.fill('input[type="email"]', 'test@texastailgaters.com');
    await landscapePage.fill('input[type="password"]', 'TestPassword123!');
    await landscapePage.click('button[type="submit"]');
    await landscapePage.waitForURL('**/games', { timeout: 5000 });
  } catch {
    await landscapePage.goto('http://localhost:5173/games');
  }
  await landscapePage.waitForLoadState('networkidle');
  
  await landscapePage.screenshot({ 
    path: 'screenshots/mobile-games-landscape.png',
    fullPage: true 
  });
  
  // Test on smaller phone (iPhone SE)
  console.log('6. Testing on iPhone SE (smaller screen)...');
  await landscapeContext.close();
  
  const iPhoneSE = devices['iPhone SE'];
  const seContext = await browser.newContext({
    ...iPhoneSE,
    locale: 'en-US',
  });
  
  const sePage = await seContext.newPage();
  
  try {
    await sePage.goto('http://localhost:5173/login');
    await sePage.fill('input[type="email"]', 'test@texastailgaters.com');
    await sePage.fill('input[type="password"]', 'TestPassword123!');
    await sePage.click('button[type="submit"]');
    await sePage.waitForURL('**/games', { timeout: 5000 });
  } catch {
    await sePage.goto('http://localhost:5173/games');
  }
  await sePage.waitForLoadState('networkidle');
  
  await sePage.screenshot({ 
    path: 'screenshots/mobile-games-iphonese.png',
    fullPage: true 
  });
  
  console.log('\n✅ Screenshots captured successfully!');
  console.log('📁 Check the screenshots/ directory for:');
  console.log('   - mobile-login.png');
  console.log('   - mobile-games-full.png');
  console.log('   - mobile-games-viewport.png');
  console.log('   - mobile-games-middle.png');
  console.log('   - mobile-game-detail.png');
  console.log('   - mobile-games-landscape.png');
  console.log('   - mobile-games-iphonese.png');
  
  await browser.close();
})();