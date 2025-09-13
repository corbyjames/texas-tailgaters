# Test Suite Maintenance Guide

## Overview
This document provides guidelines for maintaining and updating the Playwright regression test suite for the Texas Tailgaters application.

## Test Structure

```
tests/
├── regression/          # Main regression test suite
│   ├── auth.spec.ts    # Authentication tests
│   ├── games.spec.ts   # Games functionality
│   ├── potluck.spec.ts # Potluck management
│   ├── admin.spec.ts   # Admin features
│   └── mobile-navigation.spec.ts # Mobile-specific tests
├── fixtures/           # Test data and fixtures
│   └── users.ts       # Test user credentials
└── helpers/           # Utility functions
    └── auth.ts        # Authentication helpers
```

## Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run regression suite only
npm run test:regression

# Run mobile tests only
npm run test:mobile

# Run desktop tests only
npm run test:desktop

# Run tests with UI
npm run test:ui

# Run headed (see browser)
npm run test:headed

# View test report
npm run test:report
```

### CI/CD Pipeline
Tests automatically run:
1. After each build (`postbuild` script)
2. On push to main branch
3. On pull requests
4. Daily at 2 AM UTC (scheduled)

## Adding New Tests

### 1. Create Test File
Create a new spec file in `tests/regression/`:
```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'member');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 2. Mobile-Specific Tests
For mobile-specific behavior:
```typescript
test.describe('Mobile Feature', () => {
  test.use({ ...devices['iPhone 14'] });
  
  test('should work on mobile', async ({ page }) => {
    // Mobile-specific test
  });
});
```

### 3. Data-Driven Tests
Use fixtures for test data:
```typescript
import { testUsers } from '../fixtures/users';

test('should login', async ({ page }) => {
  await page.fill('input[type="email"]', testUsers.member.email);
});
```

## Best Practices

### 1. Selector Strategy
- Use semantic selectors: `text=`, `role=`, `placeholder=`
- Add data-testid for complex elements
- Avoid fragile CSS selectors

### 2. Wait Strategies
```typescript
// Good - wait for specific condition
await expect(page.locator('text=Success')).toBeVisible();

// Avoid - arbitrary waits
await page.waitForTimeout(5000);
```

### 3. Test Isolation
- Each test should be independent
- Use `test.beforeEach` for setup
- Clean up test data when needed

### 4. Mobile vs Desktop
- Test responsive behavior
- Check touch vs click interactions
- Verify mobile-specific UI elements

## Updating Tests After Code Changes

### 1. Component Changes
When UI components change:
1. Update selectors in affected tests
2. Verify mobile and desktop variants
3. Update screenshots if using visual testing

### 2. New Features
When adding features:
1. Add tests for happy path
2. Add tests for error cases
3. Test on mobile and desktop
4. Update regression suite

### 3. API Changes
When endpoints change:
1. Update test data fixtures
2. Verify authentication flow
3. Update API mocking if used

## Debugging Failed Tests

### 1. Local Debugging
```bash
# Debug specific test
npx playwright test --debug tests/regression/auth.spec.ts

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### 2. CI Failures
1. Check artifacts in GitHub Actions
2. Download playwright-report
3. Review screenshots and videos
4. Check for environment differences

## Test Categories

### Smoke Tests
Critical path tests that must pass:
- Login/Logout
- View games list
- Basic navigation

### Regression Tests
Comprehensive feature testing:
- All user workflows
- Admin functions
- Mobile responsiveness
- Error handling

### Visual Tests
Screenshot comparisons:
- Component rendering
- Mobile layouts
- Theme consistency

## Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:5173
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test123!
CI=false
```

## Maintenance Schedule

### Daily
- Automated regression runs
- Review failed tests
- Update flaky test tracking

### Weekly
- Review test coverage
- Update test data
- Clean up obsolete tests

### Monthly
- Performance audit
- Update dependencies
- Review test architecture

## Common Issues and Solutions

### Issue: Tests fail on CI but pass locally
**Solution:** Check for:
- Environment variables
- Network dependencies
- Timing issues
- Browser differences

### Issue: Flaky tests
**Solution:**
- Add explicit waits
- Increase timeout for slow operations
- Use retry mechanism
- Mock external dependencies

### Issue: Mobile tests failing
**Solution:**
- Verify viewport settings
- Check touch event simulation
- Review responsive breakpoints
- Test actual devices if possible

## Contact

For test suite questions or issues:
- Create GitHub issue with `test` label
- Include test name and error message
- Attach screenshots/traces if available