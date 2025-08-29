import { test, expect } from '@playwright/test';

test('Admin can sync UT schedule', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Navigate to admin page
  await page.locator('nav a:has-text("Admin")').click();
  await page.waitForURL('**/admin');
  
  // Verify admin page loaded
  await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
  
  // Find and click the sync button
  const syncButton = page.locator('button:has-text("Sync Schedule")');
  await expect(syncButton).toBeVisible();
  
  console.log('Clicking Sync Schedule button...');
  await syncButton.click();
  
  // Wait for success message (sync might be very fast)
  const successMessage = page.locator('text=/Successfully synced|Updated|Schedule is already up to date/');
  await expect(successMessage).toBeVisible({ timeout: 10000 });
  
  // Get the success message text
  const messageText = await successMessage.textContent();
  console.log('Sync result:', messageText);
  
  // Navigate to games page to verify games were added
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  
  // Check that we have games displayed
  const gameCards = page.locator('.card').filter({ hasText: /vs\.|@/ });
  const gameCount = await gameCards.count();
  console.log(`Found ${gameCount} games after sync`);
  
  // Verify we have at least some games
  expect(gameCount).toBeGreaterThan(0);
  
  // Check for a specific game (e.g., Texas A&M)
  const tamGame = page.locator('text=/Texas A&M/');
  await expect(tamGame).toBeVisible();
  
  console.log('✅ Schedule sync test passed!');
});

test('Sync persists games in localStorage', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Login as admin
  const isLoginPage = await page.locator('button:has-text("Sign In")').isVisible();
  if (isLoginPage) {
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  }
  
  // Check localStorage before sync
  const gamesBefore = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored) : [];
  });
  console.log(`Games before sync: ${gamesBefore.length}`);
  
  // Navigate to admin page
  await page.locator('nav a:has-text("Admin")').click();
  await page.waitForURL('**/admin');
  
  // Sync schedule
  const syncButton = page.locator('button:has-text("Sync Schedule")');
  await syncButton.click();
  
  // Wait for sync to complete
  await expect(page.locator('text=/Successfully synced|Updated|Schedule is already up to date/')).toBeVisible({ timeout: 10000 });
  
  // Check localStorage after sync
  const gamesAfter = await page.evaluate(() => {
    const stored = localStorage.getItem('texasTailgatersGames');
    return stored ? JSON.parse(stored) : [];
  });
  console.log(`Games after sync: ${gamesAfter.length}`);
  
  // Verify games were added/updated
  expect(gamesAfter.length).toBeGreaterThanOrEqual(gamesBefore.length);
  
  // Verify game structure
  if (gamesAfter.length > 0) {
    const firstGame = gamesAfter[0];
    expect(firstGame).toHaveProperty('id');
    expect(firstGame).toHaveProperty('date');
    expect(firstGame).toHaveProperty('opponent');
    expect(firstGame).toHaveProperty('isHome');
    console.log('Sample game:', firstGame);
  }
  
  // Refresh the page and verify games persist
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Navigate to games page
  await page.locator('nav a:has-text("Games")').click();
  await page.waitForURL('**/games');
  
  // Verify games are still displayed
  const gameCards = page.locator('.card').filter({ hasText: /vs\.|@/ });
  const persistedCount = await gameCards.count();
  console.log(`Games after reload: ${persistedCount}`);
  
  expect(persistedCount).toBeGreaterThan(0);
  console.log('✅ Games persist in localStorage after reload!');
});