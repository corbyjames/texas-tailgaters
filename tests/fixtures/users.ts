// IMPORTANT: These test users are configured in the application code
// Admin users are hardcoded in:
// - src/services/authService.ts (mapFirebaseUser method)
// - src/pages/AdminPage.tsx (isUserAdmin check)
// 
// DO NOT CHANGE these without updating the corresponding application files
export const testUsers = {
  admin: {
    email: 'test@texastailgaters.com',  // Primary test admin account
    password: '4Xanadu#3',
    name: 'Test Admin',
    role: 'admin'
  },
  testAdmin: {
    email: 'test@texastailgaters.com',  // Same as admin - this is the correct test account
    password: '4Xanadu#3',
    name: 'Test Admin',
    role: 'admin'
  },
  member: {
    email: 'testmember@texastailgaters.com',
    password: 'TestMember123!',
    name: 'Test Member',
    role: 'member'
  },
  newUser: {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'New Test User',
    role: 'member'
  }
};