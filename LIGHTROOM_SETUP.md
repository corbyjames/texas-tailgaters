# Lightroom Integration Setup Guide

This guide will help you set up the Adobe Lightroom integration for the Marine Life ID system.

## Prerequisites

1. Adobe Creative Cloud subscription with Lightroom
2. Adobe Developer account (free)
3. Marine Life ID backend running

## Step 1: Create Adobe Developer App

1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Click "Create new project"
3. Add API:
   - Click "Add API"
   - Select "Lightroom Services"
   - Configure OAuth 2.0:
     - Name: "Marine Life ID"
     - Redirect URI: `http://localhost:8000/api/v1/lightroom/auth/callback`
     - Scopes: Select all Lightroom scopes (read-only for MVP)

4. Save your credentials:
   - Client ID (API Key)
   - Client Secret

## Step 2: Configure Environment

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your Adobe credentials:
```
ADOBE_CLIENT_ID=your_client_id_here
ADOBE_CLIENT_SECRET=your_client_secret_here
ADOBE_REDIRECT_URI=http://localhost:8000/api/v1/lightroom/auth/callback
```

3. (Optional) Add Anthropic API key for Claude Vision:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Step 3: Start the Services

1. Start Docker services:
```bash
docker-compose up -d
```

2. Verify services are running:
   - Backend API: http://localhost:8000/docs
   - Frontend: http://localhost:3000
   - Neo4j Browser: http://localhost:7474
   - MinIO Console: http://localhost:9001

## Step 4: Connect Lightroom

### Using the API directly:

1. Get authorization URL:
```bash
curl http://localhost:8000/api/v1/lightroom/auth/connect
```

2. Visit the `auth_url` in your browser
3. Log in with your Adobe account
4. Authorize the app
5. You'll be redirected back to the callback URL

### Using the Frontend (when implemented):

1. Go to http://localhost:3000
2. Click "Connect Lightroom"
3. Follow the OAuth flow

## Step 5: Sync Your Photos

### List your albums:
```bash
curl http://localhost:8000/api/v1/lightroom/albums
```

### Sync an album:
```bash
curl -X POST "http://localhost:8000/api/v1/lightroom/sync/album/{album_id}?album_name=YourAlbumName"
```

### View synced photos:
```bash
curl http://localhost:8000/api/v1/lightroom/album/{album_id}/assets
```

## API Endpoints

### Authentication
- `GET /api/v1/lightroom/auth/connect` - Start OAuth flow
- `GET /api/v1/lightroom/auth/callback` - OAuth callback (automatic)
- `GET /api/v1/lightroom/auth/status` - Check connection status
- `POST /api/v1/lightroom/disconnect` - Disconnect from Lightroom

### Catalog Operations
- `GET /api/v1/lightroom/catalog` - Get catalog info
- `GET /api/v1/lightroom/albums` - List all albums
- `GET /api/v1/lightroom/synced-albums` - List synced albums

### Sync Operations
- `POST /api/v1/lightroom/sync/album/{album_id}` - Sync specific album
- `GET /api/v1/lightroom/album/{album_id}/assets` - Get album photos
- `GET /api/v1/lightroom/asset/{asset_id}` - Get photo details

## Architecture Overview

The Lightroom integration uses:
- **OAuth 2.0** for secure authentication
- **Neo4j** for storing photo metadata and relationships
- **MinIO** for caching images locally
- **Redis** for caching API responses
- **Hybrid storage**: Thumbnails stored locally, full images fetched on-demand

## Troubleshooting

### Connection Issues
- Verify Adobe credentials in `.env`
- Check redirect URI matches exactly
- Ensure all Docker services are running

### Sync Issues
- Check Neo4j is accessible
- Verify MinIO has enough storage
- Monitor logs: `docker-compose logs -f backend`

### Performance
- Sync happens in batches to respect API limits
- Thumbnails are cached permanently
- Full images cached for 30 days
- Use Redis monitor to check cache hits

## Next Steps

After setting up Lightroom integration:
1. Sync your underwater photo albums
2. Photos will be ready for AI identification
3. Claude Vision will identify species
4. Results saved back to Lightroom as keywords (future feature)