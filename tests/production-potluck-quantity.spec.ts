import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

const TEST_EMAIL_2 = `test2_${Date.now()}@example.com`;
const TEST_PASSWORD_2 = 'TestPassword456!';
const TEST_NAME_2 = 'Test User 2';

// Helper functions
async function loginUser(page: Page, email: string, password: string, name: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be visible
  await page.waitForSelector('form', { timeout: 10000 });
  
  // Check if we're in sign up mode or need to switch
  const signUpLink = page.locator('text=/Don\'t have an account|Sign up/i');
  const isSignUpMode = await page.locator('text=/Full Name/i').isVisible({ timeout: 1000 }).catch(() => false);
  
  if (!isSignUpMode && await signUpLink.isVisible()) {
    // Switch to sign up mode
    await signUpLink.click();
    await page.waitForTimeout(500);
  }
  
  // Now fill the form
  const nameField = page.locator('#name, input[placeholder*="name" i]').first();
  if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await nameField.fill(name);
  }
  
  await page.locator('#email, input[type="email"]').first().fill(email);
  await page.locator('#password, input[type="password"]').first().fill(password);
  
  // Submit the form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for navigation after login
  await page.waitForURL(/\/(games|potluck|home)/, { timeout: 10000 });
}

async function navigateToPotluck(page: Page) {
  // Try different ways to navigate to potluck
  const potluckLink = page.locator('a[href="/potluck"]');
  if (await potluckLink.isVisible()) {
    await potluckLink.click();
  } else {
    await page.goto('/potluck');
  }
  
  await page.waitForURL('**/potluck');
  await page.waitForLoadState('networkidle');
}

async function selectNextGame(page: Page) {
  // Select the next upcoming game or first available game
  const gameSelector = page.locator('select').first();
  if (await gameSelector.isVisible()) {
    const options = await gameSelector.locator('option').all();
    if (options.length > 0) {
      await gameSelector.selectOption({ index: 0 });
    }
  }
  await page.waitForTimeout(1000); // Wait for data to load
}

test.describe('Potluck Quantity Management - Production', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Create item with quantity and verify progress bar', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Find and click the plus button for Main Dish category
    const mainDishSection = page.locator('text=/Main.*Dish/i').first();
    const plusButton = mainDishSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    // Wait for modal to appear
    await expect(page.locator('text=/Add Potluck Item/i')).toBeVisible();

    // Fill in the form
    const itemName = `BBQ Brisket ${Date.now()}`;
    await page.fill('input[placeholder*="BBQ" i]', itemName);
    
    // Set quantity needed to 5
    const quantityInput = page.locator('input[type="number"][min="1"]');
    await quantityInput.fill('5');
    
    // Add serving info
    const servingInput = page.locator('input[placeholder*="Serves" i]');
    if (await servingInput.isVisible()) {
      await servingInput.fill('Serves 10-12');
    }

    // Submit the form
    await page.locator('button:has-text("Add Item")').click();

    // Wait for modal to close
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    // Verify the item appears with progress bar
    await expect(page.locator(`text=${itemName}`)).toBeVisible();
    
    // Check for progress indicator showing 0/5
    await expect(page.locator('text=/0.*\/.*5/').first()).toBeVisible();
    
    // Verify progress bar exists
    const progressBar = page.locator(`text=${itemName}`).locator('..').locator('..').locator('[class*="bg-gray-200"]');
    await expect(progressBar).toBeVisible();
  });

  test('Sign up for item with quantity selection', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Create an item first
    const itemName = `Test Chips ${Date.now()}`;
    
    // Click plus button for Appetizer category
    const appetizerSection = page.locator('text=/Appetizer/i').first();
    const plusButton = appetizerSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    // Fill form
    await page.fill('input[placeholder*="BBQ" i]', itemName);
    await page.locator('select').first().selectOption('appetizer');
    
    const quantityInput = page.locator('input[type="number"][min="1"]');
    await quantityInput.fill('3');
    
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    // Now sign up for the item
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    const bringButton = itemContainer.locator('button:has-text("I\'ll bring this")');
    await bringButton.click();

    // Wait for signup modal
    await expect(page.locator('text=/Sign Up to Bring Item/i')).toBeVisible();

    // Verify quantity selector is present
    const quantitySelector = page.locator('input[type="number"][min="1"][max]');
    await expect(quantitySelector).toBeVisible();
    
    // Select quantity 2
    await quantitySelector.fill('2');

    // Submit
    await page.locator('button:has-text("I\'ll bring 2")').click();

    // Wait for modal to close
    await expect(page.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible();

    // Verify the assignment appears
    await expect(page.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    
    // Verify progress updated to 2/3
    await expect(page.locator('text=/2.*\/.*3/')).toBeVisible();
  });

  test('Multiple users sign up for same item', async ({ browser }) => {
    // Create two browser contexts for two different users
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // User 1: Create item needing 4
    await loginUser(page1, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page1);
    await selectNextGame(page1);

    const itemName = `Party Drinks ${Date.now()}`;
    
    // Create item
    const drinkSection = page1.locator('text=/Drink/i').first();
    const plusButton = drinkSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    await page1.fill('input[placeholder*="BBQ" i]', itemName);
    await page1.locator('select').first().selectOption('drink');
    await page1.locator('input[type="number"][min="1"]').fill('4');
    await page1.locator('button:has-text("Add Item")').click();
    await expect(page1.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    // User 1: Sign up for 2
    const itemContainer1 = page1.locator(`text=${itemName}`).locator('../..');
    await itemContainer1.locator('button:has-text("I\'ll bring this")').click();
    await page1.locator('input[type="number"][min="1"][max]').fill('2');
    await page1.locator('button:has-text("I\'ll bring 2")').click();
    await expect(page1.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible();

    // Verify User 1 sees their assignment
    await expect(page1.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    await expect(page1.locator('text=/2.*\/.*4/')).toBeVisible();

    // User 2: Navigate and sign up for 1
    await loginUser(page2, TEST_EMAIL_2, TEST_PASSWORD_2, TEST_NAME_2);
    await navigateToPotluck(page2);
    await selectNextGame(page2);

    // Find the same item
    const itemContainer2 = page2.locator(`text=${itemName}`).locator('../..');
    await itemContainer2.locator('button:has-text("I\'ll bring this")').click();
    
    // Verify modal shows remaining quantity
    await expect(page2.locator('text=/2.*\/.*4.*claimed/i')).toBeVisible();
    
    await page2.locator('input[type="number"][min="1"][max]').fill('1');
    await page2.locator('button:has-text("I\'ll bring 1")').click();
    await expect(page2.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible();

    // User 2 should see both assignments
    await expect(page2.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    await expect(page2.locator(`text=/${TEST_NAME_2}.*bringing.*1/i`)).toBeVisible();
    await expect(page2.locator('text=/3.*\/.*4/')).toBeVisible();

    // User 1: Refresh and verify they see both assignments
    await page1.reload();
    await expect(page1.locator(`text=/${TEST_NAME}.*bringing.*2/i`)).toBeVisible();
    await expect(page1.locator(`text=/${TEST_NAME_2}.*bringing.*1/i`)).toBeVisible();
    await expect(page1.locator('text=/3.*\/.*4/')).toBeVisible();

    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('Item becomes fully claimed and disabled', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Create item needing only 1
    const itemName = `Single Cake ${Date.now()}`;
    
    const dessertSection = page.locator('text=/Dessert/i').first();
    const plusButton = dessertSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    await page.fill('input[placeholder*="BBQ" i]', itemName);
    await page.locator('select').first().selectOption('dessert');
    await page.locator('input[type="number"][min="1"]').fill('1');
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    // Sign up for the single item
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    await itemContainer.locator('button:has-text("I\'ll bring this")').click();

    // Should not show modal for single items (legacy behavior)
    // Or if it does, it should auto-select 1
    
    // Wait for assignment
    await page.waitForTimeout(2000);

    // Verify item shows as fully claimed
    const fullyClaimedBadge = itemContainer.locator('text=/Fully.*Claimed/i');
    await expect(fullyClaimedBadge).toBeVisible();

    // Verify no more signup button
    await expect(itemContainer.locator('button:has-text("I\'ll bring this")')).not.toBeVisible();
  });

  test('Edit item quantity and verify update', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Create an item
    const itemName = `Editable Salad ${Date.now()}`;
    
    const sideSection = page.locator('text=/Side/i').first();
    const plusButton = sideSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    await page.fill('input[placeholder*="BBQ" i]', itemName);
    await page.locator('select').first().selectOption('side');
    await page.locator('input[type="number"][min="1"]').fill('2');
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    // Find and click edit button
    const itemContainer = page.locator(`text=${itemName}`).locator('../..');
    const editButton = itemContainer.locator('button:has(svg[class*="w-4"])').first();
    await editButton.click();

    // Wait for edit modal
    await expect(page.locator('text=/Edit Item/i')).toBeVisible();

    // Change quantity needed to 5
    const quantityInput = page.locator('input[type="number"][min="1"]');
    await quantityInput.fill('5');

    // Save changes
    await page.locator('button:has-text("Save Changes")').click();
    await expect(page.locator('text=/Edit Item/i')).not.toBeVisible();

    // Verify the progress bar updated to show 0/5
    await expect(page.locator('text=/0.*\/.*5/')).toBeVisible();
  });

  test('Category plus button pre-populates category', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Click plus button for Main Dish
    const mainSection = page.locator('text=/Main.*Dish/i').first();
    const plusButton = mainSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    // Verify modal opens
    await expect(page.locator('text=/Add Potluck Item/i')).toBeVisible();

    // Verify category is pre-selected to 'main'
    const categorySelect = page.locator('select').first();
    const selectedValue = await categorySelect.inputValue();
    expect(selectedValue).toBe('main');

    // Close modal
    await page.locator('button:has-text("Cancel")').click();

    // Try with another category - Dessert
    const dessertSection = page.locator('text=/Dessert/i').first();
    const dessertPlusButton = dessertSection.locator('..').locator('button:has(svg)').last();
    await dessertPlusButton.click();

    // Verify category is pre-selected to 'dessert'
    const selectedValue2 = await categorySelect.inputValue();
    expect(selectedValue2).toBe('dessert');
  });

  test('Progress bar visual states', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    await selectNextGame(page);

    // Create item needing 2
    const itemName = `Visual Test ${Date.now()}`;
    
    const mainSection = page.locator('text=/Main.*Dish/i').first();
    const plusButton = mainSection.locator('..').locator('button:has(svg)').last();
    await plusButton.click();

    await page.fill('input[placeholder*="BBQ" i]', itemName);
    await page.locator('input[type="number"][min="1"]').fill('2');
    await page.locator('button:has-text("Add Item")').click();
    await expect(page.locator('text=/Add Potluck Item/i')).not.toBeVisible();

    const itemContainer = page.locator(`text=${itemName}`).locator('../..');

    // Verify initial state - gray/empty progress bar
    const progressBar = itemContainer.locator('[class*="bg-gray-200"]').first();
    await expect(progressBar).toBeVisible();

    // Sign up for 1
    await itemContainer.locator('button:has-text("I\'ll bring this")').click();
    await page.locator('input[type="number"][min="1"][max]').fill('1');
    await page.locator('button:has-text("I\'ll bring 1")').click();
    await expect(page.locator('text=/Sign Up to Bring Item/i')).not.toBeVisible();

    // Verify partial progress - orange bar
    const orangeBar = itemContainer.locator('[class*="bg-orange-500"]');
    await expect(orangeBar).toBeVisible();

    // Sign up for the remaining 1
    await itemContainer.locator('button:has-text("I\'ll bring this")').click();
    await page.locator('input[type="number"][min="1"][max]').fill('1');
    await page.locator('button:has-text("I\'ll bring 1")').click();
    
    // Verify complete progress - green bar
    const greenBar = itemContainer.locator('[class*="bg-green-500"]');
    await expect(greenBar).toBeVisible();
  });
});

test.describe('Mobile Potluck Quantity Tests', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13 size

  test('Mobile: Create and sign up for quantity item', async ({ page }) => {
    await loginUser(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    await navigateToPotluck(page);
    
    // Mobile might have different UI
    const itemName = `Mobile BBQ ${Date.now()}`;
    
    // Look for add button (might be floating action button on mobile)
    const addButton = page.locator('button:has(svg)').filter({ hasText: /add|plus/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      // Try plus button approach
      const plusButton = page.locator('button:has(svg)').last();
      await plusButton.click();
    }

    // Fill form
    await page.fill('input[placeholder*="BBQ" i], input[placeholder*="name" i]', itemName);
    
    const quantityInput = page.locator('input[type="number"][min="1"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('3');
    }
    
    await page.locator('button:has-text("Add")').click();

    // Verify item appears
    await expect(page.locator(`text=${itemName}`)).toBeVisible();
    
    // Check for mobile-optimized progress indicator
    const progressText = page.locator('text=/0.*\/.*3/');
    await expect(progressText).toBeVisible();
  });
});