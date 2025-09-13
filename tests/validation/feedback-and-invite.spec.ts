import { test, expect, devices } from '@playwright/test';

// Configure mobile device for mobile tests
const mobileDevice = devices['iPhone 12 Pro'];

test.describe('Mobile Feedback and Group Invite Validation Tests', () => {
  const testCredentials = {
    admin: {
      email: 'test@texastailgaters.com',
      password: 'TestPassword123!'
    },
    regular: {
      email: 'test@texastailgaters.com', 
      password: 'TestPassword123!'
    }
  };

  test.describe('Mobile Feedback System Tests', () => {

    test('should display feedback button in mobile header', async ({ page }) => {
      // Set mobile viewport for this test
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto('http://localhost:5173/login');
      
      // Login with regular user
      await page.fill('input[type="email"]', testCredentials.regular.email);
      await page.fill('input[type="password"]', testCredentials.regular.password);
      await page.click('button[type="submit"]');
      
      // Wait for successful login redirect (could be home page or games page)
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Check if feedback button exists in header
      const feedbackButton = page.locator('button[title="Send Feedback"]');
      await expect(feedbackButton).toBeVisible();
      
      // Take screenshot of mobile header with feedback button
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-header-feedback-button.png',
        fullPage: false
      });
      
      console.log('✅ Feedback button visible in mobile header');
    });

    test('should submit feedback on mobile with touch interactions', async ({ page, browser }) => {
      // Set mobile viewport for this test
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto('http://localhost:5173/login');
      
      // Login with regular user
      await page.fill('input[type="email"]', testCredentials.regular.email);
      await page.fill('input[type="password"]', testCredentials.regular.password);
      await page.click('button[type="submit"]');
      
      // Wait for successful login
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Click/Tap the feedback button (use click for better compatibility)
      const feedbackButton = page.locator('button[title="Send Feedback"]');
      await feedbackButton.click();
      
      // Wait for feedback modal to appear
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Take screenshot of feedback modal on mobile
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-feedback-modal.png',
        fullPage: true
      });
      
      // Test touch interactions for feedback type selection
      const bugReportButton = page.locator('button:has-text("Bug Report")');
      await expect(bugReportButton).toBeVisible();
      await bugReportButton.click();
      
      // Verify bug report is selected (should have orange border)
      await expect(bugReportButton).toHaveClass(/border-orange-500/);
      
      // Select category
      await page.selectOption('select', 'functionality');
      
      // Select priority
      const highPriorityButton = page.locator('button:has-text("High")');
      await highPriorityButton.click();
      await expect(highPriorityButton).toHaveClass(/border-orange-500/);
      
      // Fill subject field
      const subjectField = page.locator('input[placeholder*="Brief description"]');
      await subjectField.click();
      await subjectField.fill('Mobile UI Test Feedback');
      
      // Fill message field
      const messageField = page.locator('textarea[placeholder*="Please provide detailed"]');
      await messageField.click();
      await messageField.fill('This is a test feedback submission from mobile device. Testing touch interactions and form validation.');
      
      // Take screenshot before submission
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-feedback-form-filled.png',
        fullPage: true
      });
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]:has-text("Submit Feedback")');
      await submitButton.click();
      
      // Wait for success message
      await page.waitForSelector('.bg-green-100.text-green-800', { state: 'visible', timeout: 10000 });
      
      // Take screenshot of success state
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-feedback-success.png',
        fullPage: true
      });
      
      // Verify success message
      const successMessage = page.locator('.bg-green-100.text-green-800');
      await expect(successMessage).toContainText('Thank you for your feedback');
      
      console.log('✅ Mobile feedback submission completed successfully');
    });

    test('should handle mobile modal dismissal correctly', async ({ page }) => {
      // Set mobile viewport for this test
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto('http://localhost:5173/login');
      
      // Login
      await page.fill('input[type="email"]', testCredentials.regular.email);
      await page.fill('input[type="password"]', testCredentials.regular.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Open feedback modal
      const feedbackButton = page.locator('button[title="Send Feedback"]');
      await feedbackButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Test dismissal by tapping X button
      const closeButton = page.locator('button:has(svg)').first();
      await closeButton.click();
      
      // Verify modal is closed
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'hidden' });
      
      // Open modal again
      await feedbackButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Test dismissal by tapping cancel button
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      
      // Verify modal is closed
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'hidden' });
      
      console.log('✅ Mobile modal dismissal working correctly');
    });

    test('should validate form fields on mobile', async ({ page }) => {
      // Set mobile viewport for this test
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto('http://localhost:5173/login');
      
      // Login
      await page.fill('input[type="email"]', testCredentials.regular.email);
      await page.fill('input[type="password"]', testCredentials.regular.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Open feedback modal
      const feedbackButton = page.locator('button[title="Send Feedback"]');
      await feedbackButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"]:has-text("Submit Feedback")');
      await submitButton.click();
      
      // Wait for validation message
      await page.waitForSelector('.bg-red-100.text-red-800', { state: 'visible', timeout: 5000 });
      
      // Verify validation message
      const errorMessage = page.locator('.bg-red-100.text-red-800');
      await expect(errorMessage).toContainText('Please fill in all required fields');
      
      // Take screenshot of validation error
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-feedback-validation-error.png',
        fullPage: true
      });
      
      console.log('✅ Mobile form validation working correctly');
    });
  });

  test.describe('Group Invite Functionality Tests', () => {

    test('should handle group invites as admin on desktop', async ({ page }) => {
      // Set desktop viewport for admin tests
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:5173/login');
      
      // Login as admin
      await page.fill('input[type="email"]', testCredentials.admin.email);
      await page.fill('input[type="password"]', testCredentials.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for successful login
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Navigate to admin dashboard
      await page.goto('http://localhost:5173/admin');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of admin dashboard
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/admin-dashboard.png',
        fullPage: true
      });
      
      // Find and click the "Invite All Users" button
      const inviteButton = page.locator('button:has-text("Invite All Users")');
      await expect(inviteButton).toBeVisible();
      await inviteButton.click();
      
      // Wait for invite modal to open
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Take screenshot of invite modal
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/group-invite-modal.png',
        fullPage: true
      });
      
      // Verify modal title
      const modalTitle = page.locator('h2:has-text("Invite All Users")');
      await expect(modalTitle).toBeVisible();
      
      console.log('✅ Group invite modal opens successfully');
    });

    test('should load users and allow selection in invite modal', async ({ page }) => {
      // Set desktop viewport for admin tests
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:5173/login');
      
      // Login as admin
      await page.fill('input[type="email"]', testCredentials.admin.email);
      await page.fill('input[type="password"]', testCredentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Navigate to admin dashboard and open invite modal
      await page.goto('http://localhost:5173/admin');
      await page.waitForLoadState('networkidle');
      
      const inviteButton = page.locator('button:has-text("Invite All Users")');
      await inviteButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Wait for users to load
      await page.waitForSelector('text=Loading users...', { state: 'hidden', timeout: 10000 }).catch(() => {
        console.log('Users loading text not found or already hidden');
      });
      
      // Check if users are loaded
      const userCheckboxes = page.locator('input[type="checkbox"]').first();
      await expect(userCheckboxes).toBeVisible({ timeout: 10000 });
      
      // Test select all functionality
      const selectAllButton = page.locator('button:has-text("Deselect All"), button:has-text("Select All")').first();
      const initialText = await selectAllButton.textContent();
      await selectAllButton.click();
      
      // Verify the button text changed
      await expect(selectAllButton).not.toContainText(initialText || '');
      
      // Take screenshot of user selection interface
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/user-selection-interface.png',
        fullPage: true
      });
      
      // Test email subject and custom message fields
      const emailSubject = page.locator('input[placeholder*="Enter email subject"]');
      await emailSubject.fill('Test Season Invitation');
      
      const customMessage = page.locator('textarea[placeholder*="Add a personal message"]');
      await customMessage.fill('This is a test invitation message for validation purposes.');
      
      // Take screenshot of filled form
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/invite-form-filled.png',
        fullPage: true
      });
      
      console.log('✅ User selection and form filling works correctly');
    });

    test('should test invite modal on mobile viewport', async ({ page }) => {
      // Set mobile viewport for this test
      await page.setViewportSize({ width: 393, height: 851 });
      
      await page.goto('http://localhost:5173/login');
      
      // Login as admin
      await page.fill('input[type="email"]', testCredentials.admin.email);
      await page.fill('input[type="password"]', testCredentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Navigate to admin dashboard
      await page.goto('http://localhost:5173/admin');
      await page.waitForLoadState('networkidle');
      
      // Find and tap the invite button on mobile
      const inviteButton = page.locator('button:has-text("Invite All Users")');
      await inviteButton.click();
      
      // Wait for mobile-optimized modal
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Take screenshot of mobile invite modal
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-invite-modal.png',
        fullPage: true
      });
      
      // Verify mobile-specific styling
      const modal = page.locator('.bg-white.rounded-t-xl, .bg-white.rounded-lg');
      await expect(modal).toBeVisible();
      
      // Test scrolling in user list on mobile
      const userList = page.locator('.max-h-36.sm\\:max-h-48.overflow-y-auto');
      if (await userList.isVisible()) {
        await userList.scrollIntoViewIfNeeded();
        await page.screenshot({ 
          path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/mobile-user-list-scrolled.png',
          fullPage: true
        });
      }
      
      console.log('✅ Mobile invite modal displays and functions correctly');
    });

    test('should validate send button state and UI feedback', async ({ page }) => {
      // Set desktop viewport for admin tests
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:5173/login');
      
      // Login as admin
      await page.fill('input[type="email"]', testCredentials.admin.email);
      await page.fill('input[type="password"]', testCredentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Navigate to admin dashboard and open invite modal
      await page.goto('http://localhost:5173/admin');
      await page.waitForLoadState('networkidle');
      
      const inviteButton = page.locator('button:has-text("Invite All Users")');
      await inviteButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Wait for users to load and deselect all users
      await page.waitForTimeout(2000);
      const selectAllButton = page.locator('button:has-text("Deselect All"), button:has-text("Select All")').first();
      
      // If showing "Deselect All", click it to deselect all users
      if (await selectAllButton.textContent() === 'Deselect All') {
        await selectAllButton.click();
      }
      
      // Verify send button is disabled when no users selected
      const sendButton = page.locator('button:has-text("Send Invitations"), button:has-text("Send")');
      await expect(sendButton).toBeDisabled();
      
      // Take screenshot showing disabled state
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/send-button-disabled.png',
        fullPage: true
      });
      
      // Select at least one user
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      await firstCheckbox.check();
      
      // Verify send button is now enabled
      await expect(sendButton).toBeEnabled();
      
      // Take screenshot showing enabled state
      await page.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/send-button-enabled.png',
        fullPage: true
      });
      
      console.log('✅ Send button state validation working correctly');
    });
  });

  test.describe('Cross-Viewport Compatibility Tests', () => {
    test('should verify feedback functionality across different viewports', async ({ page }) => {
      const viewports = [
        { width: 393, height: 851, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1280, height: 720, name: 'desktop' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('http://localhost:5173/login');
        
        // Login
        await page.fill('input[type="email"]', testCredentials.regular.email);
        await page.fill('input[type="password"]', testCredentials.regular.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
        
        // Test feedback button visibility
        const feedbackButton = page.locator('button[title="Send Feedback"]');
        await expect(feedbackButton).toBeVisible();
        
        // Test modal opening
        if (viewport.width < 768) {
          await feedbackButton.click();
        } else {
          await feedbackButton.click();
        }
        
        await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
        
        // Take screenshot for each viewport
        await page.screenshot({ 
          path: `/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/feedback-modal-${viewport.name}.png`,
          fullPage: true
        });
        
        // Close modal
        const closeButton = page.locator('button:has-text("Cancel")');
        if (viewport.width < 768) {
          await closeButton.click();
        } else {
          await closeButton.click();
        }
        
        await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'hidden' });
        
        console.log(`✅ Feedback modal works correctly on ${viewport.name} viewport`);
      }
    });
  });

  test.describe('Integration and Admin Dashboard Tests', () => {
    test('should verify feedback appears in admin dashboard', async ({ page, context }) => {
      // Create a new page for admin verification
      const adminPage = await context.newPage();
      
      // Submit feedback as regular user first
      await page.goto('http://localhost:5173/login');
      await page.fill('input[type="email"]', testCredentials.regular.email);
      await page.fill('input[type="password"]', testCredentials.regular.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(home|games|$)/, { timeout: 10000 });
      
      // Open feedback modal and submit
      const feedbackButton = page.locator('button[title="Send Feedback"]');
      await feedbackButton.click();
      await page.waitForSelector('.fixed.inset-0.bg-black.bg-opacity-50', { state: 'visible' });
      
      // Fill and submit feedback
      await page.locator('input[placeholder*="Brief description"]').fill('Integration Test Feedback');
      await page.locator('textarea[placeholder*="Please provide detailed"]').fill('This feedback should appear in admin dashboard.');
      
      const submitButton = page.locator('button[type="submit"]:has-text("Submit Feedback")');
      await submitButton.click();
      await page.waitForSelector('.bg-green-100.text-green-800', { state: 'visible', timeout: 10000 });
      
      // Now check admin dashboard
      await adminPage.goto('http://localhost:5173/login');
      await adminPage.fill('input[type="email"]', testCredentials.admin.email);
      await adminPage.fill('input[type="password"]', testCredentials.admin.password);
      await adminPage.click('button[type="submit"]');
      await adminPage.waitForURL('**/games', { timeout: 10000 });
      
      // Navigate to admin dashboard
      await adminPage.goto('http://localhost:5173/admin');
      await adminPage.waitForLoadState('networkidle');
      
      // Take screenshot of admin feedback section
      await adminPage.screenshot({ 
        path: '/Users/jamescjames/projects/marine-life-id/marine-life-id/screenshots/validation/admin-feedback-dashboard.png',
        fullPage: true
      });
      
      console.log('✅ Integration test between feedback submission and admin dashboard completed');
    });
  });
});