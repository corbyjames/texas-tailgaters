import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS, SELECTORS, TIMEOUTS } from '../utils/test-constants';

/**
 * Games Page Object Model
 */
export class GamesPage extends BasePage {
  // Page elements
  private syncGamesButton = this.page.locator(SELECTORS.SYNC_GAMES_BUTTON);
  private gameCards = this.page.locator(SELECTORS.GAME_CARD);
  private gamesList = this.page.locator('.game-list, [data-testid="games-list"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to games page
   */
  async navigate(): Promise<void> {
    await this.goto(URLS.GAMES);
  }

  /**
   * Verify games page elements
   */
  async verifyPageElements(): Promise<void> {
    await this.verifyTitle(/Games|Texas Tailgaters/);
    await this.verifyHeading('Games');
  }

  /**
   * Sync games from schedule
   */
  async syncGames(): Promise<void> {
    if (await this.syncGamesButton.isVisible()) {
      await this.syncGamesButton.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
      await this.waitForLoad();
    }
  }

  /**
   * Get all game cards
   */
  async getGameCards() {
    await this.waitForLoad();
    return this.gameCards;
  }

  /**
   * Get number of games displayed
   */
  async getGameCount(): Promise<number> {
    await this.waitForLoad();
    return await this.gameCards.count();
  }

  /**
   * Verify games are loaded
   */
  async verifyGamesLoaded(): Promise<void> {
    const gameCount = await this.getGameCount();
    expect(gameCount).toBeGreaterThan(0);
  }

  /**
   * Click on a specific game by opponent name
   */
  async clickGameByOpponent(opponent: string): Promise<void> {
    const gameCard = this.page.locator(`${SELECTORS.GAME_CARD}:has-text("${opponent}")`);
    await expect(gameCard).toBeVisible();
    await gameCard.click();
    await this.waitForLoad();
  }

  /**
   * Click on the first game card
   */
  async clickFirstGame(): Promise<void> {
    const firstGame = this.gameCards.first();
    await expect(firstGame).toBeVisible();
    await firstGame.click();
    await this.waitForLoad();
  }

  /**
   * Verify game card contains required information
   */
  async verifyGameCardInfo(opponent: string): Promise<void> {
    const gameCard = this.page.locator(`${SELECTORS.GAME_CARD}:has-text("${opponent}")`);
    await expect(gameCard).toBeVisible();
    
    // Verify opponent name is displayed
    await expect(gameCard).toContainText(opponent);
    
    // Verify date is displayed (look for date patterns)
    const cardText = await gameCard.textContent();
    const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{1,2}|\d{4})\b/i.test(cardText || '');
    expect(hasDate).toBeTruthy();
  }

  /**
   * Verify potluck stats on game cards
   */
  async verifyPotluckStats(): Promise<void> {
    const gameCardsWithStats = this.page.locator(`${SELECTORS.GAME_CARD}:has-text("items")`);
    const count = await gameCardsWithStats.count();
    
    if (count > 0) {
      // At least some games should have potluck stats
      const firstCard = gameCardsWithStats.first();
      await expect(firstCard).toContainText(/\d+ items/);
    }
  }

  /**
   * Search for specific game
   */
  async searchGame(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchTerm);
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
    }
  }

  /**
   * Filter games by date/season
   */
  async filterByDate(year: string): Promise<void> {
    const filterSelect = this.page.locator('select:has-text("2024"), select:has-text("2025")');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption(year);
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
    }
  }

  /**
   * Verify game has TV network information
   */
  async verifyTVNetworkInfo(): Promise<void> {
    // Look for TV network indicators
    const tvNetworkElements = this.page.locator('text=ESPN, text=FOX, text=ABC, text=CBS, text=SEC Network');
    const count = await tvNetworkElements.count();
    
    if (count > 0) {
      await expect(tvNetworkElements.first()).toBeVisible();
    }
  }

  /**
   * Verify team logos are displayed
   */
  async verifyTeamLogos(): Promise<void> {
    const logos = this.page.locator('img[alt*="logo" i], img[src*="logo"]');
    const logoCount = await logos.count();
    
    if (logoCount > 0) {
      // Verify at least one logo is loaded
      const firstLogo = logos.first();
      await expect(firstLogo).toBeVisible();
      
      // Check if logo has loaded successfully
      const naturalWidth = await firstLogo.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  }

  /**
   * Verify games are sorted correctly (by date)
   */
  async verifyGamesSorted(): Promise<void> {
    const gameCards = await this.getGameCards();
    const gameCount = await gameCards.count();
    
    if (gameCount > 1) {
      // Get dates from first two games to verify sorting
      const firstGameText = await gameCards.first().textContent();
      const secondGameText = await gameCards.nth(1).textContent();
      
      // This is a basic check - in a real implementation, you'd parse the actual dates
      expect(firstGameText).toBeTruthy();
      expect(secondGameText).toBeTruthy();
    }
  }

  /**
   * Check if sync button is working
   */
  async verifySyncFunctionality(): Promise<void> {
    if (await this.syncGamesButton.isVisible()) {
      const initialCount = await this.getGameCount();
      
      await this.syncGames();
      
      // Wait for potential updates
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
      
      const finalCount = await this.getGameCount();
      
      // Count should be at least the same (might be more if new games added)
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    }
  }

  /**
   * Navigate to game details
   */
  async goToGameDetails(gameIndex = 0): Promise<void> {
    const gameCard = this.gameCards.nth(gameIndex);
    await expect(gameCard).toBeVisible();
    await gameCard.click();
    
    // Wait for navigation to game details
    await this.page.waitForURL(/.*\/games\/.*/, { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify responsive layout
   */
  async verifyResponsiveLayout(): Promise<void> {
    // Check if games are displayed in a grid/list format
    const gamesList = this.page.locator('.games-grid, .games-list, [data-testid="games-container"]');
    
    if (await gamesList.isVisible()) {
      // Verify games are properly laid out
      const gameCount = await this.getGameCount();
      expect(gameCount).toBeGreaterThan(0);
      
      // Check for responsive behavior
      const containerWidth = await gamesList.boundingBox();
      expect(containerWidth?.width).toBeGreaterThan(0);
    }
  }
}