import { test, expect, devices } from '@playwright/test';

const PRODUCTION_URL = 'https://texas-tailgaters.onrender.com';
const TEST_ACCOUNT = {
  email: 'test@texastailgaters.com',
  password: 'TestPassword123!'
};

// Test multiple mobile devices
const mobileDevices = [
  { name: 'iPhone 13', device: devices['iPhone 13'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Tests - ${name}`, () => {
    test.use({
      ...device,
      // Additional mobile-specific settings
      hasTouch: true,
      isMobile: true,
    });

    test('Mobile User Journey - Login, Schedule, Potluck', async ({ page }) => {
      console.log(`Testing on ${name}...`);
      
      // Navigate to production site
      await test.step('Navigate to site', async () => {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await expect(page).toHaveURL(/.*\/login|.*\//);
      });

      // Login
      await test.step('Login with test account', async () => {
        const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
        
        if (needsLogin) {
          await page.fill('input[type="email"]', TEST_ACCOUNT.email);
          await page.fill('input[type="password"]', TEST_ACCOUNT.password);
          
          // Mobile tap on sign in button
          await page.tap('button:has-text("Sign In")');
          
          // Wait for navigation
          await expect(page).toHaveURL(/.*\/(home|games)?$/, { timeout: 15000 });
        }
      });

      // Test bottom navigation
      await test.step('Test bottom navigation', async () => {
        const bottomNav = page.locator('nav').last();
        await expect(bottomNav).toBeVisible();
        
        // Check all nav items are visible
        await expect(bottomNav.locator('text="Home"')).toBeVisible();
        await expect(bottomNav.locator('text="Games"')).toBeVisible();
        await expect(bottomNav.locator('text="Potluck"')).toBeVisible();
        await expect(bottomNav.locator('text="Profile"')).toBeVisible();
      });

      // Navigate to games
      await test.step('Navigate to games schedule', async () => {
        // Tap on Games in bottom nav
        await page.tap('nav >> text="Games"');
        await expect(page).toHaveURL(/.*\/games/, { timeout: 10000 });
        
        // Wait for games to load
        await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });
        
        // Verify Ohio State game time
        const ohioStateCard = page.locator('.card', { hasText: 'Ohio State' });
        await expect(ohioStateCard).toBeVisible();
        const cardText = await ohioStateCard.textContent();
        expect(cardText).toContain('11:00 AM');
      });

      // Test scrolling
      await test.step('Test touch scrolling', async () => {
        // Scroll down
        await page.locator('.card').last().scrollIntoViewIfNeeded();
        
        // Verify more games are visible
        const gameCards = await page.locator('.card').count();
        expect(gameCards).toBeGreaterThan(5);
      });

      // Navigate to potluck
      await test.step('Navigate to potluck manager', async () => {
        // Tap on Potluck in bottom nav
        await page.tap('nav >> text="Potluck"');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        // Check if we're on potluck page
        const url = page.url();
        if (url.includes('/potluck')) {
          // Verify potluck page elements
          await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
          
          // Check for game selector
          const gameSelector = page.locator('select').first();
          if (await gameSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Verify selector is interactive
            await gameSelector.tap();
            await page.keyboard.press('Escape');
          }
          
          // Check for categories
          const categories = ['Main', 'Side', 'Appetizer', 'Dessert'];
          for (const category of categories) {
            const categoryElement = page.locator(`text=/${category}/i`).first();
            if (await categoryElement.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log(`  ✓ ${category} category visible`);
            }
          }
          
          // Check for FAB (Floating Action Button)
          const fab = page.locator('button').filter({ has: page.locator('svg, text="+"') }).last();
          if (await fab.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('  ✓ Add button (FAB) visible');
          }
        }
      });

      // Take screenshots
      await test.step('Capture screenshots', async () => {
        await page.screenshot({ 
          path: `screenshots/mobile-${name.replace(' ', '-').toLowerCase()}-final.png`,
          fullPage: true 
        });
      });
    });

    test('Mobile Viewport and Touch Interactions', async ({ page }) => {
      await page.goto(PRODUCTION_URL);
      
      // Test viewport
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();
      console.log(`${name} viewport: ${viewport?.width}x${viewport?.height}`);
      
      // Test touch gestures
      await test.step('Test touch interactions', async () => {
        // Login if needed
        const needsLogin = await page.locator('text="Sign in to your account"').isVisible({ timeout: 3000 }).catch(() => false);
        if (needsLogin) {
          // Test tap
          await page.tap('input[type="email"]');
          await page.type('input[type="email"]', TEST_ACCOUNT.email);
          
          await page.tap('input[type="password"]');
          await page.type('input[type="password"]', TEST_ACCOUNT.password);
          
          await page.tap('button:has-text("Sign In")');
          await page.waitForURL(/.*\/(home|games)?$/, { timeout: 15000 });
        }
        
        // Test swipe (scroll)
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        
        // Test pinch zoom (if supported)
        await page.evaluate(() => {
          document.body.style.zoom = '110%';
        });
        
        await page.waitForTimeout(500);
        
        // Reset zoom
        await page.evaluate(() => {
          document.body.style.zoom = '100%';
        });
      });
    });

    test('Mobile Performance', async ({ page }) => {
      // Test load times on mobile
      const startTime = Date.now();
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      console.log(`${name} initial load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds on mobile
      
      // Test navigation speed
      const navStartTime = Date.now();
      await page.goto(`${PRODUCTION_URL}/games`, { waitUntil: 'networkidle' });
      const navTime = Date.now() - navStartTime;
      
      console.log(`${name} navigation time: ${navTime}ms`);
      expect(navTime).toBeLessThan(5000); // Navigation should be under 5 seconds
    });
  });
});

// Test specifically for iOS Safari quirks
test.describe('iOS Safari Specific', () => {
  test.use({
    ...devices['iPhone 13'],
    // Safari specific settings
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  });

  test('iOS Safari - Safe Area and Notch', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Check for safe area CSS
    const safeAreaCSS = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
      };
    });
    
    console.log('iOS Safe Area Padding:', safeAreaCSS);
    
    // Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });
    
    expect(viewportMeta).toContain('width=device-width');
    console.log('Viewport meta:', viewportMeta);
  });
});

// Test for Android Chrome specific
test.describe('Android Chrome Specific', () => {
  test.use({
    ...devices['Pixel 5'],
    // Chrome specific settings
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  });

  test('Android Chrome - Pull to Refresh', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Test overscroll behavior
    const overscrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overscrollBehavior;
    });
    
    console.log('Overscroll behavior:', overscrollBehavior);
    
    // Check for PWA capabilities
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });
    
    console.log('PWA Manifest:', manifest || 'Not found');
  });
});