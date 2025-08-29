# Texas Tailgaters Project Context

## Project Overview
Texas Tailgaters is a web application for managing University of Texas football tailgate events. The app helps organize potluck items, track game schedules, manage attendees, and coordinate tailgate themes.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Authentication & Realtime Database)
- **Deployment**: Render.com (Docker container with Node 20)
- **Testing**: Playwright for E2E tests
- **Version Control**: GitHub (https://github.com/corbyjames/texas-tailgaters.git)

## Firebase Configuration
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBJascYs4rXD4uL5Z8F7RDkMOBhQtjehic",
  authDomain: "texas-tailgaters.firebaseapp.com",
  databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
  projectId: "texas-tailgaters",
  storageBucket: "texas-tailgaters.appspot.com",
  messagingSenderId: "517392756353",
  appId: "1:517392756353:web:texas-tailgaters-web"
};
```

## Database Structure

### Firebase Realtime Database Schema
```
texas-tailgaters/
├── games/
│   └── {gameId}/
│       ├── date: string (YYYY-MM-DD)
│       ├── time: string
│       ├── opponent: string
│       ├── location: string
│       ├── is_home: boolean
│       ├── tv_network: string
│       ├── theme_id: string (optional)
│       ├── status: string ('planned' | 'unplanned' | 'watch-party')
│       ├── expected_attendance: number
│       ├── setup_time: string
│       ├── created_at: string (ISO)
│       └── updated_at: string (ISO)
├── themes/
│   └── {themeId}/
│       ├── name: string
│       ├── description: string
│       ├── opponent: string
│       ├── colors: string[]
│       ├── food_suggestions: string[]
│       ├── is_custom: boolean
│       └── created_at: string (ISO)
├── potluck_items/
│   └── {itemId}/
│       ├── game_id: string
│       ├── name: string
│       ├── category: string
│       ├── quantity: string
│       ├── description: string
│       ├── assigned_to: string (email)
│       ├── is_admin_assigned: boolean
│       ├── dietary_flags: string[]
│       └── created_at: string (ISO)
└── users/
    └── {userId}/
        ├── email: string
        ├── name: string
        ├── role: string ('admin' | 'member')
        └── created_at: string (ISO)
```

## Key Features

### 1. Authentication
- Firebase Authentication with email/password
- Test user: test@texastailgaters.com / TestPassword123!
- Session persistence using Firebase
- Admin vs regular user roles

### 2. Games Management
- Display UT football schedule (2024 and 2025 seasons)
- Sync schedule from hardcoded data (ScheduleSyncService)
- TV network display with specific assignments (FOX for Ohio State, ABC for Oklahoma, etc.)
- Game status tracking (planned/unplanned/watch-party)
- Theme assignment for each game

### 3. Potluck Coordination
- Add/edit/delete potluck items
- Categories: Main Dish, Side, Appetizer, Dessert, Drinks, Condiments, Other
- Item assignment ("I'll bring this" functionality)
- Dietary flags support (vegetarian, vegan, gluten-free, etc.)
- Track assigned vs unassigned items per game

### 4. UI Components
- GameCard: Shows game info with sum of potluck items + expected attendees
- GameHeader: Displays team logos, TV network, home/away status
- PotluckPage: Full potluck management interface
- AdminPage: User management and system settings

### 5. Services Architecture
```
src/services/
├── authService.ts       - Firebase authentication
├── firebaseService.ts    - Firebase database operations
├── gameService.ts        - Game CRUD operations
├── potluckService.ts     - Potluck item management
├── scheduleSync.ts       - UT schedule data and sync
├── teamLogos.ts          - Team branding information
└── emailService.ts       - EmailJS integration
```

## Important Implementation Details

### Field Name Mapping
- Database uses snake_case: `tv_network`, `is_home`, `expected_attendance`
- Frontend uses camelCase: `tvNetwork`, `isHome`, `expectedAttendance`
- FirebaseService handles conversion between formats

### Recently Fixed Issues
1. **Potluck Assignment**: Added missing `assignPotluckItem` and `unassignPotluckItem` methods
2. **TV Network Display**: Fixed field mapping and added proper network assignments
3. **Sum Display**: Added total count (items + attendees) to game cards
4. **Node Version**: Updated to Node 20 for Firebase compatibility
5. **TypeScript Config**: Added missing tsconfig.json files

### Data Cleaning
Firebase doesn't accept undefined values, so all data is cleaned before saving:
```javascript
const cleanData: any = {};
Object.keys(data).forEach(key => {
  if ((data as any)[key] !== undefined) {
    cleanData[key] = (data as any)[key];
  }
});
```

## 2025 Season TV Networks
- **Ohio State** (Aug 30): FOX - Prime time opener
- **Oklahoma** (Oct 11): ABC - Red River Rivalry
- **Georgia** (Oct 18): CBS - SEC Game of the Week
- **Texas A&M** (Nov 29): ABC - Rivalry game
- **Mississippi State**: ESPN
- **San Jose State**: Longhorn Network
- **UTSA**: ESPN+
- **Vanderbilt, Kentucky, Colorado State**: SEC Network
- **Florida**: ESPN
- **Arkansas**: ABC/ESPN

## Test Infrastructure
- Comprehensive Playwright test suite in `/e2e` directory
- Page Object Models for maintainability
- Test helpers for authentication and navigation
- Visual regression tests
- Multi-browser support (Chrome, Firefox, Safari)
- Mobile device testing

## Deployment Configuration

### Render.com Setup
- **Service Type**: Docker Web Service or Static Site
- **Node Version**: 20 (required for Firebase)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Dockerfile**: Multi-stage build with Node 20 and Nginx

### Environment Variables Needed
- None required for basic functionality (Firebase config is public)
- For production: Consider adding environment-specific Firebase configs

## Development Commands
```bash
# Local development
npm run dev              # Start Vite dev server on port 5173

# Testing
npm run test:e2e         # Run Playwright tests
npm run test:smoke       # Quick smoke tests
npm run test:visual      # Visual regression tests

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment
git push origin main     # Triggers Render deployment
```

## Known URLs
- **Local**: http://localhost:5173
- **GitHub**: https://github.com/corbyjames/texas-tailgaters
- **Firebase Console**: https://console.firebase.google.com/project/texas-tailgaters
- **Render Dashboard**: Configure with API key: rnd_mFPjhdLcr078PMUvubLB58EqgAIl

## Test Pages Created
- `create-test-user.html` - Create test user in Firebase Auth
- `manual-test-sync.html` - Manual schedule sync testing
- `test-potluck.html` - Potluck functionality testing
- `test-game-stats.html` - Game statistics and attendance testing
- `update-tv-networks.html` - Update TV network assignments

## Common Issues and Solutions

### Issue: "I'll bring this" button not working
**Solution**: Ensure `assignPotluckItem` and `unassignPotluckItem` methods exist in PotluckService

### Issue: TV networks not displaying
**Solution**: Check field name mapping (tv_network vs tvNetwork) in FirebaseService

### Issue: Sum showing 0 for games
**Solution**: Ensure `getGamePotluckStats` method exists and expected_attendance is set

### Issue: Firebase permission denied
**Solution**: Database rules should be in test mode or properly configured for authentication

### Issue: Build fails on Render
**Solution**: Ensure Node 20 is used and tsconfig.json exists

## Future Enhancements
- [ ] Real-time schedule sync from official UT Athletics API
- [ ] Email notifications for potluck assignments
- [ ] RSVP system for game attendance
- [ ] Photo gallery for tailgate events
- [ ] Weather integration for game day
- [ ] Parking spot coordination
- [ ] Expense tracking and splitting
- [ ] Mobile app version

## Contact & Support
- **Repository Owner**: corbyjames
- **Primary Developer**: Assisted by Claude Code
- **Deployment Issues**: Check Render logs and Firebase console
- **Database Issues**: Firebase Realtime Database console

---
*Last Updated: December 29, 2024*
*This document should be updated whenever significant changes are made to the project structure or functionality.*