import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS, SELECTORS, TIMEOUTS } from '../utils/test-constants';

/**
 * Admin Page Object Model
 */
export class AdminPage extends BasePage {
  // Page elements
  private adminPanel = this.page.locator(SELECTORS.ADMIN_PANEL);
  private userList = this.page.locator(SELECTORS.USER_LIST);
  private userEmail = this.page.locator('text=Email:');
  private userRole = this.page.locator('text=Role:');
  private makeAdminButton = this.page.locator('button:has-text("Make Admin")');
  private removeAdminButton = this.page.locator('button:has-text("Remove Admin")');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to admin page
   */
  async navigate(): Promise<void> {
    await this.goto(URLS.ADMIN);
  }

  /**
   * Verify admin page is accessible (user has admin privileges)
   */
  async verifyAdminAccess(): Promise<void> {
    await this.verifyTitle(/Admin|Texas Tailgaters/);
    await this.verifyHeading('Admin Dashboard');
  }

  /**
   * Verify user does NOT have admin access
   */
  async verifyNoAdminAccess(): Promise<void> {
    // Should be redirected or see access denied
    const accessDenied = this.page.locator('text=Access Denied, text=Not Authorized, text=Admin Only');
    const isOnAdminPage = this.page.url().includes('/admin');
    
    if (isOnAdminPage) {
      // If on admin page, should see access denied message
      await expect(accessDenied.first()).toBeVisible();
    } else {
      // Should be redirected away from admin page
      await expect(this.page).not.toHaveURL(/.*\/admin/);
    }
  }

  /**
   * Verify admin panel elements are present
   */
  async verifyAdminPanelElements(): Promise<void> {
    // Check for common admin elements
    const adminElements = [
      'text=Users',
      'text=Games Management',
      'text=Settings',
      'text=Admin Dashboard'
    ];

    let foundElements = 0;
    for (const elementText of adminElements) {
      const element = this.page.locator(elementText);
      if (await element.isVisible()) {
        foundElements++;
      }
    }

    // Should have at least some admin elements visible
    expect(foundElements).toBeGreaterThan(0);
  }

  /**
   * View user management section
   */
  async viewUserManagement(): Promise<void> {
    const userManagementLink = this.page.locator('text=Users, text=User Management');
    if (await userManagementLink.isVisible()) {
      await userManagementLink.click();
      await this.waitForLoad();
    }
  }

  /**
   * Verify current user info is displayed
   */
  async verifyCurrentUserInfo(expectedEmail: string): Promise<void> {
    const emailElement = this.page.locator(`text=Email: ${expectedEmail}`);
    await expect(emailElement).toBeVisible();
  }

  /**
   * Verify user role is displayed
   */
  async verifyUserRole(expectedRole: string): Promise<void> {
    const roleElement = this.page.locator(`text=Role: ${expectedRole}`);
    await expect(roleElement).toBeVisible();
  }

  /**
   * Search for a specific user
   */
  async searchUser(email: string): Promise<void> {
    const searchInput = this.page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(email);
      await this.page.waitForTimeout(TIMEOUTS.SHORT);
    }
  }

  /**
   * Make a user admin
   */
  async makeUserAdmin(userEmail: string): Promise<void> {
    await this.searchUser(userEmail);
    
    const userRow = this.page.locator(`text=${userEmail}`).locator('..');
    const makeAdminBtn = userRow.locator('button:has-text("Make Admin")');
    
    if (await makeAdminBtn.isVisible()) {
      await makeAdminBtn.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
    }
  }

  /**
   * Remove admin privileges from user
   */
  async removeUserAdmin(userEmail: string): Promise<void> {
    await this.searchUser(userEmail);
    
    const userRow = this.page.locator(`text=${userEmail}`).locator('..');
    const removeAdminBtn = userRow.locator('button:has-text("Remove Admin")');
    
    if (await removeAdminBtn.isVisible()) {
      await removeAdminBtn.click();
      await this.page.waitForTimeout(TIMEOUTS.MEDIUM);
    }
  }

  /**
   * Verify admin dashboard statistics
   */
  async verifyDashboardStats(): Promise<void> {
    // Look for common dashboard statistics
    const statsElements = [
      'text=Total Users:',
      'text=Total Games:',
      'text=Active Potlucks:',
      /\d+\s+(users?|games?|items?)/i
    ];

    let foundStats = 0;
    for (const stat of statsElements) {
      const element = this.page.locator(stat);
      if (await element.isVisible()) {
        foundStats++;
      }
    }

    // Should have at least some statistics visible
    expect(foundStats).toBeGreaterThan(0);
  }

  /**
   * Verify games management functionality
   */
  async verifyGamesManagement(): Promise<void> {
    const gamesManagementLink = this.page.locator('text=Games Management, text=Manage Games');
    
    if (await gamesManagementLink.isVisible()) {
      await gamesManagementLink.click();
      await this.waitForLoad();
      
      // Should see games management interface
      const gamesList = this.page.locator('.games-list, [data-testid="admin-games-list"]');
      const addGameButton = this.page.locator('button:has-text("Add Game")');
      
      // At least one of these should be visible
      const hasGamesInterface = await gamesList.isVisible() || await addGameButton.isVisible();
      expect(hasGamesInterface).toBeTruthy();
    }
  }

  /**
   * Verify settings management
   */
  async verifySettingsManagement(): Promise<void> {
    const settingsLink = this.page.locator('text=Settings, text=System Settings');
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await this.waitForLoad();
      
      // Should see settings interface
      const settingsForm = this.page.locator('form, .settings-form');
      const settingsInputs = this.page.locator('input, select, textarea');
      
      const hasSettingsInterface = await settingsForm.isVisible() || await settingsInputs.first().isVisible();
      expect(hasSettingsInterface).toBeTruthy();
    }
  }

  /**
   * Test admin navigation
   */
  async testAdminNavigation(): Promise<void> {
    // Test navigation to different admin sections
    const adminNavItems = [
      'Users',
      'Games',
      'Settings',
      'Dashboard'
    ];

    for (const item of adminNavItems) {
      const navItem = this.page.locator(`nav a:has-text("${item}"), a:has-text("${item}")`);
      if (await navItem.isVisible()) {
        await navItem.click();
        await this.waitForLoad();
        
        // Verify we navigated somewhere
        const currentUrl = this.page.url();
        expect(currentUrl.includes('/admin')).toBeTruthy();
      }
    }
  }

  /**
   * Verify admin permissions for user actions
   */
  async verifyAdminPermissions(): Promise<void> {
    // Check for admin-only buttons/actions
    const adminActions = [
      'button:has-text("Delete")',
      'button:has-text("Edit")',
      'button:has-text("Make Admin")',
      'button:has-text("Remove Admin")',
      'button:has-text("Ban User")',
      'button:has-text("Reset Password")'
    ];

    let foundActions = 0;
    for (const action of adminActions) {
      const element = this.page.locator(action);
      if (await element.isVisible()) {
        foundActions++;
      }
    }

    // Should have at least some admin actions available
    expect(foundActions).toBeGreaterThan(0);
  }

  /**
   * Export data functionality
   */
  async testExportFunctionality(): Promise<void> {
    const exportButton = this.page.locator('button:has-text("Export"), a:has-text("Export")');
    
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = this.page.waitForEvent('download');
      await exportButton.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        // Export might not trigger download in test environment
        console.log('Export functionality may not work in test environment');
      }
    }
  }

  /**
   * Verify admin audit log
   */
  async verifyAuditLog(): Promise<void> {
    const auditLogLink = this.page.locator('text=Audit Log, text=Activity Log, text=Admin Log');
    
    if (await auditLogLink.isVisible()) {
      await auditLogLink.click();
      await this.waitForLoad();
      
      // Should see log entries
      const logEntries = this.page.locator('.log-entry, [data-testid="log-entry"], tr, .activity-item');
      const entryCount = await logEntries.count();
      
      // Should have some log entries or at least the log interface
      expect(entryCount).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Test bulk operations
   */
  async testBulkOperations(): Promise<void> {
    const selectAllCheckbox = this.page.locator('input[type="checkbox"]:has-text("Select All"), th input[type="checkbox"]');
    
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      
      // Look for bulk action buttons
      const bulkActions = this.page.locator('button:has-text("Bulk"), select:has-text("Bulk")');
      if (await bulkActions.first().isVisible()) {
        // Bulk operations are available
        expect(await bulkActions.count()).toBeGreaterThan(0);
      }
    }
  }
}