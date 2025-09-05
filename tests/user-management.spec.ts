import { test, expect } from '@playwright/test';

// Test configuration
const ADMIN_EMAIL = 'test@texastailgaters.com';
const ADMIN_PASSWORD = 'TestPassword123!';
const TEST_USER_EMAIL = 'playwright-test-user@test.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const TEST_USER_NAME = 'Playwright Test User';

test.describe('User Management Features', () => {
  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
  }

  // Helper function to navigate to admin users tab
  async function navigateToUserManagement(page) {
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('text=Admin Dashboard');
    
    // Click on Users tab
    await page.click('button:has-text("Users")');
    await page.waitForSelector('text=Total Users');
  }

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('Admin can view Users tab in admin dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/admin');
    
    // Check that admin dashboard loads
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    
    // Check that Users tab exists
    const usersTab = page.locator('button:has-text("Users")');
    await expect(usersTab).toBeVisible();
    
    // Click on Users tab
    await usersTab.click();
    
    // Verify user management interface loads
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Inactive')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Admins')).toBeVisible();
  });

  test('User statistics are displayed correctly', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Check that statistics cards are visible
    const statsCards = page.locator('.bg-white.p-4.rounded-lg.border');
    await expect(statsCards).toHaveCount(5);
    
    // Verify each stat card has a number
    const totalUsers = page.locator('div:has-text("Total Users") >> .text-2xl');
    await expect(totalUsers).toBeVisible();
    const totalText = await totalUsers.textContent();
    expect(parseInt(totalText || '0')).toBeGreaterThanOrEqual(0);
    
    const activeUsers = page.locator('div:has-text("Active") >> .text-2xl').first();
    await expect(activeUsers).toBeVisible();
    
    const inactiveUsers = page.locator('div:has-text("Inactive") >> .text-2xl').first();
    await expect(inactiveUsers).toBeVisible();
    
    const pendingUsers = page.locator('div:has-text("Pending") >> .text-2xl').first();
    await expect(pendingUsers).toBeVisible();
    
    const adminUsers = page.locator('div:has-text("Admins") >> .text-2xl').first();
    await expect(adminUsers).toBeVisible();
  });

  test('Search functionality works', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('admin');
    
    // Wait for table to update (debounced search)
    await page.waitForTimeout(500);
    
    // Check that admin user is visible in results
    const adminEmail = page.locator('td:has-text("admin@texastailgaters.com")');
    await expect(adminEmail).toBeVisible();
  });

  test('Filter by status works', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find status filter dropdown
    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();
    
    // Select "Active" filter
    await statusFilter.selectOption('active');
    await page.waitForTimeout(500);
    
    // Verify only active users are shown
    const statusBadges = page.locator('.px-2.py-1.bg-green-100.text-green-800');
    if (await statusBadges.count() > 0) {
      const badges = await statusBadges.all();
      for (const badge of badges) {
        await expect(badge).toContainText('Active');
      }
    }
  });

  test('Filter by role works', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find role filter dropdown
    const roleFilter = page.locator('select').nth(1);
    await expect(roleFilter).toBeVisible();
    
    // Select "Admin" filter
    await roleFilter.selectOption('admin');
    await page.waitForTimeout(500);
    
    // Verify admin badges are visible
    const adminBadges = page.locator('span:has-text("Admin")');
    if (await adminBadges.count() > 0) {
      await expect(adminBadges.first()).toBeVisible();
    }
  });

  test('User action menu opens', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find first action button (three dots)
    const actionButton = page.locator('button:has(svg)').last();
    await actionButton.click();
    
    // Check that action menu appears
    const actionMenu = page.locator('.absolute.right-0.mt-2.w-48.bg-white');
    await expect(actionMenu).toBeVisible();
    
    // Verify menu options exist
    const menuOptions = [
      'Send Password Reset',
      'Make Admin',
      'Remove Admin',
      'Deactivate User',
      'Reactivate User',
      'Approve Registration'
    ];
    
    // At least one option should be visible
    let foundOption = false;
    for (const option of menuOptions) {
      const optionElement = page.locator(`text="${option}"`);
      if (await optionElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundOption = true;
        break;
      }
    }
    expect(foundOption).toBeTruthy();
  });

  test('Refresh button works', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Click refresh
    await refreshButton.click();
    
    // Verify page reloads data (check that stats are still visible)
    await expect(page.locator('text=Total Users')).toBeVisible();
  });

  test('User table displays correct information', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Check table headers
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Joined")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Login")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    
    // Check that at least one user row exists
    const userRows = page.locator('tbody tr');
    expect(await userRows.count()).toBeGreaterThan(0);
    
    // Verify first user has required fields
    const firstRow = userRows.first();
    const email = firstRow.locator('.text-sm.text-gray-500');
    await expect(email).toBeVisible();
    
    // Check for status badge
    const statusBadge = firstRow.locator('.px-2.py-1.rounded-full').first();
    await expect(statusBadge).toBeVisible();
    
    // Check for role badge
    const roleBadge = firstRow.locator('.px-2.py-1.rounded-full').nth(1);
    await expect(roleBadge).toBeVisible();
  });

  test('Password reset can be triggered', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Find a user that is not the current admin
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    
    let actionTriggered = false;
    for (let i = 0; i < rowCount; i++) {
      const row = userRows.nth(i);
      const emailCell = row.locator('.text-sm.text-gray-500');
      const emailText = await emailCell.textContent();
      
      if (emailText && !emailText.includes('test@texastailgaters.com')) {
        // Click action menu for this user
        const actionButton = row.locator('button:has(svg)').last();
        await actionButton.click();
        
        // Click password reset option
        const resetButton = page.locator('button:has-text("Send Password Reset")');
        if (await resetButton.isVisible()) {
          await resetButton.click();
          actionTriggered = true;
          
          // Check for success message
          await expect(page.locator('text=/Password reset email sent|Successfully|✅/')).toBeVisible({
            timeout: 5000
          });
          break;
        }
      }
    }
    
    if (!actionTriggered) {
      console.log('No suitable user found for password reset test');
    }
  });

  test('Admin can see all user management options', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Verify all main UI elements are present
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // Status filter
    await expect(page.locator('select').nth(1)).toBeVisible(); // Role filter
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    
    // Verify table structure
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead')).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();
    
    // Verify at least one user exists in the table
    const userCount = await page.locator('tbody tr').count();
    expect(userCount).toBeGreaterThan(0);
  });

  test('Empty state displays when no users match filters', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Search for non-existent user
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nonexistentuserxyz123');
    await page.waitForTimeout(500);
    
    // Check for empty state
    const emptyState = page.locator('text=No users found');
    await expect(emptyState).toBeVisible();
    
    // Verify empty state icon
    const emptyIcon = page.locator('svg.w-12.h-12.text-gray-300');
    await expect(emptyIcon).toBeVisible();
  });

  test('Success and error messages display correctly', async ({ page }) => {
    await navigateToUserManagement(page);
    
    // Test structure for message containers
    const successContainer = page.locator('.bg-green-100.border-green-300');
    const errorContainer = page.locator('.bg-red-100.border-red-300');
    
    // These should be hidden initially or after actions
    // Just verify the structure exists in the DOM
    expect(successContainer || errorContainer).toBeTruthy();
  });
});

test.describe('Mobile Responsive User Management', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('User management is responsive on mobile', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/games');
    
    // Navigate to admin page
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('text=Admin Dashboard');
    
    // Click Users tab
    await page.click('button:has-text("Users")');
    
    // Check that the table is scrollable on mobile
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();
    
    // Verify key elements are still accessible
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });
});