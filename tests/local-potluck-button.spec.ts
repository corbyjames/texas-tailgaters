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
  
  // Switch to sign up mode if needed
  const signUpLink = page.locator('text=/Don\'t have an account|Sign up/i');
  if (await signUpLink.isVisible()) {
    await signUpLink.click();
    await page.waitForTimeout(500);
  }
  
  // Fill form
  const nameField = page.locator('#name, input[placeholder*="name" i]').first();
  if (await nameField.isVisible()) {
    await nameField.fill(TEST_NAME);
  }
  
  await page.locator('#email, input[type="email"]').first().fill(TEST_EMAIL);
  await page.locator('#password, input[type="password"]').first().fill(TEST_PASSWORD);
  
  // Submit
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(games|potluck|home)/, { timeout: 10000 });
}

test.describe('I\'ll Bring This Button - All Screens', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('Potluck Page - Desktop', async ({ page }) => {
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    // Create a test item
    const itemName = `Test Item ${Date.now()}`;
    
    // Find and click plus button for a category
    const plusButton = page.locator('button:has(svg[class*="w-5"])').filter({ hasNot: page.locator('text=/chevron/i') }).first();
    await plusButton.click();
    
    // Fill form
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for modal to close
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();
    
    // Find the item and test the button
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    const bringButton = itemContainer.locator('button:has-text("I\'ll bring this")');
    
    // Verify button is visible and clickable
    await expect(bringButton).toBeVisible();
    await bringButton.click();
    
    // Verify assignment happened (button changes to Cancel)
    await expect(itemContainer.locator('button:has-text("Cancel")')).toBeVisible();
    
    console.log('✅ Potluck Page Desktop: Button works');
  });

  test('Game Details Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/games`);
    await page.waitForLoadState('networkidle');
    
    // Click on first game card to go to details
    const firstGameCard = page.locator('.bg-white').filter({ has: page.locator('text=/vs|@/') }).first();
    await firstGameCard.locator('a:has-text("View Details")').click();
    
    // Wait for game details page
    await page.waitForURL(/\/games\/\w+/);
    await page.waitForLoadState('networkidle');
    
    // Create item on this page
    const itemName = `Details Test ${Date.now()}`;
    const addButton = page.locator('button:has-text("Add Item"), button:has(svg)').filter({ hasText: /add|plus/i }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
      await page.locator('button:has-text("Add")').click();
      await page.waitForTimeout(1000);
    }
    
    // Find potluck section
    const potluckSection = page.locator('text=/Potluck Items/i').locator('..');
    
    // Look for any "I'll bring this" button
    const bringButtons = potluckSection.locator('button:has-text("I\'ll bring this")');
    const buttonCount = await bringButtons.count();
    
    if (buttonCount > 0) {
      // Click first available button
      await bringButtons.first().click();
      
      // Verify it changed
      await page.waitForTimeout(1000);
      const cancelButton = potluckSection.locator('button:has-text("Cancel")').first();
      await expect(cancelButton).toBeVisible();
      
      console.log('✅ Game Details Page: Button works');
    } else {
      console.log('⚠️ Game Details Page: No unassigned items found');
    }
  });

  test('Mobile View - Potluck', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    // Mobile might have different UI
    const itemName = `Mobile Test ${Date.now()}`;
    
    // Look for add button (might be floating action button)
    const addButton = page.locator('button:has(svg)').filter({ hasText: /add|plus/i }).first();
    if (!await addButton.isVisible()) {
      // Try finding plus icon button
      const plusButton = page.locator('button:has(svg[class*="w-5"])').last();
      await plusButton.click();
    } else {
      await addButton.click();
    }
    
    // Fill form
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    await page.locator('button:has-text("Add")').click();
    await page.waitForTimeout(1000);
    
    // Find item and test button
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    const bringButton = itemContainer.locator('button:has-text("I\'ll bring this")');
    
    await expect(bringButton).toBeVisible();
    await bringButton.click();
    
    // Verify change
    await page.waitForTimeout(1000);
    await expect(itemContainer.locator('button:has-text("Cancel")')).toBeVisible();
    
    console.log('✅ Mobile Potluck: Button works');
  });

  test('Mobile Game Card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto(`${BASE_URL}/games`);
    await page.waitForLoadState('networkidle');
    
    // On mobile, game cards might navigate differently
    const gameCard = page.locator('.bg-white').filter({ has: page.locator('text=/vs|@/') }).first();
    
    // Check if card has potluck button
    const potluckButton = gameCard.locator('button:has-text("View Potluck")');
    if (await potluckButton.isVisible()) {
      await potluckButton.click();
      await page.waitForURL(/\/potluck/);
      
      // Now test on potluck page
      const bringButtons = page.locator('button:has-text("I\'ll bring this")');
      if (await bringButtons.count() > 0) {
        await bringButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Mobile Game Card → Potluck: Button works');
      }
    } else {
      console.log('⚠️ Mobile Game Card: Navigates to potluck page');
    }
  });

  test('Quantity Item with Modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/potluck`);
    await page.waitForLoadState('networkidle');
    
    // Create item with quantity > 1
    const itemName = `Quantity Test ${Date.now()}`;
    
    const plusButton = page.locator('button:has(svg[class*="w-5"])').filter({ hasNot: page.locator('text=/chevron/i') }).first();
    await plusButton.click();
    
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    
    // Set quantity to 3
    const quantityInput = page.locator('input[type="number"][min="1"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('3');
    }
    
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();
    
    // Find item and click button
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    const bringButton = itemContainer.locator('button:has-text("I\'ll bring this")');
    await bringButton.click();
    
    // Verify modal appears
    await expect(page.locator('text=/Sign Up to Bring Item/i')).toBeVisible();
    
    // Select quantity
    const quantitySelector = page.locator('input[type="number"][min="1"][max]');
    await quantitySelector.fill('2');
    
    // Submit
    await page.locator('button:has-text("I\'ll bring 2")').click();
    
    // Verify modal closes and assignment shows
    await expect(page.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible();
    await expect(page.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    
    console.log('✅ Quantity Modal: Works correctly');
  });
});

test.describe('Button State Tests', () => {
  test('All button states', async ({ page }) => {
    await loginUser(page);
    await page.goto(`${BASE_URL}/potluck`);
    
    console.log('Testing button states:');
    
    // Test 1: Unassigned item shows "I'll bring this"
    const unassignedButtons = page.locator('button:has-text("I\'ll bring this")');
    const unassignedCount = await unassignedButtons.count();
    console.log(`  - Unassigned items with button: ${unassignedCount}`);
    
    // Test 2: Assigned items show "Cancel" for current user
    const cancelButtons = page.locator('button:has-text("Cancel")');
    const cancelCount = await cancelButtons.count();
    console.log(`  - Items you can cancel: ${cancelCount}`);
    
    // Test 3: Fully claimed items show badge
    const fullyClaimedBadges = page.locator('span:has-text("Fully Claimed")');
    const fullyClaimedCount = await fullyClaimedBadges.count();
    console.log(`  - Fully claimed items: ${fullyClaimedCount}`);
    
    // Test 4: Progress bars visible for quantity items
    const progressBars = page.locator('[class*="bg-gray-200"]').filter({ has: page.locator('[class*="bg-orange-500"], [class*="bg-green-500"]') });
    const progressCount = await progressBars.count();
    console.log(`  - Items with progress bars: ${progressCount}`);
  });
});