// IMPORTANT: These test users are configured in the application code
// Admin users are hardcoded in:
// - src/services/authService.ts (mapFirebaseUser method)
// - src/pages/AdminPage.tsx (isUserAdmin check)
// 
// DO NOT CHANGE these without updating the corresponding application files
export const testUsers = {
  admin: {
    email: 'corbyjames@gmail.com',
    password: '$4Xanadu4M3e',
    name: 'Corby James',
    role: 'admin'
  },
  testAdmin: {
    email: 'testadmin@texastailgaters.com',
    password: 'TestAdmin123!',
    name: 'Test Admin',
    role: 'admin'
  },
  member: {
    email: 'test@texastailgaters.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'member'  // Note: This user has admin access in the app but we use it as member for tests
  },
  newUser: {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'New Test User',
    role: 'member'
  }
};