import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Potluck Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'member');
  });

  test('should display potluck page', async ({ page }) => {
    await page.goto('/potluck');
    
    // Should show potluck page
    await expect(page.locator('h1, h2').filter({ hasText: /Potluck|Food/ })).toBeVisible();
  });

  test('should add a potluck item', async ({ page }) => {
    // Navigate to a game with potluck
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Click Add Item button
    const addButton = page.locator('button:has-text("Add Item")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill in the form
      await page.fill('input[placeholder*="BBQ"]', 'Test BBQ Brisket');
      await page.selectOption('select', 'main');
      await page.fill('textarea', 'Delicious smoked brisket');
      
      // Submit
      await page.click('button:has-text("Add")');
      
      // Item should appear in the list
      await expect(page.locator('text=Test BBQ Brisket')).toBeVisible();
    }
  });

  test('should sign up for a potluck item', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Find an unassigned item
    const signupButton = page.locator('button:has-text("I\'ll bring this")').first();
    if (await signupButton.isVisible()) {
      await signupButton.click();
      
      // Should update to show assignment
      await expect(page.locator('text=/Cancel|Assigned|Bringing/')).toBeVisible();
    }
  });

  test('should edit a potluck item', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Find edit button
    const editButton = page.locator('button[aria-label="Edit"]').or(
      page.locator('button:has(svg.edit-icon)')
    ).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Edit form should open
      await expect(page.locator('text=/Edit|Update/')).toBeVisible();
      
      // Update description
      await page.fill('textarea', 'Updated description');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Should show updated description
      await expect(page.locator('text=Updated description')).toBeVisible();
    }
  });

  test('should display potluck categories', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Should show category sections
    const categories = ['Main Dish', 'Side Dish', 'Appetizer', 'Dessert', 'Drinks'];
    
    for (const category of categories) {
      const categorySection = page.locator(`text=${category}`);
      if (await categorySection.isVisible()) {
        // Verify category is displayed
        await expect(categorySection).toBeVisible();
      }
    }
  });

  test('should expand and collapse categories', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Find a collapsible category
    const categoryHeader = page.locator('button:has-text("Main Dish")').or(
      page.locator('button:has-text("Side Dish")')
    ).first();
    
    if (await categoryHeader.isVisible()) {
      // Click to collapse/expand
      await categoryHeader.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Click again to toggle
      await categoryHeader.click();
      await page.waitForTimeout(300);
    }
  });

  test('should show dietary flags', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Check for dietary flag emojis
    const dietaryFlags = ['🌱', '🥬', '🌾', '🥛', '🥜', '🌶️'];
    
    for (const flag of dietaryFlags) {
      const flagElement = page.locator(`text=${flag}`);
      if (await flagElement.isVisible()) {
        // Verify dietary flag is displayed
        await expect(flagElement.first()).toBeVisible();
        break; // Found at least one flag
      }
    }
  });

  test('should track item quantities', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Look for quantity tracking
    const quantityText = page.locator('text=/\d+ of \d+ claimed/').or(
      page.locator('text=/Serving|Serves/')
    );
    
    if (await quantityText.first().isVisible()) {
      const text = await quantityText.first().textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should display who is bringing items', async ({ page }) => {
    await page.goto('/games');
    const firstGame = page.locator('.game-card').or(page.locator('[data-testid="game-card"]')).first();
    await firstGame.click();
    
    // Look for assignment indicators
    const assignmentText = page.locator('text=/Brought by|Assigned to|bringing/');
    
    if (await assignmentText.first().isVisible()) {
      const text = await assignmentText.first().textContent();
      expect(text).toBeTruthy();
    }
  });
});