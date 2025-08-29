import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('Create Supabase tables', async ({ page }) => {
  // Read the SQL script
  const sql = fs.readFileSync('create-games-table.sql', 'utf-8');
  
  // Navigate to Supabase SQL editor
  await page.goto('https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Check if we need to sign in
  if (await page.locator('input[type="email"]').isVisible()) {
    console.log('Signing in to Supabase...');
    
    // Try to sign in with the email
    await page.fill('input[type="email"]', 'corbyjames@gmail.com');
    await page.click('button:has-text("Continue")');
    
    // Wait for password field
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', '$4Xanadu4M3e');
    
    // Sign in
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation to complete
    await page.waitForURL('**/project/**', { timeout: 30000 });
    
    // Navigate to SQL editor again
    await page.goto('https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
  }
  
  // Wait for SQL editor to load
  await page.waitForSelector('.monaco-editor', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Clear any existing content and paste our SQL
  await page.click('.monaco-editor');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Meta+A'); // For Mac
  await page.keyboard.type(sql);
  
  // Find and click the Run button
  const runButton = page.locator('button:has-text("Run")').first();
  await runButton.click();
  
  // Wait for execution to complete
  await page.waitForTimeout(5000);
  
  // Check for success or error messages
  const successMessage = page.locator('text=/Success|successfully/i');
  const errorMessage = page.locator('text=/Error|failed/i');
  
  if (await successMessage.isVisible()) {
    console.log('✅ Tables created successfully!');
  } else if (await errorMessage.isVisible()) {
    const errorText = await errorMessage.textContent();
    console.log('❌ Error creating tables:', errorText);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'supabase-error.png', fullPage: true });
  }
  
  // Take a final screenshot
  await page.screenshot({ path: 'supabase-tables-created.png', fullPage: true });
});