# Texas Tailgaters E2E Test Suite

A comprehensive end-to-end test suite for the Texas Tailgaters application using Playwright.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Setup and Installation](#setup-and-installation)
- [Running Tests](#running-tests)
- [Test Configuration](#test-configuration)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides comprehensive coverage of the Texas Tailgaters application, including:

- **Authentication Tests**: Login, signup, and session management
- **Navigation Tests**: Routing, page navigation, and responsive design
- **Games Functionality**: Schedule sync, game details, and data display
- **Potluck Management**: Item creation, assignment, and organization
- **Admin Features**: Administrative functions and access control
- **Visual Regression**: UI consistency and layout verification

## Test Structure

```
e2e/
├── auth/                          # Authentication tests
│   └── authentication.spec.ts
├── navigation/                    # Navigation and routing tests
│   └── routing.spec.ts
├── games/                         # Games functionality tests
│   └── games-functionality.spec.ts
├── potluck/                       # Potluck management tests
│   └── potluck-functionality.spec.ts
├── admin/                         # Admin functionality tests
│   └── admin-functionality.spec.ts
├── visual/                        # Visual regression tests
│   └── visual-regression.spec.ts
├── utils/                         # Test utilities and helpers
│   ├── test-constants.ts          # Test constants and configuration
│   ├── auth-helpers.ts            # Authentication helper functions
│   ├── nav-helpers.ts             # Navigation helper functions
│   └── test-helpers.ts            # General test utilities
├── pages/                         # Page Object Models
│   ├── BasePage.ts                # Base page class
│   ├── LoginPage.ts               # Login page interactions
│   ├── GamesPage.ts               # Games page interactions
│   ├── PotluckPage.ts             # Potluck page interactions
│   └── AdminPage.ts               # Admin page interactions
├── fixtures/                      # Test data and fixtures
│   └── test-data.ts               # Test data and mock responses
├── playwright.config.ts           # Enhanced Playwright configuration
└── README.md                      # This file
```

## Setup and Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Texas Tailgaters application running locally

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Ensure the application is running:
```bash
npm run dev  # Should run on http://localhost:5173
```

### Environment Setup

Create a `.env.test` file for test-specific configuration:

```env
# Test Environment Configuration
BASE_URL=http://localhost:5173
TEST_ENV=local
TEST_USER_EMAIL=test@texastailgaters.com
TEST_USER_PASSWORD=TestPassword123!

# Optional: API endpoints
API_URL=http://localhost:8000/api

# Optional: CI/CD settings
CI=false
HEADLESS=true
```

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (show browser)
npx playwright test --headed

# Run specific test suite
npx playwright test e2e/auth

# Run single test file
npx playwright test e2e/auth/authentication.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"
```

### Test Suites

The test suite includes predefined configurations for different scenarios:

```bash
# Quick smoke tests (authentication + navigation)
npx playwright test --project=smoke

# Full regression test suite
npx playwright test --project=regression

# Visual regression tests only
npx playwright test e2e/visual

# Mobile device tests
npx playwright test --project=mobile-chrome

# Admin functionality tests (requires admin user)
npx playwright test e2e/admin
```

### Environment-Specific Testing

```bash
# Local development (default)
TEST_ENV=local npx playwright test

# Staging environment
TEST_ENV=staging BASE_URL=https://staging.texastailgaters.com npx playwright test

# Production environment (read-only tests)
TEST_ENV=production BASE_URL=https://texastailgaters.com npx playwright test --project=smoke
```

### Parallel Execution

```bash
# Run with specific number of workers
npx playwright test --workers=4

# Run serially (one test at a time)
npx playwright test --workers=1

# Run specific browser
npx playwright test --project=chromium-desktop
```

## Test Configuration

### Browser Support

The test suite runs against multiple browsers and devices:

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome on Android, Safari on iOS
- **Tablet**: iPad Pro simulation

### Viewport Testing

Tests automatically verify responsive design across:
- Mobile: 375×667px
- Tablet: 768×1024px  
- Desktop: 1920×1080px

### Test Data

Test data is managed through fixtures in `e2e/fixtures/test-data.ts`:

- User credentials for different scenarios
- Sample game and potluck data
- Mock API responses
- Form validation test cases

## Writing Tests

### Page Object Model

Use the provided page objects for maintainable tests:

```typescript
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AuthHelpers } from '../utils/auth-helpers';

test('example test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const authHelpers = new AuthHelpers(page);
  
  await loginPage.navigate();
  await authHelpers.loginAsTestUser();
  
  // Your test logic here
});
```

### Test Structure

Follow this pattern for consistent test organization:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common to all tests in this describe block
  });

  test.describe('Sub-feature', () => {
    test('should do something specific', async () => {
      await test.step('Setup step', async () => {
        // Test setup
      });

      await test.step('Action step', async () => {
        // Perform actions
      });

      await test.step('Verification step', async () => {
        // Verify results
      });
    });
  });
});
```

### Best Practices

1. **Use Page Objects**: Interact with UI through page object methods
2. **Test Steps**: Break complex tests into clear steps
3. **Wait Strategies**: Use proper waiting mechanisms
4. **Data Isolation**: Each test should work independently
5. **Assertions**: Use appropriate Playwright assertions
6. **Error Handling**: Test both success and failure scenarios

### Adding Visual Tests

For visual regression testing:

```typescript
test('visual test example', async ({ page }) => {
  await page.goto('/games');
  
  // Hide dynamic content
  await page.addStyleTag({
    content: '.loading, .animate-spin { display: none !important; }'
  });
  
  await expect(page).toHaveScreenshot('games-page.png', {
    fullPage: true,
    threshold: 0.3
  });
});
```

## Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results and screenshots
- Video recordings of failures
- Performance metrics
- Browser console logs

### JUnit Report

For CI/CD integration, JUnit XML reports are generated:
```
test-results/junit-report.xml
```

### JSON Report

Machine-readable results:
```
test-results/json-report.json
```

## CI/CD Integration

### GitHub Actions

Example workflow configuration:

```yaml
name: E2E Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright
      run: npx playwright install --with-deps
      
    - name: Start application
      run: npm run dev &
      env:
        NODE_ENV: test
        
    - name: Wait for app to start
      run: npx wait-on http://localhost:5173
      
    - name: Run E2E tests
      run: npx playwright test
      env:
        CI: true
        BASE_URL: http://localhost:5173
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-results
        path: |
          test-results/
          playwright-report/
```

### Jenkins

Example Jenkinsfile:

```groovy
pipeline {
    agent any
    
    environment {
        NODE_ENV = 'test'
        BASE_URL = 'http://localhost:5173'
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }
        
        stage('Start App') {
            steps {
                sh 'npm run dev &'
                sh 'npx wait-on http://localhost:5173'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npx playwright test'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report'
                    ])
                }
            }
        }
    }
}
```

### Docker

Run tests in containerized environment:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
```

## Performance Testing

### Metrics Collected

The test suite monitors:
- Page load times
- Time to first contentful paint
- Time to interactive
- Cumulative layout shift
- API response times

### Thresholds

Performance tests will fail if:
- Page load time > 5 seconds
- API response time > 2 seconds
- First contentful paint > 2 seconds
- Time to interactive > 5 seconds

## Accessibility Testing

### Basic Accessibility

Tests automatically verify:
- Form labels and ARIA attributes
- Keyboard navigation
- Color contrast ratios
- Alt text for images

### Enhanced Accessibility

For comprehensive accessibility testing, integrate with axe-playwright:

```bash
npm install @axe-core/playwright
```

## Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout
npx playwright test --timeout=60000
```

**Browser launch failures:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Port conflicts:**
```bash
# Use different port
BASE_URL=http://localhost:3000 npx playwright test
```

**Visual test failures:**
```bash
# Update screenshots
npx playwright test --update-snapshots
```

### Debug Mode

```bash
# Run with debug
npx playwright test --debug

# Show browser during test
npx playwright test --headed

# Slow motion
npx playwright test --headed --slowMo=500
```

### Test Isolation Issues

If tests interfere with each other:

```bash
# Run serially
npx playwright test --workers=1

# Clear storage between tests
# Add to test setup:
await context.clearCookies();
await context.clearPermissions();
```

### Performance Issues

For slow tests:

```bash
# Run specific browser only
npx playwright test --project=chromium-desktop

# Disable video recording
npx playwright test --config=playwright.config.fast.ts
```

## Contributing

When adding new tests:

1. Follow the established file structure
2. Use existing page objects when possible
3. Add new page objects for new pages
4. Include both positive and negative test cases
5. Add appropriate visual regression tests
6. Update this README with new features

## Support

For issues or questions:
- Check existing test failures in CI/CD
- Review Playwright documentation: https://playwright.dev
- Check project issues and documentation
- Contact the development team

---

**Last Updated**: January 2025
**Playwright Version**: 1.40+
**Node.js Version**: 18+