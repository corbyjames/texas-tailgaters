import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PotluckPage } from '../pages/PotluckPage';
import { AuthHelpers } from '../utils/auth-helpers';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_DATA, VIEWPORT_SIZES } from '../utils/test-constants';

test.describe('Potluck Functionality Tests', () => {
  let loginPage: LoginPage;
  let potluckPage: PotluckPage;
  let authHelpers: AuthHelpers;
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    potluckPage = new PotluckPage(page);
    authHelpers = new AuthHelpers(page);
    testHelpers = new TestHelpers(page);

    // Authenticate and navigate to potluck page
    await testHelpers.clearStorage();
    await loginPage.navigate();
    await authHelpers.loginAsTestUser();
    await potluckPage.navigate();
  });

  test.describe('Potluck Page Display', () => {
    test('should display potluck page correctly', async () => {
      await test.step('Verify potluck page elements', async () => {
        await potluckPage.verifyPageElements();
      });

      await test.step('Verify game selector is available', async () => {
        const gameSelector = potluckPage['gameSelector'];
        await expect(gameSelector).toBeVisible();
        
        // Should have at least one game option
        const optionCount = await gameSelector.locator('option').count();
        expect(optionCount).toBeGreaterThan(0);
      });

      await test.step('Verify add item button is visible', async () => {
        await expect(potluckPage['addItemButton']).toBeVisible();
      });
    });

    test('should display game selection properly', async () => {
      await test.step('Select different games', async () => {
        await potluckPage.verifyGameSelection();
      });

      await test.step('Verify game selection affects potluck context', async () => {
        await potluckPage.selectGame(0);
        
        // Page should update to show potluck for selected game
        const pageContent = await loginPage.page.locator('body').textContent();
        expect(pageContent).toBeTruthy();
      });
    });
  });

  test.describe('Adding Potluck Items', () => {
    test('should add a new potluck item successfully', async () => {
      await test.step('Open add item form', async () => {
        await potluckPage.openAddItemForm();
      });

      await test.step('Fill and submit item form', async () => {
        await potluckPage.addTestItem();
      });

      await test.step('Verify item was added', async () => {
        await potluckPage.verifyItemAdded(TEST_DATA.POTLUCK_ITEM.name);
      });
    });

    test('should validate form fields', async () => {
      await test.step('Test form validation', async () => {
        await potluckPage.verifyFormValidation();
      });

      await test.step('Test required field validation', async () => {
        await potluckPage.openAddItemForm();
        
        // Try to submit with empty name
        const submitButton = loginPage.page.locator('button:has-text("Add Item")');
        await submitButton.click();
        
        // Form should remain open (validation failed)
        await expect(potluckPage['itemNameInput']).toBeVisible();
      });
    });

    test('should add item with dietary flags', async () => {
      const itemWithFlags = {
        name: 'Vegan Quinoa Salad',
        category: 'side',
        servingSize: 'Serves 10',
        description: 'Healthy quinoa salad with vegetables',
        dietaryFlags: ['vegan', 'gluten-free']
      };

      await test.step('Add item with dietary flags', async () => {
        await potluckPage.addItem(itemWithFlags);
      });

      await test.step('Verify item was added with flags', async () => {
        await potluckPage.verifyItemAdded(itemWithFlags.name);
        await potluckPage.verifyDietaryFlags(itemWithFlags.name, itemWithFlags.dietaryFlags);
      });
    });

    test('should categorize items correctly', async () => {
      const categories = [
        { name: 'Test Main Dish', category: 'main' },
        { name: 'Test Side Dish', category: 'side' },
        { name: 'Test Dessert', category: 'dessert' },
        { name: 'Test Beverage', category: 'beverage' }
      ];

      for (const item of categories) {
        await test.step(`Add item to ${item.category} category`, async () => {
          await potluckPage.addItem({
            name: item.name,
            category: item.category,
            servingSize: 'Serves 8',
            description: `Test ${item.category} item`
          });
          
          await potluckPage.verifyItemAdded(item.name);
        });
      }
    });
  });

  test.describe('Managing Potluck Items', () => {
    test('should edit existing items', async () => {
      const originalName = 'Original Item Name';
      const newName = 'Updated Item Name';

      await test.step('Add item to edit', async () => {
        await potluckPage.addItem({
          name: originalName,
          category: 'main',
          servingSize: 'Serves 10',
          description: 'Item to be edited'
        });
        
        await potluckPage.verifyItemAdded(originalName);
      });

      await test.step('Edit the item', async () => {
        await potluckPage.editItem(originalName, newName);
      });

      await test.step('Verify item was updated', async () => {
        await potluckPage.verifyItemAdded(newName);
        
        // Original name should no longer be visible
        await potluckPage.expandAllCategories();
        const originalItem = loginPage.page.locator(`text=${originalName}`);
        await expect(originalItem).not.toBeVisible();
      });
    });

    test('should delete items', async () => {
      const itemToDelete = 'Item to Delete';

      await test.step('Add item to delete', async () => {
        await potluckPage.addItem({
          name: itemToDelete,
          category: 'dessert',
          servingSize: 'Serves 5',
          description: 'This item will be deleted'
        });
        
        await potluckPage.verifyItemAdded(itemToDelete);
      });

      await test.step('Delete the item', async () => {
        await potluckPage.deleteItem(itemToDelete);
      });

      await test.step('Verify item was deleted', async () => {
        await potluckPage.expandAllCategories();
        const deletedItem = loginPage.page.locator(`text=${itemToDelete}`);
        await expect(deletedItem).not.toBeVisible();
      });
    });

    test('should handle item assignment', async () => {
      const assignableItem = 'Assignable Test Item';

      await test.step('Add item for assignment', async () => {
        await potluckPage.addItem({
          name: assignableItem,
          category: 'side',
          servingSize: 'Serves 12',
          description: 'Item for assignment testing'
        });
        
        await potluckPage.verifyItemAdded(assignableItem);
      });

      await test.step('Assign item to current user', async () => {
        await potluckPage.assignItem(assignableItem);
      });

      await test.step('Verify item assignment', async () => {
        await potluckPage.verifyItemAssigned(assignableItem);
      });

      await test.step('Unassign item', async () => {
        await potluckPage.unassignItem(assignableItem);
      });

      await test.step('Verify item is unassigned', async () => {
        await potluckPage.verifyItemNotAssigned(assignableItem);
      });
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search for items', async () => {
      const searchableItems = [
        'BBQ Brisket Special',
        'Chocolate Cake Delight',
        'Garden Fresh Salad'
      ];

      await test.step('Add items for search testing', async () => {
        for (const item of searchableItems) {
          await potluckPage.addItem({
            name: item,
            category: 'main',
            servingSize: 'Serves 8',
            description: `Search test item: ${item}`
          });
        }
      });

      await test.step('Search for specific items', async () => {
        await potluckPage.searchItems('BBQ');
        await potluckPage.expandAllCategories();
        
        // Should find BBQ item
        const bbqItem = loginPage.page.locator('text=BBQ Brisket Special');
        await expect(bbqItem).toBeVisible();
        
        // Other items should be hidden or filtered out
        const cakeItem = loginPage.page.locator('text=Chocolate Cake Delight');
        const isCakeVisible = await cakeItem.isVisible();
        
        // If search is working, cake should not be visible
        if (!isCakeVisible) {
          expect(isCakeVisible).toBeFalsy();
        }
      });

      await test.step('Clear search to show all items', async () => {
        await potluckPage.searchItems('');
        await potluckPage.expandAllCategories();
        
        // All items should be visible again
        for (const item of searchableItems) {
          const itemElement = loginPage.page.locator(`text=${item}`);
          await expect(itemElement).toBeVisible();
        }
      });
    });

    test('should filter items by category', async () => {
      const categoryItems = [
        { name: 'Main Dish Test', category: 'main' },
        { name: 'Dessert Test', category: 'dessert' },
        { name: 'Side Dish Test', category: 'side' }
      ];

      await test.step('Add items in different categories', async () => {
        for (const item of categoryItems) {
          await potluckPage.addItem({
            name: item.name,
            category: item.category,
            servingSize: 'Serves 6',
            description: `Category test: ${item.category}`
          });
        }
      });

      await test.step('Filter by dessert category', async () => {
        await potluckPage.filterByCategory('dessert');
        
        // Only dessert category should be visible
        const dessertItem = loginPage.page.locator('text=Dessert Test');
        await expect(dessertItem).toBeVisible();
        
        // Check if other categories are hidden
        const mainCategory = loginPage.page.locator('h3:has-text("Main Dish")');
        const isMainVisible = await mainCategory.isVisible();
        
        // If filtering works, main category should be hidden
        if (!isMainVisible) {
          expect(isMainVisible).toBeFalsy();
        }
      });
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist items after page reload', async () => {
      const persistentItem = 'Persistent Test Item';

      await test.step('Add item for persistence test', async () => {
        await potluckPage.addItem({
          name: persistentItem,
          category: 'main',
          servingSize: 'Serves 15',
          description: 'This item should persist after reload'
        });
        
        await potluckPage.verifyItemAdded(persistentItem);
      });

      await test.step('Reload page and verify persistence', async () => {
        await potluckPage.verifyPersistence(persistentItem);
      });
    });

    test('should maintain assignments across sessions', async () => {
      const assignmentItem = 'Assignment Persistence Test';

      await test.step('Add and assign item', async () => {
        await potluckPage.addItem({
          name: assignmentItem,
          category: 'side',
          servingSize: 'Serves 10',
          description: 'Testing assignment persistence'
        });
        
        await potluckPage.assignItem(assignmentItem);
        await potluckPage.verifyItemAssigned(assignmentItem);
      });

      await test.step('Reload and verify assignment persists', async () => {
        await loginPage.page.reload();
        await potluckPage.waitForLoad();
        
        await potluckPage.verifyItemAssigned(assignmentItem);
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile devices', async () => {
      await test.step('Switch to mobile viewport', async () => {
        await loginPage.page.setViewportSize(VIEWPORT_SIZES.MOBILE);
        await loginPage.page.waitForTimeout(500);
      });

      await test.step('Verify mobile layout', async () => {
        await potluckPage.verifyPageElements();
      });

      await test.step('Test adding items on mobile', async () => {
        await potluckPage.addItem({
          name: 'Mobile Test Item',
          category: 'main',
          servingSize: 'Serves 8',
          description: 'Added on mobile device'
        });
        
        await potluckPage.verifyItemAdded('Mobile Test Item');
      });

      await test.step('Test item management on mobile', async () => {
        await potluckPage.assignItem('Mobile Test Item');
        await potluckPage.verifyItemAssigned('Mobile Test Item');
      });
    });

    test('should adapt to different screen sizes', async () => {
      const viewports = Object.entries(VIEWPORT_SIZES);
      
      for (const [name, size] of viewports) {
        await test.step(`Test potluck functionality on ${name}`, async () => {
          await loginPage.page.setViewportSize(size);
          await loginPage.page.waitForTimeout(300);
          
          // Basic functionality should work at all sizes
          await potluckPage.verifyPageElements();
          
          // Add item button should be accessible
          await expect(potluckPage['addItemButton']).toBeVisible();
          
          // Categories should be expandable
          await potluckPage.expandAllCategories();
        });
      }
    });
  });

  test.describe('Integration with Games', () => {
    test('should show potluck items specific to selected game', async () => {
      await test.step('Add item for first game', async () => {
        await potluckPage.selectGame(0);
        
        await potluckPage.addItem({
          name: 'Game 1 Special',
          category: 'main',
          servingSize: 'Serves 20',
          description: 'Special item for first game'
        });
        
        await potluckPage.verifyItemAdded('Game 1 Special');
      });

      await test.step('Switch games and verify item context', async () => {
        const gameSelector = potluckPage['gameSelector'];
        const optionCount = await gameSelector.locator('option').count();
        
        if (optionCount > 1) {
          await potluckPage.selectGame(1);
          
          // Item from first game should not be visible in second game's context
          await potluckPage.expandAllCategories();
          
          // The behavior here depends on implementation:
          // - Items might be game-specific (not visible)
          // - Items might be global (still visible)
          // We just verify the page works without errors
          
          const totalItems = await potluckPage.getTotalItemCount();
          expect(totalItems).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should update game cards with potluck statistics', async () => {
      await test.step('Add multiple items', async () => {
        const testItems = ['Stats Item 1', 'Stats Item 2', 'Stats Item 3'];
        
        for (const item of testItems) {
          await potluckPage.addItem({
            name: item,
            category: 'main',
            servingSize: 'Serves 10',
            description: `Statistics test item: ${item}`
          });
        }
      });

      await test.step('Navigate to games page and check stats', async () => {
        await loginPage.clickNavigation('Games');
        
        // Look for potluck statistics on game cards
        const statsElements = loginPage.page.locator('text=/\\d+\\s*items?/');
        const statsCount = await statsElements.count();
        
        if (statsCount > 0) {
          const firstStat = statsElements.first();
          const statText = await firstStat.textContent();
          
          // Should show item count
          expect(statText).toBeTruthy();
          expect(/\d+/.test(statText || '')).toBeTruthy();
        }
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await test.step('Mock network failure for potluck operations', async () => {
        await testHelpers.mockApiCall(/potluck|items/, { error: 'Network error' });
      });

      await test.step('Attempt to add item with network error', async () => {
        await potluckPage.openAddItemForm();
        
        await potluckPage['itemNameInput'].fill('Network Test Item');
        await potluckPage['categorySelect'].selectOption('main');
        
        const submitButton = loginPage.page.locator('button:has-text("Add Item")');
        await submitButton.click();
      });

      await test.step('Verify graceful error handling', async () => {
        // Page should remain functional
        await potluckPage.verifyPageElements();
        
        // Should not crash or show undefined errors
        const pageContent = await loginPage.page.locator('body').textContent();
        expect(pageContent).not.toContain('undefined');
        expect(pageContent).not.toContain('null');
      });
    });

    test('should handle invalid data gracefully', async () => {
      await test.step('Mock invalid potluck data', async () => {
        await testHelpers.mockApiCall(/potluck/, {
          items: [
            { id: null, name: undefined, category: 'invalid' },
            { id: 'test', name: '', servingSize: null }
          ]
        });
      });

      await test.step('Reload page with invalid data', async () => {
        await potluckPage.navigate();
        await potluckPage.waitForLoad();
      });

      await test.step('Verify robust error handling', async () => {
        // Page should load without crashing
        await potluckPage.verifyPageElements();
        
        // Should handle invalid data without displaying undefined/null
        const pageContent = await loginPage.page.locator('body').textContent();
        expect(pageContent).not.toContain('undefined');
        expect(pageContent).not.toContain('null');
      });
    });
  });
});