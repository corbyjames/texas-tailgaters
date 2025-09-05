import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright Configuration for Texas Tailgaters E2E Tests
 * Supports multiple environments and comprehensive test execution
 */

// Environment configuration
const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const isCI = !!process.env.CI;
const testEnv = process.env.TEST_ENV || 'local';

// Test directories configuration
const testDirs = [
  './e2e/auth',
  './e2e/navigation', 
  './e2e/games',
  './e2e/potluck',
  './e2e/admin',
  './e2e/visual'
];

export default defineConfig({
  testDir: './e2e',
  
  // Global test configuration
  fullyParallel: !isCI, // Run in parallel locally, serial in CI for stability
  forbidOnly: !!isCI,
  retries: isCI ? 3 : 1, // More retries in CI
  workers: isCI ? 2 : 4, // Fewer workers in CI
  timeout: 45000, // 45 second timeout per test
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'html-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit-report.xml' }],
    ['json', { outputFile: 'test-results/json-report.json' }],
    isCI ? ['github'] : ['line']
  ],

  // Global test settings
  use: {
    baseURL,
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    colorScheme: 'light',
    
    // Performance settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Test isolation
    storageState: undefined // Ensure clean state for each test
  },

  // Environment-specific configuration
  ...(testEnv === 'staging' && {
    use: {
      baseURL: 'https://staging.texastailgaters.com',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${process.env.STAGING_API_TOKEN}`
      }
    }
  }),

  ...(testEnv === 'production' && {
    use: {
      baseURL: 'https://texastailgaters.com'
    },
    // More conservative settings for production
    timeout: 60000,
    retries: 5,
    workers: 1
  }),

  // Test projects for different browsers and devices
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },

    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/
    },

    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Tablet devices
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Visual regression tests (Chromium only)
    {
      name: 'visual-regression',
      use: { ...devices['Desktop Chrome'] },
      testDir: './e2e/visual',
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Admin tests (requires admin user)
    {
      name: 'admin-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*admin.*\.spec\.ts/,
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Smoke tests for quick validation
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*smoke.*\.spec\.ts/,
      dependencies: testEnv === 'local' ? ['setup'] : []
    },

    // Performance tests
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance-specific settings
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows'
          ]
        }
      },
      testMatch: /.*performance.*\.spec\.ts/
    }
  ],

  // Web server configuration
  webServer: testEnv === 'local' ? {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !isCI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test'
    }
  } : undefined,

  // Output directories
  outputDir: 'test-results/',
  
  // Test patterns
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts'
  ],

  // Files to ignore
  testIgnore: [
    '**/*.d.ts',
    '**/node_modules/**'
  ],

  // Expect configuration for visual testing
  expect: {
    // Visual comparison threshold
    toHaveScreenshot: { threshold: 0.2, mode: 'rgb' },
    toMatchScreenshot: { threshold: 0.2, mode: 'rgb' },
    
    // General assertion timeout
    timeout: 10000
  },

  // Metadata for reporting
  metadata: {
    testEnv,
    baseURL,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }
});

// Configuration for different test suites
export const testSuites = {
  // Quick smoke test suite
  smoke: {
    testDir: './e2e',
    testMatch: [
      '**/auth/authentication.spec.ts',
      '**/navigation/routing.spec.ts'
    ],
    workers: 2,
    timeout: 30000
  },

  // Full regression test suite
  regression: {
    testDir: './e2e',
    testMatch: ['**/*.spec.ts'],
    workers: isCI ? 2 : 4,
    timeout: 45000
  },

  // Visual-only test suite
  visual: {
    testDir: './e2e/visual',
    testMatch: ['**/*.spec.ts'],
    workers: 1, // Visual tests should run serially
    timeout: 60000
  },

  // Mobile-only test suite
  mobile: {
    testDir: './e2e',
    projects: ['mobile-chrome', 'mobile-safari'],
    timeout: 60000
  },

  // Performance test suite
  performance: {
    testDir: './e2e',
    testMatch: ['**/*performance*.spec.ts'],
    workers: 1,
    timeout: 90000
  }
};