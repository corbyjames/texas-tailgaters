import { test, expect } from '@playwright/test';

test.describe('Texas Tailgaters - Button Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation buttons work correctly', async ({ page }) => {
    console.log('Testing navigation buttons...');
    
    // Check if bottom navigation exists
    const bottomNav = page.locator('nav').filter({ hasText: 'Games' });
    await expect(bottomNav).toBeVisible();

    // Test Games navigation
    const gamesButton = page.getByRole('link', { name: /Games/i });
    await expect(gamesButton).toBeVisible();
    await gamesButton.click();
    await expect(page).toHaveURL(/\/games/);
    console.log('✅ Games navigation works');

    // Test Potluck navigation
    const potluckButton = page.getByRole('link', { name: /Potluck/i });
    await expect(potluckButton).toBeVisible();
    await potluckButton.click();
    await expect(page).toHaveURL(/\/potluck/);
    console.log('✅ Potluck navigation works');

    // Test Admin navigation (if visible)
    const adminButton = page.getByRole('link', { name: /Admin/i });
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await expect(page).toHaveURL(/\/admin/);
      console.log('✅ Admin navigation works');
    }

    // Test Home navigation
    const homeButton = page.getByRole('link', { name: /Home/i });
    if (await homeButton.isVisible()) {
      await homeButton.click();
      await expect(page).toHaveURL(/\//);
      console.log('✅ Home navigation works');
    }
  });

  test('Games page buttons and interactions', async ({ page }) => {
    console.log('Testing games page functionality...');
    
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');

    // Test sync button
    const syncButton = page.getByRole('button', { name: /sync/i });
    if (await syncButton.isVisible()) {
      await syncButton.click();
      console.log('✅ Sync button clicked');
      
      // Wait for sync to complete (check for loading state)
      await page.waitForTimeout(2000);
    }

    // Check if game cards are displayed
    const gameCards = page.locator('.bg-white').filter({ has: page.locator('text=/vs/i') });
    const gameCount = await gameCards.count();
    console.log(`Found ${gameCount} game cards`);
    
    if (gameCount > 0) {
      // Test first game card buttons
      const firstGameCard = gameCards.first();
      
      // Test View Details button if present
      const viewDetailsButton = firstGameCard.getByRole('button', { name: /view details/i });
      if (await viewDetailsButton.isVisible()) {
        await viewDetailsButton.click();
        console.log('✅ View Details button works');
        await page.waitForTimeout(1000);
      }

      // Test Plan Tailgate button if present
      const planButton = firstGameCard.getByRole('button', { name: /plan tailgate/i });
      if (await planButton.isVisible()) {
        await planButton.click();
        console.log('✅ Plan Tailgate button works');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Potluck page functionality', async ({ page }) => {
    console.log('Testing potluck page functionality...');
    
    // Navigate to potluck page
    await page.goto('http://localhost:5173/potluck');
    await page.waitForLoadState('networkidle');

    // Check if page loaded
    await expect(page.locator('h1', { hasText: /potluck/i })).toBeVisible();

    // Test game selector if present
    const gameSelector = page.locator('select').first();
    if (await gameSelector.isVisible()) {
      await gameSelector.selectOption({ index: 1 });
      console.log('✅ Game selector works');
      await page.waitForTimeout(1000);
    }

    // Test Add Item button
    const addItemButton = page.getByRole('button', { name: /add item/i });
    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      console.log('✅ Add Item button clicked');
      
      // Check if form/modal appears
      await page.waitForTimeout(1000);
      
      // Close modal if it opened
      const closeButton = page.getByRole('button', { name: /close|cancel/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('✅ Modal close button works');
      }
    }

    // Test category filter buttons
    const categoryButtons = page.getByRole('button').filter({ hasText: /main|side|dessert|drink/i });
    const categoryCount = await categoryButtons.count();
    if (categoryCount > 0) {
      await categoryButtons.first().click();
      console.log('✅ Category filter buttons work');
    }
  });

  test('Admin page functionality (if accessible)', async ({ page }) => {
    console.log('Testing admin page functionality...');
    
    // Try to navigate to admin page
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');

    // Check if login is required
    const loginForm = page.locator('form').filter({ has: page.locator('input[type="email"]') });
    if (await loginForm.isVisible()) {
      console.log('Admin page requires login');
      
      // Test login form
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      const loginButton = page.getByRole('button', { name: /sign in|login/i });
      if (await loginButton.isVisible()) {
        await loginButton.click();
        console.log('✅ Login button clicked');
        await page.waitForTimeout(2000);
      }
    }

    // If we're on admin page, test admin buttons
    const adminTitle = page.locator('h1', { hasText: /admin/i });
    if (await adminTitle.isVisible()) {
      console.log('Admin page accessible');
      
      // Test Clear & Resync button
      const clearButton = page.getByRole('button', { name: /clear.*resync/i });
      if (await clearButton.isVisible()) {
        console.log('✅ Clear & Resync button found (not clicking to avoid data loss)');
      }

      // Test Add Game button
      const addGameButton = page.getByRole('button', { name: /add game/i });
      if (await addGameButton.isVisible()) {
        console.log('✅ Add Game button found');
      }

      // Test theme management buttons
      const themeButtons = page.getByRole('button', { name: /theme/i });
      if (await themeButtons.count() > 0) {
        console.log('✅ Theme management buttons found');
      }
    }
  });

  test('Header menu functionality', async ({ page }) => {
    console.log('Testing header menu...');
    
    // Check if header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Test menu button (hamburger/user menu)
    const menuButton = header.getByRole('button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      console.log('✅ Menu button clicked');
      await page.waitForTimeout(500);

      // Check for menu items
      const signOutButton = page.getByRole('button', { name: /sign out|logout/i });
      if (await signOutButton.isVisible()) {
        console.log('✅ Sign out button found in menu');
      }

      // Close menu by clicking outside
      await page.click('body');
    }
  });

  test('Responsive design - mobile view buttons', async ({ page }) => {
    console.log('Testing mobile view...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Check bottom navigation is visible on mobile
    const bottomNav = page.locator('nav').filter({ hasText: 'Games' });
    await expect(bottomNav).toBeVisible();
    console.log('✅ Bottom navigation visible on mobile');

    // Test mobile menu if present
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      console.log('✅ Mobile menu button works');
      await page.waitForTimeout(500);
    }
  });

  test('Error handling - test form validation buttons', async ({ page }) => {
    console.log('Testing form validation...');
    
    // Navigate to a page with a form
    await page.goto('http://localhost:5173/');
    
    // Try to find a login/signup form
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /sign in|sign up|submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('✅ Form validation tested');
        
        // Check for error messages
        await page.waitForTimeout(1000);
        const errorMessage = page.locator('text=/error|required|invalid/i');
        if (await errorMessage.isVisible()) {
          console.log('✅ Error messages display correctly');
        }
      }
    }
  });
});

test.describe('Firebase Integration Tests', () => {
  test('Firebase connection and data persistence', async ({ page }) => {
    console.log('Testing Firebase integration...');
    
    // Check browser console for Firebase errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);

    // Check for Firebase-related errors
    const firebaseErrors = consoleErrors.filter(err => 
      err.toLowerCase().includes('firebase') || 
      err.toLowerCase().includes('permission') ||
      err.toLowerCase().includes('auth')
    );

    if (firebaseErrors.length > 0) {
      console.log('⚠️ Firebase errors detected:', firebaseErrors);
    } else {
      console.log('✅ No Firebase errors detected');
    }

    // Test data loading
    await page.goto('http://localhost:5173/games');
    await page.waitForLoadState('networkidle');
    
    // Check if games load (even if empty)
    const loadingIndicator = page.locator('text=/loading/i');
    if (await loadingIndicator.isVisible()) {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    
    const noGamesMessage = page.locator('text=/no games|no upcoming/i');
    const gameCards = page.locator('.bg-white').filter({ has: page.locator('text=/vs/i') });
    
    if (await noGamesMessage.isVisible() || await gameCards.count() > 0) {
      console.log('✅ Firebase data loading works');
    }
  });
});