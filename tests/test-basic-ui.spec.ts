import { test, expect } from '@playwright/test';

test.describe('Basic UI Tests - Login Page', () => {
  test('Login page renders correctly', async ({ page }) => {
    console.log('Testing login page UI...\n');
    
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check page title
    await expect(page).toHaveTitle(/Texas Tailgaters/);
    console.log('✅ Page title is correct');
    
    // Check login form elements
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    console.log('✅ Email input is visible');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    console.log('✅ Password input is visible');
    
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
    console.log('✅ Sign In button is visible');
    
    const signUpButton = page.getByRole('button', { name: /Sign up/i });
    await expect(signUpButton).toBeVisible();
    console.log('✅ Sign Up button is visible');
    
    // Test form validation
    console.log('\nTesting form validation...');
    
    // Try to submit empty form
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Check if we're still on login page (validation should prevent submission)
    expect(page.url()).toContain('/login');
    console.log('✅ Empty form submission prevented');
    
    // Test with invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    expect(page.url()).toContain('/login');
    console.log('✅ Invalid email validation works');
    
    // Test with valid format but wrong credentials
    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Should still be on login page with error
    expect(page.url()).toContain('/login');
    console.log('✅ Wrong credentials handled');
    
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console errors detected:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('\n✅ No console errors');
    }
  });

  test('Login with test credentials', async ({ page }) => {
    console.log('Testing login with test credentials...\n');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in test credentials
    await page.fill('input[type="email"]', 'test@texastailgaters.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    console.log('Credentials entered, attempting login...');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login successful! Redirected to:', currentUrl);
      
      // Check what's on the page after login
      const pageContent = await page.locator('body').textContent();
      if (pageContent?.includes('Games')) {
        console.log('✅ Games content visible');
      }
      if (pageContent?.includes('Potluck')) {
        console.log('✅ Potluck content visible');
      }
      
      // Check for navigation
      const navLinks = await page.locator('a').allTextContents();
      console.log('Navigation links found:', navLinks.filter(link => link.length > 0));
      
    } else {
      console.log('❌ Login failed - still on login page');
      
      // Check for error messages
      const errorMessages = await page.locator('.text-red-500, .text-red-600, .error, [role="alert"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('Error messages:', errorMessages);
      }
    }
  });

  test('Sign up flow', async ({ page }) => {
    console.log('Testing sign up flow...\n');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Click sign up button
    const signUpButton = page.getByRole('button', { name: /Sign up/i });
    await signUpButton.click();
    await page.waitForTimeout(1000);
    
    // Check if sign up form is shown
    const nameInput = page.locator('input[placeholder*="name" i], input[name="name"]');
    if (await nameInput.isVisible()) {
      console.log('✅ Sign up form displayed');
      
      // Fill in sign up form
      await nameInput.fill('Test User');
      await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Look for confirm password field
      const confirmPassword = page.locator('input[placeholder*="confirm" i]');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('TestPassword123!');
        console.log('✅ Confirm password field filled');
      }
      
      // Submit sign up
      const submitButton = page.getByRole('button', { name: /sign up|create account|register/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('Sign up form submitted');
        await page.waitForTimeout(3000);
        
        // Check result
        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          console.log('✅ Sign up successful! Redirected to:', currentUrl);
        } else {
          console.log('Still on login/signup page after submission');
        }
      }
    } else {
      console.log('Sign up form not found - might be a toggle or separate page');
    }
  });

  test('Responsive design check', async ({ page }) => {
    console.log('Testing responsive design...\n');
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    const desktopLoginForm = page.locator('form, .login-form, div:has(input[type="email"])');
    const desktopFormWidth = await desktopLoginForm.boundingBox();
    console.log('Desktop form width:', desktopFormWidth?.width);
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletFormWidth = await desktopLoginForm.boundingBox();
    console.log('Tablet form width:', tabletFormWidth?.width);
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileFormWidth = await desktopLoginForm.boundingBox();
    console.log('Mobile form width:', mobileFormWidth?.width);
    
    if (mobileFormWidth && desktopFormWidth) {
      if (mobileFormWidth.width < desktopFormWidth.width) {
        console.log('✅ Form is responsive');
      } else {
        console.log('⚠️ Form might not be responsive');
      }
    }
  });
});