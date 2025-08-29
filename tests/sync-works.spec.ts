import { test, expect } from '@playwright/test';

test('Sync button actually updates games', async ({ page }) => {
  // Clear localStorage first
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.removeItem('texasTailgatersGames');
  });
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Navigate to games page first to see initial state
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  
  // Count initial games (should be mock games)
  const initialGameCards = page.locator('.card').filter({ hasText: /vs\.|@/ });
  const initialCount = await initialGameCards.count();
  console.log(`Initial game count: ${initialCount}`);
  
  // Navigate to admin page
  await page.locator('nav a:has-text("Admin")').click();
  await page.waitForURL('**/admin');
  
  // Check the initial stats
  const totalGamesBeforeText = await page.locator('p:has-text("Total Games")').locator('..').locator('.text-2xl').textContent();
  console.log(`Total games before sync: ${totalGamesBeforeText}`);
  
  // Click sync button
  const syncButton = page.locator('button:has-text("Sync Schedule")');
  await syncButton.click();
  
  // Wait for success message
  const successMessage = page.locator('text=/Successfully synced|Updated|Schedule is already up to date/');
  await expect(successMessage).toBeVisible({ timeout: 10000 });
  const messageText = await successMessage.textContent();
  console.log('Sync message:', messageText);
  
  // Check if stats updated
  await page.waitForTimeout(1000); // Give it a moment to update
  const totalGamesAfterText = await page.locator('p:has-text("Total Games")').locator('..').locator('.text-2xl').textContent();
  console.log(`Total games after sync: ${totalGamesAfterText}`);
  
  // Navigate to games page to verify
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  
  // Count games after sync
  const afterGameCards = page.locator('.card').filter({ hasText: /vs\.|@/ });
  const afterCount = await afterGameCards.count();
  console.log(`Game count after sync: ${afterCount}`);
  
  // Check localStorage
  const storedGames = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored) : [];
  });
  console.log(`Games in localStorage: ${storedGames.length}`);
  
  // Verify we have more games now
  expect(storedGames.length).toBeGreaterThan(0);
  
  // Check for specific 2025 games
  const has2025Games = storedGames.some((g: any) => g.date && g.date.startsWith('2025'));
  console.log(`Has 2025 games: ${has2025Games}`);
  expect(has2025Games).toBe(true);
  
  console.log('✅ Sync button correctly updates games!');
});