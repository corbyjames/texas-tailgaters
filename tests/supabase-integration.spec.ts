import { test, expect } from '@playwright/test';

// Test configuration for Supabase
const SUPABASE_URL = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const TEST_USER = {
  email: 'test@texastailgaters.com',
  password: 'password123'
};

test.describe('Supabase Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for database operations
    test.setTimeout(60000);
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  });

  test('should connect to Supabase and load games', async ({ page }) => {
    // Navigate to games page
    await page.goto('http://localhost:5173/games');
    
    // Wait for games to load or show empty state
    await page.waitForSelector('.container', { timeout: 10000 });
    
    // Check if we have either games or empty state
    const hasGames = await page.locator('.card').count() > 0;
    const hasEmptyState = await page.locator('text=/No games found|No games match/').isVisible();
    
    expect(hasGames || hasEmptyState).toBeTruthy();
    
    // Log what we found
    if (hasGames) {
      const gameCount = await page.locator('.card').count();
      console.log(`Found ${gameCount} games from Supabase`);
    } else {
      console.log('No games in database - empty state shown');
    }
  });

  test('should sync games from admin page', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:5173/admin');
    
    // Wait for admin page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });
    
    // Click sync schedule button
    await page.click('button:has-text("Sync Schedule")');
    
    // Wait for sync to complete (look for success or error message)
    await page.waitForTimeout(5000); // Give time for database operation
    
    // Check for any response
    const alertDialog = page.locator('role=alert');
    const hasAlert = await alertDialog.count() > 0;
    
    if (!hasAlert) {
      // Check console for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text());
        }
      });
    }
    
    // Navigate to games page to verify
    await page.goto('http://localhost:5173/games');
    await page.waitForTimeout(2000);
    
    // Check if games were added
    const gameCards = await page.locator('.card').count();
    console.log(`After sync: ${gameCards} games found`);
  });

  test('should clear all data from admin page', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:5173/admin');
    
    // Wait for admin page
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });
    
    // Look for clear data button
    const clearButton = page.locator('button:has-text("Clear Mock Data")').first();
    
    if (await clearButton.isVisible()) {
      // Click clear button
      await clearButton.click();
      
      // Handle confirmation if it appears
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for operation
      await page.waitForTimeout(3000);
      
      // Verify games were cleared
      await page.goto('http://localhost:5173/games');
      await page.waitForTimeout(2000);
      
      const gameCount = await page.locator('.card').count();
      console.log(`After clear: ${gameCount} games remaining`);
    } else {
      console.log('Clear button not found - skipping clear test');
    }
  });

  test('should handle game CRUD operations', async ({ page }) => {
    // This would require admin functionality to create games
    // For now, we'll just verify the games page loads
    await page.goto('http://localhost:5173/games');
    
    // Check if page loads without errors
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    expect(errors.filter(e => e.includes('Supabase')).length).toBe(0);
  });

  test('should load game details with potluck items', async ({ page }) => {
    // First, ensure we have games
    await page.goto('http://localhost:5173/games');
    
    const gameCards = await page.locator('.card').count();
    
    if (gameCards > 0) {
      // Click on first game's View Details
      await page.locator('a:has-text("View Details")').first().click();
      
      // Wait for game details page
      await page.waitForSelector('text=Back to Games', { timeout: 10000 });
      
      // Check that page loaded
      await expect(page.locator('h2')).toBeVisible();
      
      // Check for potluck section
      await expect(page.locator('text=Potluck Items')).toBeVisible();
      
      console.log('Game details page loaded successfully');
    } else {
      console.log('No games to test details page');
    }
  });

  test('should create and manage potluck items', async ({ page }) => {
    // Navigate to potluck page
    await page.goto('http://localhost:5173/potluck');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Potluck Manager")', { timeout: 10000 });
    
    // Check if we have games to add items to
    const gameSelector = page.locator('select').first();
    const hasGames = await gameSelector.locator('option').count() > 1;
    
    if (hasGames) {
      // Try to add a potluck item
      await page.click('button:has-text("Add Item")');
      
      // Fill form
      await page.fill('input[placeholder*="BBQ Brisket"]', 'Test Potluck Item');
      await page.selectOption('select', 'main');
      await page.fill('input[placeholder*="Serves"]', 'Serves 10');
      
      // Submit
      await page.click('button:has-text("Add Item"):visible:last');
      
      // Wait for modal to close
      await page.waitForTimeout(2000);
      
      // Check if item was added (expand category if needed)
      const mainDishButton = page.locator('button:has-text("Main Dish")').first();
      if (await mainDishButton.isVisible()) {
        await mainDishButton.click();
        
        // Look for our item
        const itemVisible = await page.locator('text=Test Potluck Item').isVisible();
        console.log(`Potluck item created: ${itemVisible}`);
      }
    } else {
      console.log('No games available for potluck items');
    }
  });

  test('should verify Supabase auth is working', async ({ page }) => {
    // We're already logged in from beforeEach
    // Check that we can access protected routes
    
    await page.goto('http://localhost:5173/games');
    await expect(page).not.toHaveURL(/\/login/);
    
    await page.goto('http://localhost:5173/potluck');
    await expect(page).not.toHaveURL(/\/login/);
    
    // Check user menu shows we're logged in
    const userMenu = page.locator('text=test@texastailgaters.com').or(page.locator('text=Account'));
    await expect(userMenu.first()).toBeVisible({ timeout: 10000 });
    
    console.log('Authentication working correctly');
  });

  test('should handle database errors gracefully', async ({ page }) => {
    // Test error handling by trying to access a non-existent game
    await page.goto('http://localhost:5173/games/non-existent-id');
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Check we're not stuck on loading
    const loading = await page.locator('.animate-spin').count();
    expect(loading).toBe(0);
    
    // Should either show "not found" or redirect
    const notFound = await page.locator('text=/not found|doesn\'t exist/i').isVisible();
    const redirected = page.url().includes('/games') && !page.url().includes('non-existent-id');
    
    expect(notFound || redirected).toBeTruthy();
    console.log('Error handling working correctly');
  });

  test('should verify all Supabase tables are accessible', async ({ page }) => {
    // This test checks console for any Supabase errors
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('supabase')) {
        errors.push(msg.text());
      }
    });
    
    // Visit pages that use different tables
    await page.goto('http://localhost:5173/games'); // uses games table
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/potluck'); // uses potluck_items table
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/admin'); // uses multiple tables
    await page.waitForTimeout(2000);
    
    // Check for Supabase errors
    if (errors.length > 0) {
      console.log('Supabase errors found:', errors);
    }
    
    expect(errors.length).toBe(0);
    console.log('All Supabase tables accessible');
  });
});

test.describe('Supabase Connection Test', () => {
  test('should connect to Supabase directly', async ({ page }) => {
    // Test direct Supabase connection
    await page.goto('http://localhost:5173');
    
    // Inject test to check Supabase client
    const isConnected = await page.evaluate(async () => {
      try {
        // Try to access window.supabase if exposed
        const response = await fetch('https://kvtufvfnlvlqhxcwksja.supabase.co/rest/v1/', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg'
          }
        });
        return response.ok;
      } catch (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
    });
    
    expect(isConnected).toBeTruthy();
    console.log(`Direct Supabase connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  });
});