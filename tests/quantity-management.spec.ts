import { test, expect, Page } from '@playwright/test';

// Test against local development
const BASE_URL = 'http://localhost:5173';

// Test user credentials
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

async function loginUser(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Try to find sign up link first
  const signUpLink = page.locator('text=/Don\'t have an account|Sign up/i').first();
  if (await signUpLink.isVisible({ timeout: 1000 }).catch(() => false)) {
    await signUpLink.click();
    await page.waitForTimeout(500);
  }
  
  // Fill form
  const nameField = page.locator('#name, input[placeholder*="name" i]').first();
  if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await nameField.fill(TEST_NAME);
  }
  
  await page.locator('#email, input[type="email"]').first().fill(TEST_EMAIL);
  await page.locator('#password, input[type="password"]').first().fill(TEST_PASSWORD);
  
  // Submit
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation - be more flexible with the URL
  await page.waitForURL(url => {
    const urlString = url.toString();
    return urlString.includes('/games') || urlString.includes('/potluck') || urlString.includes('/home');
  }, { timeout: 10000 });
}

test.describe('Quantity Management Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('PotluckPage - Create item with quantity and manage assignments', async ({ page }) => {
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    // Test 1: Create item with quantity > 1
    console.log('Testing: Create item with quantity tracking');
    
    // Click plus button in a category (e.g., Main Dish)
    const mainDishPlus = page.locator('button[title*="Main Dish"]').first();
    if (await mainDishPlus.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mainDishPlus.click();
    } else {
      // Fallback to general Add Item button
      await page.locator('button:has-text("Add Item")').click();
    }
    
    // Fill form with quantity
    const itemName = `Burgers ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    
    // Set quantity needed to 3
    const quantityInput = page.locator('input[type="number"][min="1"]').first();
    await quantityInput.fill('3');
    
    // Submit form
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for modal to close
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Test 2: Verify progress bar appears
    console.log('Testing: Progress bar displays correctly');
    
    const itemCard = page.locator(`text="${itemName}"`).locator('..').locator('..');
    
    // Check for progress indicator (0 of 3)
    await expect(itemCard.locator('text=/0 of 3/i')).toBeVisible();
    
    // Check for progress bar
    const progressBar = itemCard.locator('.bg-gray-200').first();
    await expect(progressBar).toBeVisible();
    
    // Test 3: Sign up to bring some quantity
    console.log('Testing: Sign up with quantity modal');
    
    const bringButton = itemCard.locator('button:has-text("I\'ll bring this")');
    await expect(bringButton).toBeVisible();
    await bringButton.click();
    
    // Modal should appear for quantity selection
    await expect(page.locator('text=/Sign Up to Bring Item/i')).toBeVisible();
    
    // Select quantity of 2
    const modalQuantityInput = page.locator('dialog input[type="number"], .fixed input[type="number"]').last();
    await modalQuantityInput.fill('2');
    
    // Submit
    await page.locator('button:has-text("I\'ll bring 2")').click();
    
    // Modal should close
    await expect(page.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Test 4: Verify assignment shows
    console.log('Testing: Assignment displays correctly');
    
    // Should show 2 of 3 now
    await expect(itemCard.locator('text=/2 of 3/i')).toBeVisible();
    
    // Should show user assignment
    await expect(itemCard.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    
    // Cancel button should be visible
    await expect(itemCard.locator('button:has-text("Cancel")')).toBeVisible();
    
    console.log('✅ PotluckPage quantity management works correctly');
  });

  test('GameDetailsPage - Create item with quantity and manage assignments', async ({ page }) => {
    // Navigate to games page first
    await page.goto(`${BASE_URL}/games`);
    await page.waitForLoadState('networkidle');
    
    // Click on first game to go to details
    const gameCard = page.locator('.bg-white').filter({ has: page.locator('text=/vs|@/') }).first();
    const detailsLink = gameCard.locator('a:has-text("View Details")');
    await detailsLink.click();
    
    // Wait for game details page
    await page.waitForURL(/\/games\/\w+/);
    await page.waitForLoadState('networkidle');
    
    console.log('Testing: GameDetailsPage quantity features');
    
    // Test 1: Click plus button in category
    const categoryPlus = page.locator('button[title*="Side Dish"]').first();
    if (await categoryPlus.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Testing: Category plus button pre-populates category');
      await categoryPlus.click();
      
      // Verify Side Dish is selected
      const categorySelect = page.locator('select').filter({ hasText: /Side Dish/i });
      await expect(categorySelect).toBeVisible();
    } else {
      // Fallback to Add Item button
      await page.locator('button:has-text("Add Item")').click();
    }
    
    // Test 2: Create item with quantity
    const itemName = `Salad ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    
    // Find and fill quantity needed field
    const quantityLabel = page.locator('label:has-text("How many needed?")');
    const quantityField = quantityLabel.locator('..').locator('input[type="number"]');
    await quantityField.fill('4');
    
    // Verify helper text changes
    await expect(page.locator('text="Multiple people can sign up"')).toBeVisible();
    
    // Submit
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for modal to close
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Test 3: Verify item shows with progress
    console.log('Testing: Progress tracking on GameDetailsPage');
    
    const itemCard = page.locator(`text="${itemName}"`).locator('..').locator('..');
    
    // Should show 0 of 4
    await expect(itemCard.locator('text=/0 of 4/i')).toBeVisible();
    
    // Progress bar should be visible
    await expect(itemCard.locator('.bg-gray-200')).toBeVisible();
    
    // Test 4: Sign up to bring quantity
    const bringButton = itemCard.locator('button:has-text("I\'ll bring this")');
    await bringButton.click();
    
    // Modal should appear
    await expect(page.locator('text=/Sign Up to Bring Item/i')).toBeVisible();
    
    // Select quantity
    const modalQuantityInput = page.locator('dialog input[type="number"], .fixed input[type="number"]').last();
    await modalQuantityInput.fill('3');
    
    // Submit
    await page.locator('button:has-text("I\'ll bring 3")').click();
    
    // Verify updates
    await expect(page.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible({ timeout: 5000 });
    await expect(itemCard.locator('text=/3 of 4/i')).toBeVisible();
    await expect(itemCard.locator(`text=/${TEST_NAME}.*bringing.*3/i`)).toBeVisible();
    
    console.log('✅ GameDetailsPage quantity management works correctly');
  });

  test('Edit item quantity and verify updates', async ({ page }) => {
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    console.log('Testing: Edit item to change quantity needed');
    
    // Create an item first
    await page.locator('button:has-text("Add Item")').click();
    const itemName = `Pizza ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    await page.locator('input[type="number"][min="1"]').first().fill('2');
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Find and edit the item
    const itemCard = page.locator(`text="${itemName}"`).locator('..').locator('..');
    const editButton = itemCard.locator('button').filter({ has: page.locator('svg') }).nth(1); // Edit icon button
    await editButton.click();
    
    // Change quantity needed to 5
    const quantityInput = page.locator('input[type="number"][min="1"]').first();
    await quantityInput.fill('5');
    
    // Save changes
    await page.locator('button:has-text("Save Changes")').click();
    await expect(page.locator('text=/Edit Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Verify the quantity updated
    await expect(itemCard.locator('text=/0 of 5/i')).toBeVisible();
    
    console.log('✅ Edit quantity feature works correctly');
  });

  test('Fully claimed badge appears when quantity reached', async ({ page }) => {
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    console.log('Testing: Fully claimed badge functionality');
    
    // Create item with quantity of 1
    await page.locator('button:has-text("Add Item")').click();
    const itemName = `Chips ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    await page.locator('input[type="number"][min="1"]').first().fill('1');
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible({ timeout: 5000 });
    
    // Sign up for the full quantity
    const itemCard = page.locator(`text="${itemName}"`).locator('..').locator('..');
    await itemCard.locator('button:has-text("I\'ll bring this")').click();
    
    // Wait for assignment to complete
    await page.waitForTimeout(1000);
    
    // For single items, should show assigned user
    await expect(itemCard.locator('text=/Brought by/i')).toBeVisible();
    
    // Cancel button should be visible for the user who signed up
    await expect(itemCard.locator('button:has-text("Cancel")')).toBeVisible();
    
    console.log('✅ Single item assignment works correctly');
  });

  test('Mobile viewport - quantity features work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    console.log('Testing: Mobile viewport quantity management');
    
    // Add item with quantity on mobile
    const addButton = page.locator('button:has-text("Add Item"), button:has(svg)').filter({ hasText: /add|plus/i }).first();
    await addButton.click();
    
    const itemName = `Mobile Item ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    await page.locator('input[type="number"][min="1"]').first().fill('2');
    await page.locator('button:has-text("Add")').click();
    await page.waitForTimeout(1000);
    
    // Find item and test quantity features
    const itemCard = page.locator(`text="${itemName}"`).locator('..').locator('..');
    
    // Progress should be visible
    await expect(itemCard.locator('text=/0 of 2/i')).toBeVisible();
    
    // Button should work
    await itemCard.locator('button:has-text("I\'ll bring this")').click();
    
    // Modal should appear on mobile too
    await expect(page.locator('text=/Sign Up to Bring Item/i')).toBeVisible();
    
    console.log('✅ Mobile quantity features work correctly');
  });
});

test.describe('Category Plus Button Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('Category plus buttons pre-populate category on both pages', async ({ page }) => {
    // Test on PotluckPage
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    console.log('Testing: PotluckPage category plus buttons');
    
    const categories = ['Main Dish', 'Side Dish', 'Dessert'];
    
    for (const category of categories) {
      const plusButton = page.locator(`button[title*="${category}"]`).first();
      if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await plusButton.click();
        
        // Verify category is selected
        const selectedOption = page.locator('select option:checked');
        await expect(selectedOption).toContainText(category);
        
        // Close modal
        await page.locator('button:has-text("Cancel")').click();
        await page.waitForTimeout(500);
        
        console.log(`  ✓ ${category} plus button works`);
      }
    }
    
    // Test on GameDetailsPage
    await page.goto(`${BASE_URL}/games`);
    await page.waitForLoadState('networkidle');
    
    const gameCard = page.locator('.bg-white').filter({ has: page.locator('text=/vs|@/') }).first();
    await gameCard.locator('a:has-text("View Details")').click();
    await page.waitForURL(/\/games\/\w+/);
    
    console.log('Testing: GameDetailsPage category plus buttons');
    
    for (const category of categories) {
      const plusButton = page.locator(`button[title*="${category}"]`).first();
      if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await plusButton.click();
        
        // Verify category is selected
        const selectedOption = page.locator('select option:checked');
        await expect(selectedOption).toContainText(category);
        
        // Close modal
        await page.locator('button:has-text("Cancel")').click();
        await page.waitForTimeout(500);
        
        console.log(`  ✓ ${category} plus button works`);
      }
    }
  });
});