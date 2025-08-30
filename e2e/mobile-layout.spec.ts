import { test, devices } from '@playwright/test';

// Test different mobile devices
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  // { name: 'iPhone SE', device: devices['iPhone SE'] },
  // { name: 'Pixel 5', device: devices['Pixel 5'] },
  // { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Layout - ${name}`, () => {
    test.use(device);

    test('Homepage mobile layout', async ({ page }) => {
      await page.goto('http://localhost:5173');
      
      // Take screenshot of homepage
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-homepage.png`,
        fullPage: true 
      });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
    });

    test('Login page mobile layout', async ({ page }) => {
      await page.goto('http://localhost:5173/login');
      
      // Take screenshot of login page
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-login.png`,
        fullPage: true 
      });
      
      // Try to interact with login form
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      // Take screenshot with filled form
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-login-filled.png`,
        fullPage: true 
      });
    });

    test('Games page mobile layout', async ({ page }) => {
      // First login
      await page.goto('http://localhost:5173/login');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/games', { timeout: 10000 });
      
      // Take screenshot of games page
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-games.png`,
        fullPage: true 
      });
      
      // Scroll down to see more content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-games-scrolled.png`,
        fullPage: false 
      });
    });

    test('Potluck page mobile layout', async ({ page }) => {
      // First login
      await page.goto('http://localhost:5173/login');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/games', { timeout: 10000 });
      
      // Navigate to first game's potluck
      const firstGameCard = page.locator('.bg-white').first();
      await firstGameCard.click();
      
      // Wait for potluck page to load
      await page.waitForTimeout(2000);
      
      // Take screenshot of potluck page
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-potluck.png`,
        fullPage: true 
      });
    });

    test('Navigation menu mobile layout', async ({ page }) => {
      // First login
      await page.goto('http://localhost:5173/login');
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/games', { timeout: 10000 });
      
      // Check if there's a hamburger menu
      const hamburger = page.locator('[aria-label="Menu"], button:has(svg)').first();
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(500);
        
        // Take screenshot with menu open
        await page.screenshot({ 
          path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-menu-open.png`,
          fullPage: false 
        });
      } else {
        // Take screenshot of regular navigation
        await page.screenshot({ 
          path: `screenshots/mobile-${name.replace(/\s+/g, '-')}-navigation.png`,
          fullPage: false 
        });
      }
    });
  });
});

// Also test responsive breakpoints
test.describe('Responsive Breakpoints', () => {
  const breakpoints = [
    { name: 'xs', width: 375, height: 812 },  // iPhone X size
    { name: 'sm', width: 640, height: 1136 }, // Small tablet
    { name: 'md', width: 768, height: 1024 }, // iPad
    { name: 'lg', width: 1024, height: 768 }, // iPad landscape
  ];

  breakpoints.forEach(({ name, width, height }) => {
    test(`Breakpoint ${name} - ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      
      // Test login page
      await page.goto('http://localhost:5173/login');
      await page.screenshot({ 
        path: `screenshots/breakpoint-${name}-login.png`,
        fullPage: true 
      });
      
      // Login and test games page
      await page.fill('input[type="email"]', 'test@texastailgaters.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/games', { timeout: 10000 });
      await page.screenshot({ 
        path: `screenshots/breakpoint-${name}-games.png`,
        fullPage: true 
      });
    });
  });
});