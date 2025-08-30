# Texas Tailgaters App Context

## Project Overview
Texas Tailgaters is a web application for managing University of Texas football game events, tailgating, potluck coordination, and RSVPs. The app supports both desktop and mobile interfaces with role-based access for admins, members, and guests.

## Recent Implementation Summary

### 1. SMS Invitation System
- **Purpose**: Allow members and admins to send invitations via SMS text messages
- **Features**:
  - Send invites to individual games or entire season
  - Support for both email and SMS invitations
  - Phone number formatting for US and international numbers
  - Mock SMS service ready for Twilio backend integration
- **Files**:
  - `src/services/smsService.ts` - SMS sending service with phone formatting
  - `src/components/invitations/InvitationModalWithSMS.tsx` - Enhanced invitation modal

### 2. Feedback System
- **Purpose**: Users can submit feedback that admins can view and manage in-app
- **Features**:
  - Submit bug reports, feature requests, improvements
  - Priority levels (low, medium, high)
  - Categories (UI, functionality, performance, content)
  - Admin dashboard for viewing and managing feedback
  - Status tracking (pending, in_review, implemented, declined)
- **Files**:
  - `src/services/feedbackService.ts` - Feedback data management
  - `src/components/feedback/FeedbackModal.tsx` - User feedback submission form
  - `src/components/admin/FeedbackManager.tsx` - Admin feedback dashboard

### 3. RSVP Functionality
- **Purpose**: Allow users to RSVP for games with attendee counts
- **Features**:
  - RSVP status: yes/no/maybe
  - Track number of attendees
  - Update or cancel existing RSVPs
  - Real-time statistics display
  - Integration with game cards
- **Files**:
  - `src/services/rsvpService.ts` - RSVP data management
  - `src/components/games/RSVPModal.tsx` - RSVP submission modal
  - `src/components/games/MobileGameCard.tsx` - Updated with RSVP button

### 4. Profile Page
- **Purpose**: User profile management and personal dashboard
- **Features**:
  - Display user information and role badges
  - Edit profile details (name, phone, dietary restrictions, emergency contact)
  - View upcoming games with RSVPs
  - Quick stats (upcoming games, total RSVPs, member since)
  - Mobile-responsive design
- **Files**:
  - `src/pages/ProfilePage.tsx` - Complete profile page implementation

## Technical Architecture

### Database
- **Firebase Realtime Database** for:
  - Feedback storage (`/feedback`)
  - RSVP data (`/rsvps`)
  - Invitations (`/invitations`)
  - Potluck items (`/potluck`)

### Authentication
- Firebase Authentication
- Role-based access control:
  - **Admin**: Full access to all features
  - **Member**: Can send invitations, RSVP, sign up for potluck
  - **Guest**: Can RSVP and view games

### State Management
- React hooks (useState, useEffect)
- Custom hooks:
  - `useAuth()` - Authentication state
  - `useGames()` - Games data
  - `usePotluck()` - Potluck management
- Session storage for navigation state
- Custom events for real-time updates

### Mobile Optimization
- Responsive grid layouts
- Touch-friendly button sizes
- Mobile-specific components (MobileGameCard, MobileNavBar)
- Bottom navigation for mobile devices
- Swipe gestures support

## Key Features

### Invitation System
```typescript
// Members and admins can send invites
const canSendInvites = user && (
  user.isAdmin || 
  user.role === 'admin' || 
  user.role === 'member'
);

// Support for season-wide invitations
inviteType: 'game' | 'season'

// SMS formatting
formatPhoneNumber(phone: string): string
```

### Feedback Flow
1. User clicks feedback button in navigation
2. Fills out FeedbackModal with type, category, priority, and message
3. Feedback stored in Firebase with timestamp
4. Admins view/manage in FeedbackManager dashboard
5. Status updates trigger real-time notifications

### RSVP System
```typescript
interface RSVP {
  gameId: string;
  userId: string;
  status: 'yes' | 'no' | 'maybe';
  attendeeCount: number;
  notes?: string;
}
```

## Recent Bug Fixes

### TypeScript Compilation Issues
- Changed `user.uid` to `user.id` throughout codebase
- Updated `user.displayName` to `user.name`
- Fixed Firebase import paths from `'./firebase'` to `'../config/firebase'`
- Removed non-existent `updateProfile` function references
- Fixed user metadata access patterns

### Mobile UI Fixes
- RSVP button now properly triggers modal
- Fixed button touch targets for mobile
- Improved modal scrolling on small screens
- Fixed navigation z-index issues

## Environment Configuration

### Required Environment Variables
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_DATABASE_URL
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_TWILIO_ACCOUNT_SID (for SMS - backend)
REACT_APP_TWILIO_AUTH_TOKEN (for SMS - backend)
REACT_APP_TWILIO_PHONE_NUMBER (for SMS - backend)
```

## Deployment

### Render Deployment
- Frontend deployed at: https://texas-tailgaters.onrender.com
- Build command: `npm run build`
- Start command: `npm run start`
- Environment: Node 18

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Pending Backend Integration

### SMS Service
- Integrate Twilio for actual SMS sending
- Implement rate limiting
- Add delivery status tracking
- Store SMS logs for audit

### Email Service
- Set up SendGrid or similar
- HTML email templates
- Delivery tracking
- Unsubscribe management

## Testing Checklist

### Mobile Testing
- [ ] RSVP modal on mobile devices
- [ ] Profile page editing on mobile
- [ ] Feedback submission on mobile
- [ ] Navigation between pages
- [ ] Potluck item selection
- [ ] Game card interactions

### Feature Testing
- [ ] SMS invitation sending
- [ ] Season-wide invitations
- [ ] Feedback submission and admin viewing
- [ ] RSVP creation and updates
- [ ] Profile editing
- [ ] Role-based permissions

## Known Issues
- SMS service currently mock implementation
- Email service needs backend setup
- Some TypeScript strict mode warnings
- Profile photo upload not implemented

## Future Enhancements
- Push notifications for game reminders
- Calendar integration
- Parking pass coordination
- Ride sharing organization
- Photo gallery for games
- Game day weather integration
- Ticket exchange board
- Tailgate location mapping