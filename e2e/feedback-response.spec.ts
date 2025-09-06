import { test, expect } from '@playwright/test';

// Test data
const adminCredentials = {
  email: 'admin@texastailgaters.com',
  password: 'admin123'
};

const userCredentials = {
  email: 'testuser@example.com',
  password: 'test123'
};

const testFeedback = {
  subject: 'Test Feedback - ' + Date.now(),
  message: 'This is a test feedback message for automated testing.',
  type: 'bug',
  priority: 'high',
  category: 'functionality'
};

const adminResponse = {
  message: 'Thank you for your feedback. We have identified the issue and are working on a fix.',
  resolution: 'Bug fixed in version 1.2.3'
};

test.describe('Feedback Response System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('Admin can respond to feedback', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForURL('**/games', { timeout: 10000 });
    
    // Navigate to admin panel
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on Feedback Manager tab
    const feedbackTab = page.locator('button:has-text("Feedback")');
    if (await feedbackTab.isVisible()) {
      await feedbackTab.click();
    }
    
    // Wait for feedback list to load
    await page.waitForSelector('text=/Feedback Manager/i', { timeout: 5000 });
    
    // Check if there are any feedback items
    const feedbackItems = page.locator('[class*="bg-white rounded-lg shadow-sm border"]');
    const itemCount = await feedbackItems.count();
    
    if (itemCount > 1) { // Excluding the filter section
      // Click on the first feedback item to expand it
      await feedbackItems.nth(1).click();
      
      // Wait for expanded content
      await page.waitForTimeout(500);
      
      // Click the Respond button
      const respondButton = page.locator('button:has-text("Respond")').first();
      if (await respondButton.isVisible()) {
        await respondButton.click();
        
        // Wait for modal to open
        await page.waitForSelector('text=/Feedback Details/i', { timeout: 5000 });
        
        // Enter admin response
        await page.fill('textarea[placeholder*="Enter your response"]', adminResponse.message);
        
        // Check "Mark as resolved"
        const resolveCheckbox = page.locator('input[type="checkbox"]');
        if (await resolveCheckbox.isVisible()) {
          await resolveCheckbox.check();
          
          // Enter resolution summary
          await page.fill('input[placeholder*="resolution summary"]', adminResponse.resolution);
        }
        
        // Send response
        await page.click('button:has-text("Send Response")');
        
        // Verify response was sent
        await expect(page.locator('text=/Successfully|Sent|Updated/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('User can view closed issues', async ({ page }) => {
    // Navigate directly to updates page (public access)
    await page.goto('http://localhost:5173/updates');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Updates & Resolved Issues")', { timeout: 10000 });
    
    // Check if resolved issues section is visible
    await expect(page.locator('h2:has-text("Resolved Issues")')).toBeVisible();
    
    // Check for stats cards
    const statsCards = page.locator('[class*="bg-white rounded-lg shadow-sm p-4"]');
    await expect(statsCards).toHaveCount(4); // Should have 4 stat cards
    
    // Check for filter controls
    await expect(page.locator('input[placeholder*="Search issues"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // Type filter
    await expect(page.locator('select').nth(1)).toBeVisible(); // Sort filter
    
    // Check if there are any closed issues displayed
    const closedIssues = page.locator('[class*="bg-white rounded-lg shadow-sm overflow-hidden"]');
    const issueCount = await closedIssues.count();
    
    if (issueCount > 0) {
      // Click on first issue to expand
      await closedIssues.first().click();
      
      // Check for expanded content
      await page.waitForTimeout(500);
      const expandedContent = page.locator('[class*="border-t border-gray-200 p-4 bg-gray-50"]').first();
      
      if (await expandedContent.isVisible()) {
        // Check for issue details
        await expect(expandedContent.locator('text=/Issue Description/i')).toBeVisible();
        
        // Check for admin response if exists
        const adminResponseSection = expandedContent.locator('text=/Our Response/i');
        if (await adminResponseSection.isVisible()) {
          await expect(expandedContent.locator('[class*="bg-white rounded-lg p-3"]')).toBeVisible();
        }
        
        // Check for resolution if exists
        const resolutionSection = expandedContent.locator('text=/Resolution/i');
        if (await resolutionSection.isVisible()) {
          await expect(expandedContent.locator('[class*="bg-green-50 rounded-lg p-3"]')).toBeVisible();
        }
      }
    }
  });

  test('Search and filter closed issues', async ({ page }) => {
    // Navigate to updates page
    await page.goto('http://localhost:5173/updates');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Updates & Resolved Issues")', { timeout: 10000 });
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search issues"]');
    await searchInput.fill('bug');
    await page.waitForTimeout(500);
    
    // Test type filter
    const typeFilter = page.locator('select').first();
    await typeFilter.selectOption('bug');
    await page.waitForTimeout(500);
    
    // Test sort order
    const sortFilter = page.locator('select').nth(1);
    await sortFilter.selectOption('oldest');
    await page.waitForTimeout(500);
    
    // Reset filters
    await searchInput.clear();
    await typeFilter.selectOption('all');
    await sortFilter.selectOption('recent');
  });

  test('Submit feedback and check response flow', async ({ page }) => {
    // First, submit feedback as a user
    await page.goto('http://localhost:5173/login');
    
    // Create a test user account or use existing
    await page.fill('input[type="email"]', userCredentials.email);
    await page.fill('input[type="password"]', userCredentials.password);
    
    // Try to sign in, if fails, sign up
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    // Check if we're still on login page (sign in failed)
    if (page.url().includes('/login')) {
      // Switch to sign up
      const signUpLink = page.locator('text=/Don\'t have an account|Sign up/i');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.fill('input[type="email"]', userCredentials.email);
        await page.fill('input[type="password"]', userCredentials.password);
        await page.fill('input[type="password"]', userCredentials.password); // Confirm password
        await page.click('button:has-text("Sign Up")');
      }
    }
    
    // Wait for navigation to games page
    await page.waitForURL('**/games', { timeout: 10000 });
    
    // Navigate to feedback form (if available in navigation)
    const profileButton = page.locator('[class*="navbar"] button:has-text("Profile")');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      
      // Look for feedback option in dropdown
      const feedbackOption = page.locator('text=/Feedback|Report/i');
      if (await feedbackOption.isVisible()) {
        await feedbackOption.click();
        
        // Fill feedback form
        await page.fill('input[placeholder*="Subject"]', testFeedback.subject);
        await page.fill('textarea[placeholder*="message"]', testFeedback.message);
        await page.selectOption('select[name="type"]', testFeedback.type);
        await page.selectOption('select[name="priority"]', testFeedback.priority);
        
        // Submit feedback
        await page.click('button:has-text("Submit")');
        
        // Wait for success message
        await expect(page.locator('text=/Thank you|Submitted|Success/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Admin can update feedback status', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForURL('**/games', { timeout: 10000 });
    
    // Navigate to admin panel
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on Feedback Manager tab
    const feedbackTab = page.locator('button:has-text("Feedback")');
    if (await feedbackTab.isVisible()) {
      await feedbackTab.click();
    }
    
    // Wait for feedback list
    await page.waitForSelector('text=/Feedback Manager/i', { timeout: 5000 });
    
    // Get feedback items
    const feedbackItems = page.locator('[class*="bg-white rounded-lg shadow-sm border"]');
    const itemCount = await feedbackItems.count();
    
    if (itemCount > 1) {
      // Expand first feedback item
      await feedbackItems.nth(1).click();
      await page.waitForTimeout(500);
      
      // Find status buttons
      const statusButtons = page.locator('button:has-text("in progress")').first();
      if (await statusButtons.isVisible()) {
        await statusButtons.click();
        await page.waitForTimeout(1000);
        
        // Verify status was updated
        await expect(page.locator('[class*="rounded-full"][class*="text-xs"]:has-text("in-progress")')).toBeVisible();
      }
    }
  });

  test('Check feedback stats display', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForURL('**/games', { timeout: 10000 });
    
    // Navigate to admin panel
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on Feedback Manager tab
    const feedbackTab = page.locator('button:has-text("Feedback")');
    if (await feedbackTab.isVisible()) {
      await feedbackTab.click();
    }
    
    // Check for stats cards
    await expect(page.locator('text=/Total Feedback/i')).toBeVisible();
    await expect(page.locator('text=/New Items/i')).toBeVisible();
    await expect(page.locator('text=/In Progress/i')).toBeVisible();
    await expect(page.locator('text=/Resolved/i')).toBeVisible();
    
    // Check for filter controls
    await expect(page.locator('select[value="all"]').first()).toBeVisible();
  });
});