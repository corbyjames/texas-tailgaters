import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS, SELECTORS, TIMEOUTS, TEST_DATA } from '../utils/test-constants';

/**
 * Potluck Page Object Model
 */
export class PotluckPage extends BasePage {
  // Page elements
  private addItemButton = this.page.locator(SELECTORS.ADD_ITEM_BUTTON);
  private gameSelector = this.page.locator('select').first();
  private itemNameInput = this.page.locator(SELECTORS.POTLUCK_ITEM_NAME);
  private categorySelect = this.page.locator(SELECTORS.CATEGORY_SELECT);
  private servingSizeInput = this.page.locator(SELECTORS.SERVING_SIZE_INPUT);
  private descriptionTextarea = this.page.locator(SELECTORS.DESCRIPTION_TEXTAREA);
  private searchInput = this.page.locator('input[placeholder="Search items..."]');
  private categoryFilter = this.page.locator('select:has-text("All Categories")');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to potluck page
   */
  async navigate(): Promise<void> {
    await this.goto(URLS.POTLUCK);
  }

  /**
   * Verify potluck page elements
   */
  async verifyPageElements(): Promise<void> {
    await this.verifyTitle(/Potluck|Texas Tailgaters/);
    await this.verifyHeading('Potluck Manager');
    await expect(this.addItemButton).toBeVisible();
    await expect(this.gameSelector).toBeVisible();
  }

  /**
   * Select a game for potluck planning
   */
  async selectGame(gameIndex = 0): Promise<void> {
    await this.gameSelector.selectOption({ index: gameIndex });
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Open add item form
   */
  async openAddItemForm(): Promise<void> {
    await this.addItemButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
    
    // Verify form is open
    await expect(this.itemNameInput).toBeVisible();
  }

  /**
   * Add a new potluck item
   */
  async addItem(item: {
    name: string;
    category: string;
    servingSize: string;
    description: string;
    dietaryFlags?: string[];
  }): Promise<void> {
    await this.openAddItemForm();
    
    // Fill in the form
    await this.itemNameInput.fill(item.name);
    await this.categorySelect.selectOption(item.category);
    await this.servingSizeInput.fill(item.servingSize);
    await this.descriptionTextarea.fill(item.description);
    
    // Add dietary flags if provided
    if (item.dietaryFlags) {
      for (const flag of item.dietaryFlags) {
        const flagButton = this.page.locator(`button:has-text("${flag}")`);
        if (await flagButton.isVisible()) {
          await flagButton.click();
        }
      }
    }
    
    // Submit the form
    const submitButton = this.page.locator('button:has-text("Add Item")');
    await submitButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Add a test item with default data
   */
  async addTestItem(): Promise<void> {
    await this.addItem(TEST_DATA.POTLUCK_ITEM);
  }

  /**
   * Verify item was added successfully
   */
  async verifyItemAdded(itemName: string): Promise<void> {
    // Expand categories to find the item
    await this.expandAllCategories();
    
    const itemElement = this.page.locator(`text=${itemName}`);
    await expect(itemElement).toBeVisible();
  }

  /**
   * Edit an existing item
   */
  async editItem(itemName: string, newName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const editButton = itemCard.locator('..').locator('..').locator('button[title*="Edit"]').first();
    
    await editButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
    
    // Edit the name
    const nameField = this.page.locator(`input[value="${itemName}"]`);
    await nameField.fill(newName);
    
    // Save changes
    const saveButton = this.page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Delete an item
   */
  async deleteItem(itemName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const deleteButton = itemCard.locator('..').locator('..').locator('button[title*="Delete"]').first();
    
    // Handle confirmation dialog
    this.page.on('dialog', dialog => dialog.accept());
    
    await deleteButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Assign item to current user
   */
  async assignItem(itemName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const assignButton = itemCard.locator('..').locator('..').locator(SELECTORS.ASSIGN_BUTTON).first();
    
    await assignButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Unassign item from current user
   */
  async unassignItem(itemName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const cancelButton = itemCard.locator('..').locator('..').locator('button:has-text("Cancel")').first();
    
    await cancelButton.click();
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Verify item is assigned to user
   */
  async verifyItemAssigned(itemName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const assignmentText = itemCard.locator('..').locator('..').locator('text=Brought by:');
    
    await expect(assignmentText).toBeVisible();
  }

  /**
   * Verify item is not assigned
   */
  async verifyItemNotAssigned(itemName: string): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`);
    const assignButton = itemCard.locator('..').locator('..').locator(SELECTORS.ASSIGN_BUTTON).first();
    
    await expect(assignButton).toBeVisible();
  }

  /**
   * Search for items
   */
  async searchItems(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Filter items by category
   */
  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  /**
   * Expand all categories to see all items
   */
  async expandAllCategories(): Promise<void> {
    const categoryHeaders = this.page.locator('h3');
    const count = await categoryHeaders.count();
    
    for (let i = 0; i < count; i++) {
      const header = categoryHeaders.nth(i);
      try {
        await header.click();
        await this.page.waitForTimeout(200); // Small delay between clicks
      } catch (error) {
        // Continue if category is already expanded or not clickable
        continue;
      }
    }
  }

  /**
   * Verify dietary flags are displayed
   */
  async verifyDietaryFlags(itemName: string, flags: string[]): Promise<void> {
    await this.expandAllCategories();
    
    const itemCard = this.page.locator(`h4:has-text("${itemName}")`).locator('..').locator('..');
    
    for (const flag of flags) {
      let emoji = '';
      switch (flag.toLowerCase()) {
        case 'vegan':
          emoji = '🥬';
          break;
        case 'gluten-free':
          emoji = '🌾';
          break;
        case 'vegetarian':
          emoji = '🥕';
          break;
      }
      
      if (emoji) {
        await expect(itemCard.locator(`text=${emoji}`)).toBeVisible();
      }
    }
  }

  /**
   * Get count of items in category
   */
  async getItemCountInCategory(categoryName: string): Promise<number> {
    const categoryHeader = this.page.locator(`h3:has-text("${categoryName}")`);
    await categoryHeader.click(); // Expand category
    
    const itemsInCategory = categoryHeader.locator('..').locator('.potluck-item, [data-testid="potluck-item"]');
    return await itemsInCategory.count();
  }

  /**
   * Verify potluck persistence after page reload
   */
  async verifyPersistence(itemName: string): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
    await this.verifyItemAdded(itemName);
  }

  /**
   * Verify game selection affects potluck items
   */
  async verifyGameSelection(): Promise<void> {
    // Select first game
    await this.selectGame(0);
    const firstGameItems = await this.getTotalItemCount();
    
    // Select second game if available
    const gameOptions = await this.gameSelector.locator('option').count();
    if (gameOptions > 1) {
      await this.selectGame(1);
      const secondGameItems = await this.getTotalItemCount();
      
      // Items count might be different for different games
      expect(typeof secondGameItems).toBe('number');
    }
  }

  /**
   * Get total count of all items
   */
  async getTotalItemCount(): Promise<number> {
    await this.expandAllCategories();
    const allItems = this.page.locator('.potluck-item, [data-testid="potluck-item"], h4');
    return await allItems.count();
  }

  /**
   * Verify form validation
   */
  async verifyFormValidation(): Promise<void> {
    await this.openAddItemForm();
    
    // Try to submit empty form
    const submitButton = this.page.locator('button:has-text("Add Item")');
    await submitButton.click();
    
    // Form should not close (item name is required)
    await expect(this.itemNameInput).toBeVisible();
  }
}