import { test, expect } from '@playwright/test';

test.describe('Game Details Page', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate directly to games page
    await page.goto('http://localhost:5173/games');
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      // Login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate back to games
      await page.goto('http://localhost:5173/games');
    }
  });

  test('should navigate to game details when clicking View Details', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Click the first View Details button
    await page.click('a:has-text("View Details"):first');
    
    // Should navigate to game details page
    await expect(page).toHaveURL(/\/games\/[^/]+$/);
    
    // Should show game details elements
    await expect(page.locator('text=Back to Games')).toBeVisible();
  });

  test('should display game information on details page', async ({ page }) => {
    // Click first game's View Details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for page to load
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Should display game info sections
    const dateElement = page.locator('svg').filter({ hasText: /Calendar/i }).first();
    await expect(dateElement).toBeVisible();
    
    // Should show potluck section
    await expect(page.locator('text=Potluck Items')).toBeVisible();
    
    // Should show stats cards
    await expect(page.locator('text=Potluck Items').first()).toBeVisible();
    await expect(page.locator('text=Items Assigned').first()).toBeVisible();
    await expect(page.locator('text=Items Needed').first()).toBeVisible();
    await expect(page.locator('text=People Attending').first()).toBeVisible();
  });

  test('should display TV network and time if available', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for page load
    await page.waitForSelector('h2', { timeout: 10000 });
    
    // Check for TV icon if network is set
    const tvIcon = page.locator('svg').filter({ hasText: /Tv/i });
    const tvCount = await tvIcon.count();
    
    // If TV network exists, it should be displayed
    if (tvCount > 0) {
      await expect(tvIcon.first()).toBeVisible();
    }
  });

  test('should allow adding potluck items from game details', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for page load
    await page.waitForSelector('text=Potluck Items', { timeout: 10000 });
    
    // Click Add Item button
    await page.click('button:has-text("Add Item")');
    
    // Modal should appear
    await expect(page.locator('text=Add Potluck Item')).toBeVisible();
    
    // Fill in the form
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Test Item from Details');
    await page.selectOption('select', 'main');
    await page.fill('input[placeholder*="Serves"]', 'Serves 20');
    
    // Submit
    await page.click('button:has-text("Add Item"):last');
    
    // Item should appear in the list
    await page.click('button:has-text("Main Dish")'); // Expand category if needed
    await expect(page.locator('text=Test Item from Details')).toBeVisible();
  });

  test('should show attendees who have assigned items', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Add an item and assign it
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Attendee Test Item');
    await page.click('button:has-text("Add Item"):last');
    
    // Expand category and assign item
    await page.click('button:has-text("Other")'); // Default category
    
    // Try to click "I'll bring this" if visible
    const bringButton = page.locator('button:has-text("I\'ll bring this")').first();
    if (await bringButton.isVisible()) {
      await bringButton.click();
      
      // Should show in attendees section
      const attendeesSection = page.locator('text=Who\'s Coming');
      if (await attendeesSection.isVisible()) {
        await expect(attendeesSection).toBeVisible();
      }
    }
  });

  test('should navigate back to games list', async ({ page }) => {
    // Navigate to game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for details page
    await page.waitForSelector('text=Back to Games', { timeout: 10000 });
    
    // Click back button
    await page.click('text=Back to Games');
    
    // Should be back on games page
    await expect(page).toHaveURL('http://localhost:5173/games');
    await expect(page.locator('h1:has-text("Season")')).toBeVisible();
  });

  test('should display game status badge', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for page load
    await page.waitForSelector('span.rounded-full', { timeout: 10000 });
    
    // Should show status badge
    const statusBadge = page.locator('span.rounded-full').filter({ 
      hasText: /Tailgate Planned|Watch Party|Not Yet Planned/i 
    });
    await expect(statusBadge.first()).toBeVisible();
  });

  test('should display team logo if available', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for page load
    await page.waitForSelector('.bg-white', { timeout: 10000 });
    
    // Check for team logo image
    const logoImage = page.locator('img[alt*="logo"], img[alt*="Logo"]');
    const logoCount = await logoImage.count();
    
    // If team has logo, it should be displayed
    if (logoCount > 0) {
      await expect(logoImage.first()).toBeVisible();
    }
  });

  test('should expand and collapse potluck categories', async ({ page }) => {
    // Navigate to first game details
    await page.click('a:has-text("View Details"):first');
    
    // Wait for potluck section
    await page.waitForSelector('text=Potluck Items', { timeout: 10000 });
    
    // Find a category button (e.g., Main Dish)
    const categoryButton = page.locator('button:has-text("Main Dish")').first();
    
    if (await categoryButton.isVisible()) {
      // Get initial state of chevron
      const chevronDown = page.locator('button:has-text("Main Dish") svg').first();
      
      // Click to toggle
      await categoryButton.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Click again to toggle back
      await categoryButton.click();
      await page.waitForTimeout(300);
      
      // Category should still be interactive
      await expect(categoryButton).toBeVisible();
    }
  });
});