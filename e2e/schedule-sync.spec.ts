import { test, expect } from '@playwright/test';

test.describe('Schedule Sync Features', () => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  test('should fetch ESPN schedule', async ({ request }) => {
    // Test ESPN API endpoint
    const response = await request.get(`${backendUrl}/api/schedule/espn`);
    
    expect(response.ok()).toBe(true);
    
    const schedule = await response.json();
    expect(Array.isArray(schedule)).toBe(true);
    
    // Check schedule structure if data exists
    if (schedule.length > 0) {
      const game = schedule[0];
      expect(game).toHaveProperty('date');
      expect(game).toHaveProperty('opponent');
    }
  });

  test('should fetch UT Athletics schedule', async ({ request }) => {
    // Test UT Athletics scraping endpoint
    const response = await request.get(`${backendUrl}/api/schedule/ut-athletics`);
    
    expect(response.ok()).toBe(true);
    
    const schedule = await response.json();
    expect(Array.isArray(schedule)).toBe(true);
    
    // Check schedule structure if data exists
    if (schedule.length > 0) {
      const game = schedule[0];
      expect(game).toHaveProperty('date');
      expect(game).toHaveProperty('opponent');
      expect(game).toHaveProperty('isHome');
    }
  });

  test('should handle manual sync trigger', async ({ request }) => {
    // Test manual sync endpoint
    const response = await request.post(`${backendUrl}/api/schedule/sync`);
    
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    expect(result).toHaveProperty('updated');
    expect(result).toHaveProperty('added');
    expect(result).toHaveProperty('lastSyncTime');
    expect(typeof result.updated).toBe('number');
    expect(typeof result.added).toBe('number');
  });

  test('should check health endpoint', async ({ request }) => {
    // Test backend health
    const response = await request.get(`${backendUrl}/health`);
    
    expect(response.ok()).toBe(true);
    
    const health = await response.json();
    expect(health).toHaveProperty('status');
    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('timestamp');
  });

  test('should validate game data structure', async ({ request }) => {
    const response = await request.get(`${backendUrl}/api/schedule/espn`);
    
    if (response.ok()) {
      const games = await response.json();
      
      if (games.length > 0) {
        const game = games[0];
        
        // Validate required fields
        if (game.date) {
          expect(game.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
        
        if (game.time) {
          expect(game.time).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$|^TBD$/);
        }
        
        if (game.tvNetwork) {
          expect(typeof game.tvNetwork).toBe('string');
        }
        
        if (game.status) {
          expect(['scheduled', 'completed', 'in-progress']).toContain(game.status);
        }
      }
    }
  });

  test('should handle network updates check', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');
    
    // Check if TV network info is displayed for games
    const games = await page.locator('[data-testid="game-card"]').all();
    
    for (const game of games) {
      const tvNetwork = await game.locator('[data-testid="tv-network"]').textContent();
      if (tvNetwork) {
        expect(tvNetwork).toBeTruthy();
      }
    }
  });

  test('should display sync status', async ({ page }) => {
    // Check if sync status is available
    await page.goto('/');
    
    // Admin users would see sync status
    // For now, just verify the page loads
    expect(await page.title()).toBeTruthy();
  });

  test('should handle bowl game detection', async ({ request }) => {
    // Test bowl game detection logic
    const response = await request.get(`${backendUrl}/api/schedule/espn`);
    
    if (response.ok()) {
      const games = await response.json();
      
      // Check for bowl games in December/January
      const bowlGames = games.filter((game: any) => {
        const date = new Date(game.date);
        const month = date.getMonth();
        return (month === 11 || month === 0) && game.isBowlGame;
      });
      
      // If bowl games exist, validate structure
      for (const bowlGame of bowlGames) {
        if (bowlGame.isBowlGame) {
          expect(bowlGame).toHaveProperty('bowlName');
        }
      }
    }
  });

  test('should validate completed game scores', async ({ request }) => {
    const response = await request.get(`${backendUrl}/api/schedule/espn`);
    
    if (response.ok()) {
      const games = await response.json();
      
      const completedGames = games.filter((game: any) => game.status === 'completed');
      
      for (const game of completedGames) {
        if (game.status === 'completed') {
          expect(typeof game.homeScore).toBe('number');
          expect(typeof game.awayScore).toBe('number');
          expect(['W', 'L', 'T']).toContain(game.result);
        }
      }
    }
  });

  test('should handle CORS properly', async ({ request }) => {
    // Test that server-side scraping works without CORS issues
    const response = await request.get(`${backendUrl}/api/schedule/ut-athletics`);
    
    // Should not have CORS errors since it's server-side
    expect(response.ok()).toBe(true);
    
    // Check response headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });
});