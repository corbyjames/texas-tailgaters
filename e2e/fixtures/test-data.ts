/**
 * Test Data Fixtures for Texas Tailgaters E2E Tests
 * Provides consistent test data across all test suites
 */

export const testUsers = {
  standard: {
    email: 'test@texastailgaters.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user'
  },
  admin: {
    email: 'admin@texastailgaters.com',
    password: 'AdminPassword123!',
    name: 'Admin User', 
    role: 'admin'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    name: 'Invalid User',
    role: 'none'
  }
};

export const gameData = {
  upcomingGame: {
    opponent: 'Oklahoma Sooners',
    date: '2024-10-12',
    time: '11:00 AM',
    location: 'Austin, TX',
    tvNetwork: 'ABC',
    gameType: 'home'
  },
  pastGame: {
    opponent: 'Rice Owls',
    date: '2024-09-21',
    time: '7:00 PM',
    location: 'Austin, TX',
    tvNetwork: 'LHN',
    gameType: 'home',
    result: 'W 45-18'
  },
  rivalryGame: {
    opponent: 'Texas A&M Aggies',
    date: '2024-11-30',
    time: '2:30 PM',
    location: 'College Station, TX',
    tvNetwork: 'ESPN',
    gameType: 'away'
  }
};

export const potluckItems = {
  mainDish: {
    name: 'BBQ Brisket',
    category: 'main',
    servingSize: 'Serves 15-20',
    description: 'Slow smoked brisket with homemade BBQ sauce',
    dietaryFlags: ['gluten-free'],
    estimatedCost: '$50',
    prepTime: '12 hours'
  },
  sideDish: {
    name: 'Loaded Potato Salad',
    category: 'side',
    servingSize: 'Serves 12',
    description: 'Creamy potato salad with bacon and chives',
    dietaryFlags: ['vegetarian'],
    estimatedCost: '$15',
    prepTime: '1 hour'
  },
  dessert: {
    name: 'Chocolate Chip Cookies',
    category: 'dessert',
    servingSize: '24 cookies',
    description: 'Homemade chocolate chip cookies',
    dietaryFlags: ['vegetarian'],
    estimatedCost: '$10',
    prepTime: '45 minutes'
  },
  beverage: {
    name: 'Sweet Tea',
    category: 'beverage',
    servingSize: '1 gallon',
    description: 'Traditional Texas sweet tea',
    dietaryFlags: ['vegan', 'gluten-free'],
    estimatedCost: '$5',
    prepTime: '30 minutes'
  },
  veganOption: {
    name: 'Quinoa Power Bowl',
    category: 'main',
    servingSize: 'Serves 10',
    description: 'Nutritious quinoa bowl with roasted vegetables',
    dietaryFlags: ['vegan', 'gluten-free'],
    estimatedCost: '$20',
    prepTime: '1 hour'
  },
  allergyFriendly: {
    name: 'Fruit Salad Medley',
    category: 'dessert',
    servingSize: 'Serves 15',
    description: 'Fresh seasonal fruit salad',
    dietaryFlags: ['vegan', 'gluten-free', 'nut-free'],
    estimatedCost: '$18',
    prepTime: '20 minutes'
  }
};

export const formValidationData = {
  validEmail: 'test@example.com',
  invalidEmails: [
    'invalid',
    'invalid@',
    '@invalid.com',
    'spaces in@email.com',
    'special#chars@email.com'
  ],
  validPasswords: [
    'Password123!',
    'SecurePass1@',
    'MyPassword2024#'
  ],
  invalidPasswords: [
    '123',
    'password',
    'PASSWORD',
    'Pass123',
    '!@#$%^&*'
  ],
  validNames: [
    'John Doe',
    'Mary Jane Smith',
    'José García'
  ],
  invalidNames: [
    '',
    'A',
    '123',
    '!@#$'
  ]
};

export const searchTestData = {
  gameSearchTerms: [
    'Oklahoma',
    'Sooners', 
    'Nov',
    '2024',
    'ESPN',
    'Red River'
  ],
  potluckSearchTerms: [
    'BBQ',
    'Brisket',
    'dessert',
    'vegan',
    'gluten'
  ],
  noResultsTerms: [
    'xyzzyx',
    '9999',
    'nonexistent',
    'qwerty123'
  ]
};

export const mockApiResponses = {
  gamesSuccess: {
    games: [
      {
        id: '1',
        opponent: 'Oklahoma Sooners',
        date: '2024-10-12',
        time: '11:00 AM',
        location: 'Austin, TX',
        tv_network: 'ABC',
        game_type: 'home'
      },
      {
        id: '2', 
        opponent: 'Rice Owls',
        date: '2024-09-21',
        time: '7:00 PM',
        location: 'Austin, TX',
        tv_network: 'LHN',
        game_type: 'home'
      }
    ]
  },
  gamesError: {
    error: 'Failed to fetch games',
    code: 500,
    message: 'Internal server error'
  },
  potluckSuccess: {
    items: [
      {
        id: '1',
        name: 'BBQ Brisket',
        category: 'main',
        servingSize: 'Serves 15-20',
        description: 'Slow smoked brisket',
        assignedTo: null,
        dietaryFlags: ['gluten-free']
      }
    ]
  },
  potluckError: {
    error: 'Failed to fetch potluck items',
    code: 500
  },
  authSuccess: {
    user: {
      id: '1',
      email: 'test@texastailgaters.com',
      name: 'Test User',
      role: 'user'
    },
    token: 'mock-jwt-token'
  },
  authError: {
    error: 'Invalid credentials',
    code: 401
  },
  syncSuccess: {
    message: 'Games synced successfully',
    count: 12,
    lastSync: '2024-01-15T10:00:00Z'
  },
  syncError: {
    error: 'Sync failed',
    code: 503,
    message: 'Service temporarily unavailable'
  }
};

export const performanceThresholds = {
  pageLoadTime: 5000,      // 5 seconds max
  apiResponseTime: 2000,   // 2 seconds max
  firstContentfulPaint: 2000, // 2 seconds max
  timeToInteractive: 5000, // 5 seconds max
  cumulativeLayoutShift: 0.1, // CLS score
  firstInputDelay: 100     // 100ms max
};

export const accessibilityTestData = {
  requiredAriaLabels: [
    'Main navigation',
    'User menu',
    'Search',
    'Close dialog'
  ],
  keyboardNavigationElements: [
    'button',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ],
  colorContrastPairs: [
    { background: '#ffffff', text: '#000000' },
    { background: '#bf5700', text: '#ffffff' }, // UT Orange
    { background: '#333333', text: '#ffffff' }
  ]
};

export const responsiveBreakpoints = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 },
  ultraWide: { width: 2560, height: 1440 }
};

export const testEnvironments = {
  local: {
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:8000/api',
    timeout: 30000
  },
  staging: {
    baseUrl: 'https://staging.texastailgaters.com',
    apiUrl: 'https://api-staging.texastailgaters.com',
    timeout: 45000
  },
  production: {
    baseUrl: 'https://texastailgaters.com',
    apiUrl: 'https://api.texastailgaters.com',
    timeout: 60000
  }
};

// Helper functions for test data generation
export const generateTestUser = (suffix: string = Date.now().toString()) => ({
  email: `test${suffix}@texastailgaters.com`,
  password: 'TestPassword123!',
  name: `Test User ${suffix}`,
  role: 'user'
});

export const generatePotluckItem = (name: string, category: string = 'main') => ({
  name,
  category,
  servingSize: 'Serves 10',
  description: `Test ${category} item: ${name}`,
  dietaryFlags: [],
  estimatedCost: '$15',
  prepTime: '1 hour'
});

export const generateGameData = (opponent: string, date: string = '2024-12-01') => ({
  opponent,
  date,
  time: '2:30 PM',
  location: 'Austin, TX',
  tvNetwork: 'ESPN',
  gameType: 'home'
});