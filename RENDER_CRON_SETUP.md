# Render Cron Jobs Setup

This project uses **Render Cron Jobs** instead of an in-process scheduler (node-cron) because Render's free/pro tiers may sleep services between requests, preventing reliable in-process scheduling.

## Architecture

### Services

1. **texas-tailgaters** (Frontend)
   - Type: Static Site
   - React SPA hosted on Render

2. **texas-tailgaters-backend** (API)
   - Type: Web Service
   - Express.js API for manual sync triggers
   - Internal scheduler DISABLED (`ENABLE_SCHEDULER=false`)

3. **daily-schedule-sync** (Cron Job)
   - Schedule: `0 11 * * *` (6:00 AM CT daily)
   - Updates game times, TV networks, adds new games
   - Script: `backend/cron-schedule-sync.js`

4. **score-sync** (Cron Job)
   - Schedule: `*/30 * * * *` (Every 30 minutes)
   - Updates scores for completed games
   - Script: `backend/cron-score-sync.js`

5. **weekly-deep-sync** (Cron Job)
   - Schedule: `0 4 * * 1` (11:00 PM CT Sundays / 4:00 AM UTC Mondays)
   - Comprehensive sync of schedule + scores
   - Script: `backend/cron-deep-sync.js`

## Time Zone Conversion

Render Cron uses **UTC** time. Convert Central Time to UTC:

| Central Time (CT) | UTC Time | Cron Expression |
|-------------------|----------|-----------------|
| 6:00 AM daily | 11:00 AM | `0 11 * * *` |
| Every 30 min | Every 30 min | `*/30 * * * *` |
| 11:00 PM Sunday | 4:00 AM Monday | `0 4 * * 1` |

**Note**: During Daylight Saving Time (CDT), CT is UTC-5. During Standard Time (CST), CT is UTC-6. Adjust cron schedules accordingly if needed.

## Deployment

### Automatic Deployment

When you push to GitHub, Render automatically:
1. Detects changes to `render.yaml`
2. Creates/updates cron job services
3. Redeploys all services

### Manual Setup (if needed)

1. Ensure `render.yaml` is in the repository root
2. Push to GitHub
3. Render Dashboard > Services > Check for new cron services
4. Add Firebase environment variables to each cron job:
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`
   - `FIREBASE_CERT_URL`

## Monitoring

### View Cron Job Logs

```bash
# List all services
render services list

# View logs for a specific cron job
render logs daily-schedule-sync
render logs score-sync
render logs weekly-deep-sync
```

### Check Last Run

In Render Dashboard:
1. Go to service (e.g., "daily-schedule-sync")
2. View "Events" tab
3. See last execution time and status

### Manual Trigger

You can manually trigger a cron job from Render Dashboard:
1. Go to the cron job service
2. Click "Manual Deploy" or "Trigger Cron"

## Testing Locally

Test the cron scripts locally:

```bash
cd backend

# Test schedule sync
node cron-schedule-sync.js

# Test score sync
node cron-score-sync.js

# Test deep sync
node cron-deep-sync.js
```

Make sure environment variables are set:
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CERT_URL`

## Troubleshooting

### Cron Job Not Running

1. Check Render Dashboard > Cron Service > Events
2. Verify environment variables are set
3. Check logs for errors: `render logs <service-name>`
4. Verify cron schedule syntax

### Firebase Connection Issues

1. Ensure all Firebase env vars are set correctly
2. Check that `FIREBASE_PRIVATE_KEY` has proper newlines
3. Verify service account has database read/write permissions

### Schedule Not Updating

1. Check daily-schedule-sync logs
2. Verify ESPN API is responding
3. Manually trigger: Render Dashboard > daily-schedule-sync > Manual Deploy

## Cost

Render Cron Jobs pricing:
- **Free Tier**: 400 build minutes/month, limited cron execution time
- **Starter**: $7/month per cron job
- **Pro**: More execution time and priority

With 3 cron jobs:
- **Development**: Use free tier, monitor limits
- **Production**: Consider Starter plan for reliable execution

## Migration Notes

**Previous Setup**: Used `node-cron` inside the web service
- ❌ Problem: Service sleeps on Render, preventing scheduled execution
- ✅ Solution: Migrate to Render Cron Jobs (external scheduler)

**Changes Made**:
1. Set `ENABLE_SCHEDULER=false` in backend web service
2. Created standalone cron scripts in `backend/cron-*.js`
3. Defined 3 cron jobs in `render.yaml`
4. Removed dependency on in-process scheduler

## Next Steps

After deployment:
1. Monitor first scheduled runs (check at 6 AM CT tomorrow)
2. Verify scores update during games (every 30 min)
3. Check weekly deep sync on Sunday nights
4. Update Kentucky game time manually until first daily sync runs
