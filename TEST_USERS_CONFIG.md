# Test Users Configuration

## IMPORTANT: DO NOT MODIFY WITHOUT UPDATING SOURCE CODE

This document defines the test users used in the Texas Tailgaters application. These users are **hardcoded** in the application source code and must be kept in sync.

## Admin Users

The following users have admin privileges and are hardcoded in:
- `src/services/authService.ts` (line 43-48 in mapFirebaseUser method)
- `src/pages/AdminPage.tsx` (line 40-44 in isUserAdmin check)

### Production Admin
- **Email**: corbyjames@gmail.com
- **Password**: $4Xanadu4M3e
- **Role**: admin
- **Purpose**: Production admin account

### Test Admin
- **Email**: testadmin@texastailgaters.com
- **Password**: TestAdmin123!
- **Role**: admin
- **Purpose**: Dedicated test admin for Playwright tests

### Dual-Purpose Test User
- **Email**: test@texastailgaters.com
- **Password**: TestPassword123!
- **Role**: admin (in app) / member (in tests)
- **Purpose**: Can be used as either admin or member in tests

## Regular Test Users

### Member Test User
- **Email**: testmember@texastailgaters.com
- **Password**: TestMember123!
- **Role**: member
- **Purpose**: Standard member for testing non-admin features

## Files That Must Be Updated Together

When adding or modifying test users with admin access, update ALL of these files:

1. **src/services/authService.ts**
   - Update the `adminEmails` array in `mapFirebaseUser` method

2. **src/pages/AdminPage.tsx**
   - Update the `isUserAdmin` check to include the email

3. **tests/fixtures/users.ts**
   - Update the test user fixtures

4. **TEST_USERS_CONFIG.md** (this file)
   - Document the changes

## Testing Guidelines

1. Use `corbyjames@gmail.com` for production admin testing
2. Use `testadmin@texastailgaters.com` for automated test suites requiring admin
3. Use `test@texastailgaters.com` when you need flexibility (it has admin access but can simulate member behavior)
4. Never use production admin credentials in automated tests

## Common Mistakes to Avoid

1. **DO NOT** assume changing `tests/fixtures/users.ts` alone will grant admin access
2. **DO NOT** remove emails from the hardcoded lists without checking all dependent tests
3. **DO NOT** use different passwords than documented here - they won't work
4. **ALWAYS** update both authService.ts and AdminPage.tsx when adding admin users

## Verification

To verify a user has admin access:
1. Sign in with the user credentials
2. Navigate to `/admin`
3. If redirected to home page, the user lacks admin access
4. Check browser console for "Is user admin?" log message

Last Updated: 2025-09-13