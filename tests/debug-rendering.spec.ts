import { test, expect } from '@playwright/test';

test('Debug - Check what is rendering on pages', async ({ page }) => {
  console.log('🔍 Debugging page rendering...\n');
  
  // Check home page
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  
  console.log('HOME PAGE (/)');
  console.log('-------------');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-home.png' });
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if it's showing login page
  const hasLoginForm = await page.locator('input[type="email"]').isVisible();
  const hasPasswordField = await page.locator('input[type="password"]').isVisible();
  console.log('Has login form:', hasLoginForm);
  console.log('Has password field:', hasPasswordField);
  
  // Check for navigation
  const hasNav = await page.locator('nav').count();
  console.log('Number of nav elements:', hasNav);
  
  // Check for bottom navigation specifically
  const hasBottomNav = await page.locator('.fixed.bottom-0').count();
  console.log('Has bottom navigation:', hasBottomNav > 0);
  
  // Get all visible links
  const links = await page.locator('a:visible').allTextContents();
  console.log('Visible links:', links);
  
  // Get all visible buttons
  const buttons = await page.locator('button:visible').allTextContents();
  console.log('Visible buttons:', buttons);
  
  // Check current URL
  console.log('Current URL:', page.url());
  
  // Check for any error messages
  const errors = await page.locator('.text-red-500, .text-red-600, .error').allTextContents();
  if (errors.length > 0) {
    console.log('Error messages:', errors);
  }
  
  // Get main heading
  const h1Text = await page.locator('h1').allTextContents();
  console.log('H1 headings:', h1Text);
  
  console.log('\n-------------------\n');
  
  // Check /games route
  await page.goto('http://localhost:5173/games');
  await page.waitForLoadState('networkidle');
  
  console.log('GAMES PAGE (/games)');
  console.log('-------------------');
  
  const gamesTitle = await page.locator('h1').allTextContents();
  console.log('H1 headings:', gamesTitle);
  
  const gamesContent = await page.locator('.main-content, main').allTextContents();
  console.log('Main content preview:', gamesContent[0]?.substring(0, 200));
  
  // Take screenshot
  await page.screenshot({ path: 'debug-games.png' });
  
  console.log('\n-------------------\n');
  
  // Check /potluck route
  await page.goto('http://localhost:5173/potluck');
  await page.waitForLoadState('networkidle');
  
  console.log('POTLUCK PAGE (/potluck)');
  console.log('------------------------');
  
  const potluckTitle = await page.locator('h1').allTextContents();
  console.log('H1 headings:', potluckTitle);
  
  const potluckContent = await page.locator('.main-content, main').allTextContents();
  console.log('Main content preview:', potluckContent[0]?.substring(0, 200));
  
  // Take screenshot
  await page.screenshot({ path: 'debug-potluck.png' });
  
  console.log('\n-------------------\n');
  
  // Check /admin route
  await page.goto('http://localhost:5173/admin');
  await page.waitForLoadState('networkidle');
  
  console.log('ADMIN PAGE (/admin)');
  console.log('-------------------');
  
  const adminTitle = await page.locator('h1').allTextContents();
  console.log('H1 headings:', adminTitle);
  
  const hasAdminLogin = await page.locator('input[type="email"]').isVisible();
  console.log('Shows login form:', hasAdminLogin);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-admin.png' });
  
  console.log('\n-------------------\n');
  console.log('Debug screenshots saved: debug-home.png, debug-games.png, debug-potluck.png, debug-admin.png');
});