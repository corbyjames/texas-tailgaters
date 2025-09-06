# Real-Time Features Setup Guide

## Overview
The Texas Tailgaters app now includes real-time game updates, server-side scraping, and push notifications for iOS and web platforms.

## Features Implemented

### 1. WebSocket Real-Time Updates
- Live game scores and play-by-play updates
- Real-time schedule changes
- TV network announcements
- Bowl game invitations

### 2. Server-Side Scraping
- Direct scraping of UT Athletics website (no CORS issues)
- More reliable data fetching
- Reduced client-side load

### 3. Push Notifications
- iOS support (iOS 16.4+)
- PWA push notifications
- Game reminders
- Score updates
- Schedule changes

## Setup Instructions

### Backend Setup

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Generate VAPID Keys for Push Notifications**
```bash
node generateVapidKeys.js
```
Save the generated keys to your `.env` files.

3. **Configure Firebase Admin**
- Download your Firebase service account key from Firebase Console
- Save as `backend/firebase-admin-sdk.json`
- Update `backend/.env` with the path

4. **Start Backend Server**
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

### Frontend Setup

1. **Install Socket.io Client**
```bash
npm install
```

2. **Update Environment Variables**
Add to `.env`:
```
VITE_BACKEND_URL=http://localhost:3001
VITE_VAPID_PUBLIC_KEY=<your-public-key>
```

3. **Enable Push Notifications**
The app will automatically request permission when users sign in.

## How It Works

### Real-Time Game Updates
- During game time, the backend polls ESPN API every 30 seconds
- Updates are pushed to connected clients via WebSocket
- Clients watching specific games receive targeted updates

### Schedule Synchronization
- Daily sync at 6 AM automatically
- Manual sync available for admins
- Combines data from ESPN and UT Athletics
- Priority given to official UT Athletics data

### Push Notification Schedule
- **24 hours before game**: Reminder notification
- **3 hours before game**: Final reminder
- **During game**: Score updates for major events
- **6-12 days before**: TV network announcements

## iOS Push Notifications

### Requirements
- iOS 16.4 or later
- App must be installed as PWA (Add to Home Screen)
- User must grant notification permission

### Setup for iOS
1. Users visit the app in Safari
2. Tap Share → Add to Home Screen
3. Open app from home screen
4. Grant notification permission when prompted

## Testing

### Test WebSocket Connection
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
socket.emit('subscribe-schedule');
```

### Test Push Notifications
```javascript
// In browser console
pushNotificationService.testNotification();
```

### Trigger Manual Sync
```bash
curl -X POST http://localhost:3001/api/schedule/sync
```

## Monitoring

### Check Active Games
The backend automatically monitors games that are:
- Currently in progress
- Starting within 30 minutes
- Started less than 4 hours ago

### View Sync Logs
Sync results are stored in Firebase under `/syncLogs`

### WebSocket Status
Connected clients shown in backend console logs

## Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use process manager (PM2 recommended):
```bash
pm2 start server.js --name texas-backend
```

### Enable HTTPS
Required for push notifications in production:
- Use reverse proxy (nginx/Apache)
- Configure SSL certificates
- Update CORS settings

### Database Security
- Restrict Firebase rules
- Enable authentication
- Set up backup schedule

## Troubleshooting

### Push Notifications Not Working
- Check VAPID keys are correctly set
- Verify HTTPS in production
- Check browser notification permissions
- iOS: Ensure app is installed as PWA

### WebSocket Connection Issues
- Check backend is running
- Verify CORS settings
- Check firewall/proxy settings
- Use WSS in production

### Schedule Not Updating
- Check cron jobs are running
- Verify API endpoints are accessible
- Check Firebase permissions
- Review sync logs for errors

## API Endpoints

### Schedule Endpoints
- `GET /api/schedule/espn` - Fetch ESPN schedule
- `GET /api/schedule/ut-athletics` - Fetch UT Athletics schedule
- `POST /api/schedule/sync` - Trigger manual sync

### Notification Endpoints
- `POST /api/notifications/subscribe` - Subscribe to push notifications

### WebSocket Events

#### Client → Server
- `join-game` - Join game room for updates
- `leave-game` - Leave game room
- `subscribe-schedule` - Subscribe to schedule updates

#### Server → Client
- `game-update` - Live game updates
- `schedule-synced` - Schedule sync complete
- `network-updates` - TV network announcements
- `bowl-announcement` - Bowl game invitations

## Security Considerations

1. **API Keys**: Never expose backend API keys in frontend
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Implement for public endpoints
4. **Authentication**: Verify user identity for sensitive operations
5. **HTTPS**: Required for push notifications and security

## Future Enhancements

- [ ] Apple Push Notification service (APNs) for native iOS
- [ ] Android native app support
- [ ] Webhook integrations for instant ESPN updates
- [ ] GraphQL subscriptions for more efficient real-time data
- [ ] Offline queue for actions when disconnected