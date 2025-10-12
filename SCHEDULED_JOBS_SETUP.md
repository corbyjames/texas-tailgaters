# Texas Tailgaters - Scheduled Jobs Setup Guide

## Overview

This system provides **automated scheduled jobs** for keeping game schedules and scores up to date using the ESPN API and other data sources.

### Features

✅ **Automatic Score Updates** - Scores update automatically every 30 minutes on game days
✅ **Schedule Synchronization** - Game times, TV networks, and new games sync daily at 6 AM
✅ **Bowl Game Detection** - Automatically adds postseason games when announced
✅ **Smart Frequency** - Increased sync frequency on game days, reduced during off-season
✅ **Manual Controls** - Admin dashboard to trigger syncs manually and view history
✅ **Production Ready** - Works on Render.com with proper error handling

---

## Architecture

### Components

1. **Enhanced Sync Service** (`backend/services/enhancedSyncService.js`)
   - Combines schedule and score synchronization
   - Intelligent opponent name matching
   - Fallback to hardcoded scores when ESPN API is unavailable
   - Validates and filters non-football games

2. **Job Scheduler** (`backend/services/jobScheduler.js`)
   - Uses `node-cron` for scheduling
   - Manages multiple job types with different frequencies
   - Tracks job history and run counts
   - Graceful shutdown handling

3. **Backend Server** (`backend/server.js`)
   - Exposes REST API endpoints for manual triggers
   - Provides job status and history endpoints
   - Initializes scheduler on startup
   - Health check endpoint

4. **Admin Dashboard** (`src/components/admin/SyncMonitor.tsx`)
   - Real-time job status display
   - Manual sync controls
   - Job history viewer
   - Auto-refresh every 30 seconds

---

## Scheduled Jobs

### 1. Daily Schedule Sync
- **Schedule**: Every day at 6:00 AM Central Time
- **Cron**: `0 6 * * *`
- **Purpose**:
  - Add new games (e.g., bowl games)
  - Update game times (TBD → actual time)
  - Update TV networks
  - Update game dates if changed

### 2. Game Day Score Sync
- **Schedule**: Every 30 minutes (only on game days)
- **Cron**: `*/30 * * * *`
- **Purpose**:
  - Update live scores during games
  - Mark games as completed
  - Update final scores

### 3. Off-Season Sync
- **Schedule**: Every 4 hours (when NOT a game day)
- **Cron**: `0 */4 * * *`
- **Purpose**:
  - Check for schedule changes during off-season
  - Less frequent to save API calls

### 4. Weekly Deep Sync
- **Schedule**: Sundays at 11:00 PM Central Time
- **Cron**: `0 23 * * 0`
- **Purpose**:
  - Comprehensive validation after weekend games
  - Ensure all completed games have final scores
  - Clean up any data inconsistencies

---

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file in the `backend/` directory:

```bash
# Firebase Admin SDK
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@texas-tailgaters.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Job Scheduler Configuration
ENABLE_SCHEDULER=true          # Enable/disable scheduler
SYNC_ON_STARTUP=true           # Run initial sync on startup

# Cron Schedules (optional - these are defaults)
DAILY_SCHEDULE_SYNC=0 6 * * *
GAMEDAY_SCORE_SYNC=*/30 * * * *
OFFSEASON_SYNC=0 */4 * * *
WEEKLY_DEEP_SYNC=0 23 * * 0

# Server
PORT=3001
NODE_ENV=production
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (texas-tailgaters)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract values to environment variables

---

## Deployment to Render.com

### Step 1: Update Render Service

1. Log in to [Render.com](https://render.com)
2. Go to your backend service (texas-tailgaters-score-sync)
3. Go to **Environment** tab

### Step 2: Add Environment Variables

Add all the environment variables listed above:

```
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_CERT_URL=...
ENABLE_SCHEDULER=true
SYNC_ON_STARTUP=true
PORT=3001
NODE_ENV=production
```

**Important**: For `FIREBASE_PRIVATE_KEY`, make sure to wrap it in quotes and include the newline characters (`\n`).

### Step 3: Deploy

After adding environment variables:

```bash
cd backend
git add .
git commit -m "Add scheduled jobs system"
git push origin main
```

Render will automatically deploy your changes.

### Step 4: Verify Deployment

1. Check health endpoint: `https://your-backend.onrender.com/health`
2. Should show:
   ```json
   {
     "status": "healthy",
     "service": "Texas Tailgaters Score Sync Service",
     "scheduler": "running",
     "timestamp": "..."
   }
   ```

3. Check scheduler status: `https://your-backend.onrender.com/api/scheduler/status`

---

## Local Development

### Running Backend Locally

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env and add your Firebase credentials

# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

### Testing Scheduled Jobs

The jobs will run automatically based on their schedules. To test immediately:

1. **Option 1**: Set `SYNC_ON_STARTUP=true` and restart the server
2. **Option 2**: Use the manual trigger endpoints:

```bash
# Trigger comprehensive sync
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "comprehensive"}'

# Trigger schedule sync only
curl -X POST http://localhost:3001/api/sync/schedule

# Trigger scores sync only
curl -X POST http://localhost:3001/api/sync/scores
```

3. **Option 3**: Use the Admin Dashboard (best option)
   - Go to `http://localhost:5173/admin` (or your frontend URL)
   - Click **Auto Sync** tab
   - Use the manual sync buttons

---

## API Endpoints

### Sync Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync` | POST | Comprehensive sync (schedule + scores) |
| `/api/sync/schedule` | POST | Schedule sync only |
| `/api/sync/scores` | POST | Scores sync only |
| `/api/sync-scores` | POST | Legacy scores sync (backwards compatible) |

### Monitoring Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/scheduler/status` | GET | Get scheduler status and job info |
| `/api/scheduler/history` | GET | Get recent job history |
| `/api/scores` | GET | Get current scores from ESPN |

---

## Admin Dashboard Usage

### Accessing the Dashboard

1. Log in as an admin user (test@texastailgaters.com / TestPassword123!)
2. Navigate to **Admin** page
3. Click **Auto Sync** tab

### Dashboard Features

**Scheduler Status**
- Shows if scheduler is running
- Displays active jobs and their schedules
- Shows last run time for each job

**Manual Sync Controls**
- **Full Sync**: Complete schedule + score sync
- **Schedule Only**: Update game times, TV networks, add new games
- **Scores Only**: Update scores for completed games

**Recent Activity**
- View last 20 sync operations
- See what changed in each sync
- Monitor errors and issues

---

## Monitoring & Troubleshooting

### Check Scheduler Status

```bash
curl https://your-backend.onrender.com/api/scheduler/status
```

### Check Recent History

```bash
curl https://your-backend.onrender.com/api/scheduler/history?limit=10
```

### View Logs (Render.com)

1. Go to your Render service
2. Click **Logs** tab
3. Look for entries like:
   - `[DAILY SCHEDULE SYNC] Starting...`
   - `[GAME DAY SCORE SYNC] Complete: 2 updates`

### Common Issues

**Problem**: Scheduler shows "stopped"
- **Solution**: Check `ENABLE_SCHEDULER` environment variable is set to `true`

**Problem**: No scores updating
- **Solution**:
  1. Check ESPN API is accessible
  2. Verify game exists in database
  3. Check opponent name matching in logs
  4. Hardcoded scores will be used as fallback

**Problem**: Firebase permission errors
- **Solution**: Verify Firebase credentials are correct and service account has proper permissions

**Problem**: Jobs not running on schedule
- **Solution**: Ensure server is not sleeping (Render free tier may have delays)

---

## Cron Expression Reference

```
 ┌────────────── minute (0 - 59)
 │ ┌──────────── hour (0 - 23)
 │ │ ┌────────── day of month (1 - 31)
 │ │ │ ┌──────── month (1 - 12)
 │ │ │ │ ┌────── day of week (0 - 6) (Sunday=0)
 │ │ │ │ │
 * * * * *
```

Examples:
- `0 6 * * *` = Every day at 6 AM
- `*/30 * * * *` = Every 30 minutes
- `0 */4 * * *` = Every 4 hours
- `0 23 * * 0` = Sundays at 11 PM

All times are in **Central Time** (America/Chicago timezone).

---

## Testing Checklist

Before deploying to production:

- [ ] Backend runs locally with scheduler enabled
- [ ] Manual sync works from Admin Dashboard
- [ ] Environment variables are set correctly
- [ ] Firebase credentials are valid
- [ ] ESPN API is accessible
- [ ] Scheduler status endpoint returns correct data
- [ ] Job history is being recorded
- [ ] Graceful shutdown works (Ctrl+C)

---

## Maintenance

### Adjusting Sync Frequency

Edit environment variables on Render:

```bash
# More frequent game day updates (every 15 minutes)
GAMEDAY_SCORE_SYNC=*/15 * * * *

# Less frequent off-season sync (every 6 hours)
OFFSEASON_SYNC=0 */6 * * *
```

### Disabling Scheduler

Set `ENABLE_SCHEDULER=false` to disable all scheduled jobs.

### Adding New Jobs

Edit `backend/services/jobScheduler.js` and add a new job in the `initialize()` method:

```javascript
this.addJob('myCustomJob', '0 12 * * *', async () => {
  console.log('Running my custom job...');
  // Your code here
});
```

---

## Support

For issues or questions:

1. Check Render logs for errors
2. Use Admin Dashboard to manually trigger syncs
3. Review job history for patterns
4. Check Firebase Realtime Database for data integrity

---

## Summary

✅ Automated sync system is running
✅ Scores update every 30 minutes on game days
✅ Schedule syncs daily at 6 AM
✅ Admin dashboard provides full control
✅ Production-ready with error handling

Your OU game score and future games will now update automatically! 🤘
