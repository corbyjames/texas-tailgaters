/**
 * Test Constants for Texas Tailgaters Application
 */

export const TEST_USERS = {
  STANDARD: {
    email: 'test@texastailgaters.com',
    password: 'TestPassword123!'
  },
  ADMIN: {
    email: 'test@texastailgaters.com', // Same user with admin privileges
    password: 'TestPassword123!'
  },
  INVALID: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
} as const;

export const URLS = {
  BASE: 'http://localhost:5173',
  LOGIN: 'http://localhost:5173/login',
  HOME: 'http://localhost:5173/',
  GAMES: 'http://localhost:5173/games',
  POTLUCK: 'http://localhost:5173/potluck',
  ADMIN: 'http://localhost:5173/admin',
  PROFILE: 'http://localhost:5173/profile'
} as const;

export const TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 3000,
  LONG: 5000,
  EXTRA_LONG: 10000
} as const;

export const VIEWPORT_SIZES = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1920, height: 1080 },
  LARGE_DESKTOP: { width: 2560, height: 1440 }
} as const;

export const TEST_DATA = {
  POTLUCK_ITEM: {
    name: 'Test BBQ Brisket',
    category: 'main',
    servingSize: 'Serves 15-20',
    description: 'Slow smoked brisket with homemade BBQ sauce',
    dietaryFlags: ['gluten-free']
  },
  GAME_SEARCH: {
    opponent: 'Oklahoma',
    date: '2024-10-12'
  }
} as const;

export const SELECTORS = {
  // Common selectors
  LOADING_SPINNER: '.animate-spin',
  ERROR_MESSAGE: '.text-red-500, .text-red-600, .error, [role="alert"]',
  
  // Authentication
  EMAIL_INPUT: 'input[type="email"]',
  PASSWORD_INPUT: 'input[type="password"]',
  SIGN_IN_BUTTON: 'button:has-text("Sign In")',
  SIGN_UP_BUTTON: 'button:has-text("Sign up")',
  
  // Navigation
  NAV_GAMES: 'text=Games',
  NAV_POTLUCK: 'text=Potluck',
  NAV_ADMIN: 'text=Admin',
  NAV_PROFILE: 'text=Profile',
  
  // Games
  SYNC_GAMES_BUTTON: 'button:has-text("Sync Games")',
  GAME_CARD: '[data-testid="game-card"]',
  
  // Potluck
  ADD_ITEM_BUTTON: 'button:has-text("Add Item")',
  POTLUCK_ITEM_NAME: 'input[placeholder*="BBQ Brisket"]',
  CATEGORY_SELECT: 'select',
  SERVING_SIZE_INPUT: 'input[placeholder*="Serves"]',
  DESCRIPTION_TEXTAREA: 'textarea',
  ASSIGN_BUTTON: 'button:has-text("I\'ll bring this")',
  
  // Admin
  ADMIN_PANEL: '[data-testid="admin-panel"]',
  USER_LIST: '[data-testid="user-list"]'
} as const;