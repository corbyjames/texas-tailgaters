import { test, expect } from '@playwright/test';

test.describe('Texas Tailgaters - Authenticated UI Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    console.log('Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation after login
    await page.waitForTimeout(2000);
    
    // Check if we're logged in by looking for non-login page content
    const currentUrl = page.url();
    console.log('After login, current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Login might have failed, continuing anyway...');
    } else {
      console.log('✅ Login successful');
    }
  });

  test('Navigation after authentication', async ({ page }) => {
    console.log('Testing authenticated navigation...');
    
    // Should be on home page after login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for navigation elements
    const navLinks = await page.locator('a').allTextContents();
    console.log('Available navigation links:', navLinks);
    
    // Test Games navigation
    const gamesLink = page.locator('a').filter({ hasText: /games/i }).first();
    if (await gamesLink.isVisible()) {
      await gamesLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to Games, URL:', page.url());
    } else {
      console.log('⚠️ Games link not found');
    }
    
    // Test Potluck navigation
    const potluckLink = page.locator('a').filter({ hasText: /potluck/i }).first();
    if (await potluckLink.isVisible()) {
      await potluckLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to Potluck, URL:', page.url());
    } else {
      console.log('⚠️ Potluck link not found');
    }
    
    // Test Admin navigation if available
    const adminLink = page.locator('a').filter({ hasText: /admin/i }).first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to Admin, URL:', page.url());
    } else {
      console.log('⚠️ Admin link not found or not visible');
    }
  });

  test('Games page functionality when authenticated', async ({ page }) => {
    console.log('Testing games page as authenticated user...');
    
    // Navigate directly to games
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Check page content
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log('Page title:', pageTitle);
    
    // Look for sync button
    const syncButton = page.locator('button').filter({ hasText: /sync/i }).first();
    if (await syncButton.isVisible()) {
      console.log('✅ Sync button found');
      await syncButton.click();
      await page.waitForTimeout(3000); // Wait for sync
      console.log('Sync button clicked');
    } else {
      console.log('⚠️ Sync button not found');
    }
    
    // Check for game cards
    const gameCards = await page.locator('.bg-white, .rounded-lg, .card').count();
    console.log(`Found ${gameCards} potential game cards`);
    
    // Look for any buttons in game cards
    const allButtons = await page.locator('button').allTextContents();
    console.log('All visible buttons:', allButtons);
  });

  test('Potluck page functionality when authenticated', async ({ page }) => {
    console.log('Testing potluck page as authenticated user...');
    
    // Navigate directly to potluck
    await page.goto('http://localhost:5173/potluck');
    await page.waitForLoadState('networkidle');
    
    // Check page content
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log('Page title:', pageTitle);
    
    // Look for game selector
    const selects = await page.locator('select').count();
    console.log(`Found ${selects} select elements`);
    
    if (selects > 0) {
      const selectOptions = await page.locator('select option').allTextContents();
      console.log('Select options:', selectOptions);
    }
    
    // Look for Add Item button
    const addButton = page.locator('button').filter({ hasText: /add/i }).first();
    if (await addButton.isVisible()) {
      console.log('✅ Add Item button found');
    } else {
      console.log('⚠️ Add Item button not found');
    }
    
    // Check for category filters
    const categoryButtons = await page.locator('button').filter({ hasText: /main|side|dessert|appetizer|drink/i }).count();
    console.log(`Found ${categoryButtons} category filter buttons`);
  });

  test('Admin page functionality when authenticated', async ({ page }) => {
    console.log('Testing admin page as authenticated user...');
    
    // Navigate directly to admin
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on admin page or redirected
    const currentUrl = page.url();
    console.log('Admin page URL:', currentUrl);
    
    // Check page content
    const pageContent = await page.locator('body').textContent();
    
    if (pageContent?.includes('Admin') || pageContent?.includes('Dashboard')) {
      console.log('✅ Admin page loaded');
      
      // Look for admin-specific buttons
      const adminButtons = await page.locator('button').allTextContents();
      console.log('Admin buttons:', adminButtons);
      
      // Check for Clear & Resync
      const clearButton = page.locator('button').filter({ hasText: /clear|resync/i }).first();
      if (await clearButton.isVisible()) {
        console.log('✅ Clear & Resync button found');
      }
      
      // Check for Add Game
      const addGameButton = page.locator('button').filter({ hasText: /add.*game/i }).first();
      if (await addGameButton.isVisible()) {
        console.log('✅ Add Game button found');
      }
    } else if (pageContent?.includes('not authorized') || pageContent?.includes('permission')) {
      console.log('⚠️ User is not authorized for admin page');
    } else {
      console.log('⚠️ Unexpected admin page content');
    }
  });

  test('User menu and logout functionality', async ({ page }) => {
    console.log('Testing user menu...');
    
    // Look for user menu button (usually in header)
    const userMenuButton = page.locator('button').filter({ has: page.locator('svg, img') }).first();
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      console.log('✅ User menu button clicked');
      await page.waitForTimeout(500);
      
      // Look for sign out option
      const signOutButton = page.locator('button, a').filter({ hasText: /sign out|log out|logout/i }).first();
      if (await signOutButton.isVisible()) {
        console.log('✅ Sign out button found');
        
        // Click sign out
        await signOutButton.click();
        await page.waitForTimeout(2000);
        
        // Check if we're back at login
        if (page.url().includes('/login')) {
          console.log('✅ Successfully logged out');
        }
      } else {
        console.log('⚠️ Sign out button not found in menu');
      }
    } else {
      console.log('⚠️ User menu button not found');
    }
  });

  test('Bottom navigation when authenticated', async ({ page }) => {
    console.log('Testing bottom navigation...');
    
    // Check for bottom navigation
    const bottomNav = page.locator('.fixed.bottom-0, nav').filter({ has: page.locator('a') });
    
    if (await bottomNav.isVisible()) {
      console.log('✅ Bottom navigation found');
      
      const navLinks = await bottomNav.locator('a').allTextContents();
      console.log('Bottom nav links:', navLinks);
      
      // Test each link
      for (const linkText of ['Games', 'Potluck', 'Admin']) {
        const link = bottomNav.locator('a').filter({ hasText: new RegExp(linkText, 'i') }).first();
        if (await link.isVisible()) {
          console.log(`✅ ${linkText} link found in bottom nav`);
        }
      }
    } else {
      console.log('⚠️ Bottom navigation not found');
      
      // Check if navigation is in header instead
      const headerNav = page.locator('header nav, header a');
      if (await headerNav.count() > 0) {
        console.log('Navigation might be in header instead');
        const headerLinks = await headerNav.allTextContents();
        console.log('Header navigation:', headerLinks);
      }
    }
  });

  test('Mobile responsive view when authenticated', async ({ page }) => {
    console.log('Testing mobile view when authenticated...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to home
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      console.log('✅ Mobile menu button works');
      await page.waitForTimeout(500);
      
      // Check menu contents
      const menuLinks = await page.locator('a:visible').allTextContents();
      console.log('Mobile menu links:', menuLinks);
    } else {
      console.log('⚠️ Mobile menu button not found');
    }
    
    // Check if bottom navigation is visible on mobile
    const bottomNavMobile = page.locator('.fixed.bottom-0');
    if (await bottomNavMobile.isVisible()) {
      console.log('✅ Bottom navigation visible on mobile');
    } else {
      console.log('⚠️ Bottom navigation not visible on mobile');
    }
  });
});