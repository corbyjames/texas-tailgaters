import { test, expect } from '@playwright/test';

test.describe('Debug Sync Schedule', () => {
  test('diagnose sync schedule failures', async ({ page }) => {
    // Enable console logging to capture errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('sync') || response.url().includes('schedule')) {
        console.log(`API Response: ${response.url()} - Status: ${response.status()}`);
      }
    });

    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });

    // Navigate to login page
    await page.goto('http://localhost:5174/login');
    
    // Login with test account
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await page.waitForURL('http://localhost:5174/', { timeout: 10000 });
    
    // Navigate to games page
    await page.goto('http://localhost:5174/games');
    await page.waitForLoadState('networkidle');
    
    // Look for sync button
    const syncButton = page.locator('button:has-text("Sync Schedule")').first();
    await expect(syncButton).toBeVisible({ timeout: 5000 });
    
    console.log('Found sync button, clicking...');
    
    // Set up response interceptor for sync endpoint
    const syncResponsePromise = page.waitForResponse(
      response => response.url().includes('utexassports.com') || 
                 response.url().includes('sync') || 
                 response.url().includes('schedule'),
      { timeout: 30000 }
    ).catch(e => {
      console.log('No sync API call detected');
      return null;
    });
    
    // Click sync button
    await syncButton.click();
    
    // Wait for any response or alert
    const alertPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);
    
    // Check if there's an alert
    const alert = await alertPromise;
    if (alert) {
      console.log('Alert message:', alert.message());
      await alert.accept();
    }
    
    // Check for sync response
    const syncResponse = await syncResponsePromise;
    if (syncResponse) {
      console.log('Sync response status:', syncResponse.status());
      const responseBody = await syncResponse.text().catch(() => 'Could not read body');
      console.log('Sync response body:', responseBody);
    }
    
    // Check browser console for errors
    await page.evaluate(() => {
      console.log('Current localStorage:', localStorage);
      console.log('Current sessionStorage:', sessionStorage);
    });
    
    // Check if games are displayed
    const gameCards = page.locator('[data-testid="game-card"], .card').filter({ hasText: /vs|@/ });
    const gameCount = await gameCards.count();
    console.log('Number of games displayed:', gameCount);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'sync-debug-screenshot.png', fullPage: true });
    
    // Log the page content
    const pageContent = await page.content();
    if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('Page contains error text');
    }
    
    // Try to get more details about the sync implementation
    const syncImplementation = await page.evaluate(() => {
      // Check if syncFromUTAthletics function exists
      return typeof (window as any).syncFromUTAthletics !== 'undefined';
    });
    console.log('syncFromUTAthletics exists in window:', syncImplementation);
  });
});