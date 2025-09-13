export const testUsers = {
  admin: {
    email: 'test@texastailgaters.com',
    password: 'Test123!',
    name: 'Test Admin',
    role: 'admin'
  },
  member: {
    email: 'member@test.com',
    password: 'Test123!',
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