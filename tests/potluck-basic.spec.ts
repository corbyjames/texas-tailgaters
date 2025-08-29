import { test, expect } from '@playwright/test';

test.describe('Basic Potluck Features', () => {
  
  test('should load potluck page', async ({ page }) => {
    // Navigate directly to potluck page
    await page.goto('http://localhost:5173/potluck');
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      // Login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to potluck again
      await page.goto('http://localhost:5173/potluck');
    }
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify we're on the potluck page
    const heading = await page.textContent('h1');
    expect(heading).toContain('Potluck Manager');
  });

  test('should have add item button', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.goto('http://localhost:5173/potluck');
    }
    
    // Wait for button to be visible
    const addButton = page.locator('button:has-text("Add Item")');
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });
});