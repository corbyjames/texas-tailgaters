import { test, expect } from '@playwright/test';

test.describe('Potluck Management Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:5173/login');
    
    // Login as test user
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('http://localhost:5173/');
  });

  test('should navigate to potluck page', async ({ page }) => {
    // Click on Potluck link
    await page.click('text=Potluck');
    
    // Verify we're on the potluck page
    await expect(page).toHaveURL('http://localhost:5173/potluck');
    await expect(page.locator('h1')).toContainText('Potluck Manager');
  });

  test('should display game selector', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Check that game selector is present
    const gameSelector = page.locator('select').first();
    await expect(gameSelector).toBeVisible();
    
    // Should have games available
    const options = await gameSelector.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('should add a new potluck item', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Click Add Item button
    await page.click('button:has-text("Add Item")');
    
    // Fill in the form
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Test BBQ Brisket');
    await page.selectOption('select', 'main');
    await page.fill('input[placeholder*="Serves"]', 'Serves 15-20');
    await page.fill('textarea', 'Slow smoked brisket with homemade BBQ sauce');
    
    // Select dietary flags
    await page.click('button:has-text("Gluten-Free")');
    
    // Submit the form
    await page.click('button:has-text("Add Item")');
    
    // Verify item was added
    await expect(page.locator('text=Test BBQ Brisket')).toBeVisible();
    await expect(page.locator('text=Serves 15-20')).toBeVisible();
  });

  test('should edit an existing potluck item', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // First add an item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Original Item');
    await page.click('button:has-text("Add Item")');
    
    // Wait for item to appear
    await expect(page.locator('text=Original Item')).toBeVisible();
    
    // Click edit button for the item
    await page.locator('h4:has-text("Original Item")').locator('..').locator('..').locator('button[title*="Edit"]').first().click();
    
    // Edit the item
    await page.fill('input[value="Original Item"]', 'Edited Item');
    await page.fill('input[placeholder*="Serves"]', 'Serves 25');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify item was updated
    await expect(page.locator('text=Edited Item')).toBeVisible();
    await expect(page.locator('text=Serves 25')).toBeVisible();
  });

  test('should delete a potluck item', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add an item first
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Item to Delete');
    await page.click('button:has-text("Add Item")');
    
    // Wait for item to appear
    await expect(page.locator('text=Item to Delete')).toBeVisible();
    
    // Click delete button
    page.on('dialog', dialog => dialog.accept()); // Auto-accept confirmation
    await page.locator('h4:has-text("Item to Delete")').locator('..').locator('..').locator('button[title*="Delete"]').first().click();
    
    // Verify item was deleted
    await expect(page.locator('text=Item to Delete')).not.toBeVisible();
  });

  test('should assign item to current user', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add an item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Unassigned Item');
    await page.click('button:has-text("Add Item")');
    
    // Click "I'll bring this" button
    await page.click('button:has-text("I\'ll bring this")');
    
    // Verify item shows as assigned
    await expect(page.locator('text=Brought by:')).toBeVisible();
    
    // Button should change to "Cancel"
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should unassign item from user', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add and assign an item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Assigned Item');
    await page.click('button:has-text("Add Item")');
    await page.click('button:has-text("I\'ll bring this")');
    
    // Click Cancel to unassign
    await page.click('button:has-text("Cancel")');
    
    // Verify item is unassigned
    await expect(page.locator('button:has-text("I\'ll bring this")')).toBeVisible();
    await expect(page.locator('text=Brought by:')).not.toBeVisible();
  });

  test('should filter items by category', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add items in different categories
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Main Dish Item');
    await page.selectOption('select', 'main');
    await page.click('button:has-text("Add Item")');
    
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Dessert Item');
    await page.selectOption('select', 'dessert');
    await page.click('button:has-text("Add Item")');
    
    // Expand Main Dish category
    await page.click('h3:has-text("Main Dish")');
    await expect(page.locator('text=Main Dish Item')).toBeVisible();
    
    // Filter by category
    await page.selectOption('select:has-text("All Categories")', 'dessert');
    
    // Only dessert category should be visible
    await expect(page.locator('h3:has-text("Dessert")')).toBeVisible();
    await expect(page.locator('h3:has-text("Main Dish")')).not.toBeVisible();
  });

  test('should search for items', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add multiple items
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'BBQ Brisket');
    await page.click('button:has-text("Add Item")');
    
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Potato Salad');
    await page.click('button:has-text("Add Item")');
    
    // Search for BBQ
    await page.fill('input[placeholder="Search items..."]', 'BBQ');
    
    // Expand categories to see results
    await page.click('h3:has-text("Other")');
    
    // Should only show BBQ item
    await expect(page.locator('text=BBQ Brisket')).toBeVisible();
    await expect(page.locator('text=Potato Salad')).not.toBeVisible();
  });

  test('should display potluck stats on game cards', async ({ page }) => {
    // Add some potluck items first
    await page.goto('http://localhost:5173/potluck');
    
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Test Item 1');
    await page.click('button:has-text("Add Item")');
    
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Test Item 2');
    await page.click('button:has-text("Add Item")');
    
    // Assign one item
    await page.locator('button:has-text("I\'ll bring this")').first().click();
    
    // Navigate to games page
    await page.click('text=Games');
    await page.waitForURL('http://localhost:5173/games');
    
    // Check that potluck stats are displayed on game cards
    await expect(page.locator('text=2 items').first()).toBeVisible();
    await expect(page.locator('text=1 assigned').first()).toBeVisible();
  });

  test('should show dietary flags', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add item with dietary flags
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Vegan Salad');
    await page.click('button:has-text("Vegan")');
    await page.click('button:has-text("Gluten-Free")');
    await page.click('button:has-text("Add Item")');
    
    // Expand category to see item
    await page.click('h3:has-text("Other")');
    
    // Verify dietary flags are displayed (as emojis)
    await expect(page.locator('text=🥬')).toBeVisible(); // Vegan emoji
    await expect(page.locator('text=🌾')).toBeVisible(); // Gluten-free emoji
  });

  test('should persist items after page reload', async ({ page }) => {
    await page.goto('http://localhost:5173/potluck');
    
    // Add an item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="BBQ Brisket"]', 'Persistent Item');
    await page.click('button:has-text("Add Item")');
    
    // Reload the page
    await page.reload();
    
    // Expand category
    await page.click('h3:has-text("Other")');
    
    // Item should still be there
    await expect(page.locator('text=Persistent Item')).toBeVisible();
  });
});