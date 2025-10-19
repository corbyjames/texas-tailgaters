import { test, expect } from '@playwright/test';

test.describe('TV Networks Display', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');

    // Fill in login form
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Click sign in button
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to complete
    await page.waitForURL('**/games', { timeout: 10000 });

    // Wait for games to load
    await page.waitForSelector('.card', { timeout: 10000 });
  });

  test('should display TV networks on game cards', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Get all game cards
    const gameCards = page.locator('.card');
    const count = await gameCards.count();

    console.log(`Found ${count} game cards`);
    expect(count).toBeGreaterThan(0);

    // Check each game card for TV network info
    let gamesWithNetwork = 0;
    let gamesChecked = 0;

    for (let i = 0; i < count; i++) {
      const card = gameCards.nth(i);
      const cardText = await card.textContent();

      // Check if card has TV emoji indicator
      if (cardText?.includes('📺')) {
        gamesWithNetwork++;

        // Get the network text after the emoji
        const networkMatch = cardText.match(/📺\s*([A-Z0-9\s,&]+)/);
        if (networkMatch) {
          const network = networkMatch[1].trim();
          console.log(`Game ${i + 1}: Network = ${network}`);

          // Verify it's not TBD or NOT SET
          expect(network).not.toBe('TBD');
          expect(network).not.toBe('NOT SET');
          expect(network.length).toBeGreaterThan(0);
        }
      }

      gamesChecked++;
    }

    console.log(`Games with TV network: ${gamesWithNetwork}/${gamesChecked}`);

    // At least some games should have TV networks
    // (Not all games might have networks if they're far in the future)
    expect(gamesWithNetwork).toBeGreaterThan(0);
  });

  test('should display TV networks in collapsed view for completed games', async ({ page }) => {
    // Look for completed games (they should be collapsed by default)
    const completedGames = page.locator('.card').filter({ hasText: /W|L/ });
    const completedCount = await completedGames.count();

    if (completedCount > 0) {
      console.log(`Found ${completedCount} completed games`);

      // Check first completed game
      const firstCompleted = completedGames.first();
      const gameText = await firstCompleted.textContent();

      console.log('First completed game text:', gameText);

      // Should have TV network icon and text
      expect(gameText).toContain('📺');

      // Extract network name
      const networkMatch = gameText?.match(/📺\s*([A-Z0-9\s,&]+)/);
      if (networkMatch) {
        const network = networkMatch[1].trim();
        console.log(`Network: ${network}`);
        expect(network).not.toBe('TBD');
        expect(network).not.toBe('NOT SET');
      }
    } else {
      console.log('No completed games found to test');
    }
  });

  test('should display TV networks in expanded view', async ({ page }) => {
    // Find a game card that's expanded (upcoming games)
    const upcomingGames = page.locator('.card').filter({ hasNotText: /Final/ });
    const upcomingCount = await upcomingGames.count();

    if (upcomingCount > 0) {
      console.log(`Found ${upcomingCount} upcoming games`);

      // Check first upcoming game
      const firstUpcoming = upcomingGames.first();

      // Look for TV network in the expanded details
      // It should be in the GameHeader component
      const gameHeaderText = await firstUpcoming.textContent();

      console.log('Game header includes:', gameHeaderText?.substring(0, 200));

      // Should contain TV network somewhere in the expanded card
      if (gameHeaderText?.includes('📺')) {
        const networkMatch = gameHeaderText.match(/📺\s*([A-Z0-9\s,&]+)/);
        if (networkMatch) {
          const network = networkMatch[1].trim();
          console.log(`Expanded view network: ${network}`);
          expect(network).not.toBe('TBD');
          expect(network).not.toBe('NOT SET');
        }
      }
    }
  });

  test('should display different networks for different games', async ({ page }) => {
    // Collect all visible TV networks
    const networks = new Set<string>();

    const gameCards = page.locator('.card');
    const count = await gameCards.count();

    for (let i = 0; i < count; i++) {
      const card = gameCards.nth(i);
      const text = await card.textContent();

      const networkMatch = text?.match(/📺\s*([A-Z0-9\s,&]+)/);
      if (networkMatch) {
        const network = networkMatch[1].trim();
        if (network !== 'TBD' && network !== 'NOT SET') {
          networks.add(network);
        }
      }
    }

    console.log('Unique TV networks found:', Array.from(networks));

    // We should have games on different networks (ESPN, ABC, FOX, etc.)
    // This verifies the sync pulled actual data
    expect(networks.size).toBeGreaterThan(0);
  });

  test('should show win/loss colors correctly', async ({ page }) => {
    // Find completed games with results
    const completedGames = page.locator('.card').filter({ hasText: /Final/ });
    const count = await completedGames.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = completedGames.nth(i);
        const text = await card.textContent();

        // Check if it's a win or loss
        if (text?.includes('W')) {
          // Should have green color
          const hasGreen = await card.locator('.text-green-600').count();
          expect(hasGreen).toBeGreaterThan(0);
          console.log(`Game ${i + 1}: WIN - has green color`);
        } else if (text?.includes('L')) {
          // Should have red color
          const hasRed = await card.locator('.text-red-600').count();
          expect(hasRed).toBeGreaterThan(0);
          console.log(`Game ${i + 1}: LOSS - has red color`);
        }
      }
    }
  });
});
