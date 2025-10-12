# Texas Tailgaters Backend - Score Sync Service

Automated score and schedule synchronization service for Texas Tailgaters.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase credentials

# Start server
npm start

# Development mode (auto-reload)
npm run dev
```

## Environment Variables

Required variables in `.env`:

```bash
# Firebase Configuration
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CERT_URL=your_cert_url

# Scheduler Settings
ENABLE_SCHEDULER=true        # Enable automated jobs
SYNC_ON_STARTUP=true         # Run sync when server starts

# Optional: Custom Schedules (defaults shown)
DAILY_SCHEDULE_SYNC=0 6 * * *        # 6 AM daily
GAMEDAY_SCORE_SYNC=*/30 * * * *      # Every 30 min
OFFSEASON_SYNC=0 */4 * * *           # Every 4 hours
WEEKLY_DEEP_SYNC=0 23 * * 0          # Sundays 11 PM

# Server
PORT=3001
NODE_ENV=production
```

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /api/scheduler/status` - Scheduler status
- `GET /api/scheduler/history` - Job history

### Sync Operations
- `POST /api/sync` - Full sync (schedule + scores)
- `POST /api/sync/schedule` - Schedule only
- `POST /api/sync/scores` - Scores only

## Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Daily Schedule Sync | 6 AM daily | Update times, TV networks, add new games |
| Game Day Score Sync | Every 30 min | Update scores on game days |
| Off-Season Sync | Every 4 hours | Less frequent updates during off-season |
| Weekly Deep Sync | Sundays 11 PM | Comprehensive validation |

## Manual Testing

```bash
# Test comprehensive sync
curl -X POST http://localhost:3001/api/sync

# Check status
curl http://localhost:3001/api/scheduler/status

# View history
curl http://localhost:3001/api/scheduler/history
```

## Deployment

See [SCHEDULED_JOBS_SETUP.md](../SCHEDULED_JOBS_SETUP.md) for complete deployment instructions.

### Quick Deploy to Render

1. Add environment variables in Render dashboard
2. Push code:
   ```bash
   git add .
   git commit -m "Add scheduled jobs"
   git push origin main
   ```
3. Verify: `https://your-service.onrender.com/health`

## Architecture

```
backend/
├── server.js                    # Express server & endpoints
├── espn-sync-service.js         # Legacy ESPN sync
└── services/
    ├── enhancedSyncService.js   # New comprehensive sync
    ├── jobScheduler.js          # Cron job manager
    └── scheduleService.js       # Schedule management
```

## Features

✅ Automated score updates
✅ Schedule synchronization
✅ Bowl game detection
✅ Smart frequency (game day vs off-season)
✅ Manual admin controls
✅ Comprehensive logging
✅ Graceful shutdown
✅ Production ready

## Support

- Check logs in Render dashboard
- Use Admin Dashboard for manual triggers
- Review job history for issues
