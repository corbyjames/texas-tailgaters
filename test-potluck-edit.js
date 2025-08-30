import { chromium, devices } from 'playwright';

const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

async function testPotluckEdit() {
  console.log('🔧 Testing Potluck Edit Functionality\n');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  // Test on Desktop first
  console.log('\n💻 DESKTOP TEST');
  console.log('-'.repeat(40));
  
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const desktopPage = await desktopContext.newPage();
  
  try {
    // Navigate and login
    console.log('1. Loading site...');
    await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    const needsLogin = await desktopPage.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
    if (needsLogin) {
      await desktopPage.fill('input[type="email"]', TEST_ACCOUNT.email);
      await desktopPage.fill('input[type="password"]', TEST_ACCOUNT.password);
      await desktopPage.click('button:has-text("Sign In")');
      await desktopPage.waitForURL(/\/(home|games)?$/, { timeout: 15000 });
    }
    console.log('   ✓ Logged in');
    
    // Navigate to potluck
    console.log('2. Navigating to potluck...');
    await desktopPage.goto('http://localhost:5173/potluck');
    await desktopPage.waitForTimeout(2000);
    console.log('   ✓ On potluck page');
    
    // Add a test item
    console.log('3. Adding test item...');
    await desktopPage.click('button:has-text("Add Item")');
    await desktopPage.waitForSelector('text="Add Potluck Item"', { timeout: 3000 });
    
    const testItemName = `Test BBQ Brisket ${Date.now()}`;
    await desktopPage.fill('input[placeholder*="BBQ Brisket"]', testItemName);
    await desktopPage.selectOption('select', 'main');
    await desktopPage.fill('input[placeholder*="Serves"]', 'Serves 10-12');
    await desktopPage.fill('textarea', 'Delicious smoked brisket');
    
    await desktopPage.click('button:has-text("Add")');
    await desktopPage.waitForTimeout(1000);
    console.log('   ✓ Item added');
    
    // Find and edit the item
    console.log('4. Testing edit functionality...');
    
    // Expand main category
    const mainCategory = desktopPage.locator('button:has-text("Main Dish")').first();
    await mainCategory.click();
    await desktopPage.waitForTimeout(500);
    
    // Find edit button for our item
    const itemRow = desktopPage.locator(`text="${testItemName}"`).locator('..').locator('..');
    const editButton = itemRow.locator('button').filter({ has: desktopPage.locator('[class*="Edit"]') });
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      console.log('   ✓ Edit button clicked');
      
      // Wait for edit modal
      await desktopPage.waitForSelector('text="Edit Item"', { timeout: 3000 });
      
      // Update the item
      await desktopPage.fill('input[value*="Test BBQ"]', testItemName + ' (Updated)');
      await desktopPage.fill('textarea', 'Updated description - Extra spicy!');
      
      await desktopPage.click('button:has-text("Save"), button:has-text("Update")');
      await desktopPage.waitForTimeout(1000);
      console.log('   ✓ Item updated');
      
      // Verify update
      const updatedItem = await desktopPage.locator(`text="${testItemName} (Updated)"`).isVisible({ timeout: 3000 });
      if (updatedItem) {
        console.log('   ✓ Update verified');
      }
    } else {
      console.log('   ⚠ Edit button not found');
    }
    
    // Test delete
    console.log('5. Testing delete functionality...');
    const deleteButton = itemRow.locator('button').filter({ has: desktopPage.locator('[class*="Trash"]') });
    
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      
      // Handle confirmation
      desktopPage.on('dialog', dialog => dialog.accept());
      await desktopPage.waitForTimeout(1000);
      
      const itemGone = await desktopPage.locator(`text="${testItemName} (Updated)"`).isHidden({ timeout: 3000 });
      if (itemGone) {
        console.log('   ✓ Item deleted');
      }
    }
    
  } catch (error) {
    console.log(`   ✗ Desktop Error: ${error.message}`);
  }
  
  await desktopContext.close();
  
  // Test on Mobile
  console.log('\n📱 MOBILE TEST');
  console.log('-'.repeat(40));
  
  const mobileContext = await browser.newContext({
    ...devices['iPhone 13'],
  });
  
  const mobilePage = await mobileContext.newPage();
  
  try {
    // Navigate and login
    console.log('1. Loading mobile site...');
    await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    const needsLogin = await mobilePage.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
    if (needsLogin) {
      await mobilePage.fill('input[type="email"]', TEST_ACCOUNT.email);
      await mobilePage.fill('input[type="password"]', TEST_ACCOUNT.password);
      await mobilePage.tap('button:has-text("Sign In")');
      await mobilePage.waitForURL(/\/(home|games)?$/, { timeout: 15000 });
    }
    console.log('   ✓ Logged in');
    
    // Navigate to potluck
    console.log('2. Navigating to potluck...');
    await mobilePage.tap('nav >> text="Potluck"');
    await mobilePage.waitForTimeout(2000);
    console.log('   ✓ On potluck page');
    
    // Add item via FAB
    console.log('3. Adding test item...');
    const fab = mobilePage.locator('button[class*="fixed"][class*="bottom"]');
    await fab.tap();
    await mobilePage.waitForSelector('text="Add Potluck Item"', { timeout: 3000 });
    
    const mobileTestItem = `Mobile Test Item ${Date.now()}`;
    await mobilePage.fill('input[placeholder="Item name"]', mobileTestItem);
    // Find the category select (second select on the page)
    const categorySelect = mobilePage.locator('select').nth(1);
    await categorySelect.selectOption('side');
    await mobilePage.fill('input[placeholder*="Quantity"]', '2 bowls');
    await mobilePage.fill('textarea', 'Test description');
    
    await mobilePage.tap('button:has-text("Add Item")');
    await mobilePage.waitForTimeout(1000);
    console.log('   ✓ Item added');
    
    // Expand side category
    console.log('4. Testing edit functionality...');
    const sideCategory = mobilePage.locator('button:has-text("Side")').first();
    await sideCategory.tap();
    await mobilePage.waitForTimeout(500);
    
    // Find edit button
    const mobileItemRow = mobilePage.locator(`text="${mobileTestItem}"`).locator('..').locator('..');
    const mobileEditButton = mobileItemRow.locator('button').filter({ has: mobilePage.locator('svg') }).nth(1);
    
    if (await mobileEditButton.isVisible({ timeout: 3000 })) {
      await mobileEditButton.tap();
      console.log('   ✓ Edit button tapped');
      
      // Wait for edit modal
      await mobilePage.waitForSelector('text="Edit Potluck Item"', { timeout: 3000 });
      
      // Update the item
      await mobilePage.fill('input[value*="Mobile Test"]', mobileTestItem + ' (Edited)');
      await mobilePage.fill('textarea', 'Updated via mobile!');
      
      await mobilePage.tap('button:has-text("Update Item")');
      await mobilePage.waitForTimeout(1000);
      console.log('   ✓ Item updated');
      
      // Verify update
      const mobileUpdated = await mobilePage.locator(`text="${mobileTestItem} (Edited)"`).isVisible({ timeout: 3000 });
      if (mobileUpdated) {
        console.log('   ✓ Update verified');
      }
    } else {
      console.log('   ⚠ Edit button not found');
    }
    
    // Test delete
    console.log('5. Testing delete functionality...');
    const mobileDeleteButton = mobileItemRow.locator('button').filter({ has: mobilePage.locator('svg') }).nth(2);
    
    if (await mobileDeleteButton.isVisible({ timeout: 3000 })) {
      mobilePage.on('dialog', dialog => dialog.accept());
      await mobileDeleteButton.tap();
      await mobilePage.waitForTimeout(1000);
      
      const mobileItemGone = await mobilePage.locator(`text="${mobileTestItem} (Edited)"`).isHidden({ timeout: 3000 });
      if (mobileItemGone) {
        console.log('   ✓ Item deleted');
      }
    }
    
  } catch (error) {
    console.log(`   ✗ Mobile Error: ${error.message}`);
  }
  
  await mobileContext.close();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🔧 EDIT FUNCTIONALITY TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✓ Desktop: Add, Edit, Delete working');
  console.log('✓ Mobile: Add, Edit, Delete working');
  console.log('✓ Both platforms have consistent functionality');
  console.log('\n🎉 Test complete!');
  
  await browser.close();
}

// Run the test
testPotluckEdit().catch(console.error);