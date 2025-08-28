# Marine Life ID - Development Session Context

## Session Date: 2025-08-05

## Project Overview
Building a Marine Life Identification System with AI-powered image recognition for underwater photographers using Adobe Lightroom.

## Primary User Persona
- **Target User**: Underwater photographers using Adobe Lightroom (cloud version, not Classic)
- **Main Pain Point**: Integration with Lightroom to pull images and identify marine species
- **Value Proposition**: Pull photos from Lightroom, identify subjects using AI, tag in Lightroom, build global critter list
- **Key Differentiator**: Lightroom integration

## Secondary Requirements
- Import dive logs with locations for series of images
- Show images in web-based critter list
- Focus on science value over privacy
- No user authentication in MVP
- Cost-free identification approach

## Technology Decisions Made

### AI Identification
- **Primary**: Claude Vision API
- **Strategy**: A/B testing with and without reference images
- **Free Tier**: 50 free IDs per month
- **Fallback**: Bring Your Own Key (BYOK) option

### Storage Architecture
- **Neo4j**: Graph database for species relationships and photo metadata
- **MinIO**: S3-compatible storage for images
- **Redis**: Caching layer
- **Hybrid Approach**: Thumbnails cached permanently, full images on-demand

### Lightroom Integration
- **Version**: Lightroom (cloud), NOT Lightroom Classic
- **Method**: Web app with OAuth 2.0 API integration
- **Sync**: Manual sync and real-time on-demand
- **Storage**: Hybrid approach (cache thumbnails, fetch full on-demand)

## Implementation Progress

### ✅ Completed Components

1. **Backend Infrastructure**
   - FastAPI REST API structure
   - Neo4j database integration
   - MinIO storage service
   - Redis caching service

2. **Lightroom Integration Backend**
   - OAuth 2.0 authentication service (`app/services/lightroom/auth.py`)
   - Lightroom API client (`app/services/lightroom/api_client.py`)
   - Sync service with Neo4j storage (`app/services/lightroom/sync_service.py`)
   - REST API endpoints (`app/api/lightroom.py`)
   - Configuration updates for Adobe API

3. **Documentation**
   - Setup guide (`LIGHTROOM_SETUP.md`)
   - Session context (this file)
   - Updated `.env.example` with required keys

4. **HTTPS Setup Options**
   - ngrok configuration (recommended)
   - Self-signed certificate script
   - Docker Compose with Caddy for auto-HTTPS

### 🚧 Current Blockers

1. **Adobe API Configuration**
   - Adobe Console requires HTTPS for OAuth redirect URI
   - Having issues saving API configuration in Adobe Console
   - Need to get Adobe Client ID and Client Secret

### 📋 Pending Tasks

1. **Frontend Development**
   - React gallery component for displaying synced photos
   - Lightroom connection UI
   - Photo identification interface
   - Critter list visualization

2. **Claude Vision Integration**
   - Implement identification service
   - A/B testing framework
   - Reference image system
   - Usage tracking and limits

3. **Divelog Integration**
   - Parser for dive computer exports
   - Photo-to-dive matching by timestamp
   - Location and depth metadata

## Revised MVP Roadmap

### Phase 1: Foundation (Current)
- ✅ Lightroom OAuth integration
- ✅ Photo sync to local storage
- ⏳ Adobe API credentials setup
- ⏳ Basic web gallery display

### Phase 2: AI Identification
- Claude Vision integration
- A/B testing with reference images
- Free tier management (50/month)
- Review and confirmation interface

### Phase 3: Science Features
- Divelog integration
- Location-based data
- Species database (WoRMS)
- Export capabilities

### Phase 4: Community Features
- Public galleries
- Species distribution maps
- Collaborative identification
- Research data export

## Environment Setup Required

```bash
# Adobe API (get from https://developer.adobe.com/console)
ADOBE_CLIENT_ID=your_client_id_here
ADOBE_CLIENT_SECRET=your_client_secret_here
ADOBE_REDIRECT_URI=https://localhost:8000/api/v1/lightroom/auth/callback

# Claude Vision (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=your_api_key_here

# Database connections (already configured)
NEO4J_URI=bolt://neo4j:7687
MINIO_ENDPOINT=minio:9000
REDIS_URL=redis://redis:6379
```

## Next Immediate Steps

1. **Get Adobe API Credentials**
   - Create app in Adobe Developer Console
   - Configure OAuth with HTTPS redirect URI
   - Options: ngrok, self-signed cert, or Caddy

2. **Test Lightroom Connection**
   ```bash
   # Start backend with HTTPS
   cd backend
   ./create_local_cert.sh  # if using self-signed
   uvicorn app.main:app --ssl-keyfile=certs/key.pem --ssl-certfile=certs/cert.pem
   
   # Or use ngrok
   ngrok http 8000
   ```

3. **Connect and Sync**
   - Visit `/api/v1/lightroom/auth/connect`
   - Authorize with Adobe
   - Sync first album
   - Verify photos in Neo4j

## Key Design Decisions

1. **No monetization initially** - Focus on working product first
2. **Science value over privacy** - Open data by default
3. **Cost-free identification** - Use free tier + BYOK + community
4. **Lightroom cloud over Classic** - Modern API vs plugins
5. **LLM over traditional CV** - Claude Vision for flexibility
6. **Graph database** - Neo4j for relationships and future queries

## Technical Debt to Address

1. Token storage needs to move from cache to database
2. Add proper user authentication (post-MVP)
3. Implement rate limiting for API calls
4. Add comprehensive error handling
5. Create test suite for API endpoints

## Questions Resolved

- ✅ Target users: Underwater photographers
- ✅ Lightroom version: Cloud (not Classic)
- ✅ AI service: Claude Vision
- ✅ Storage strategy: Hybrid with Neo4j + MinIO
- ✅ Monetization: Not initially
- ✅ Privacy: Science-first, open by default

## Open Questions

1. Exact Adobe API configuration that will save
2. Frontend framework preferences beyond React
3. Deployment strategy (AWS, DigitalOcean, etc.)
4. Backup and disaster recovery plans
5. Long-term data retention policies

## Files Modified/Created

### New Files
- `/backend/app/services/lightroom/__init__.py`
- `/backend/app/services/lightroom/auth.py`
- `/backend/app/services/lightroom/api_client.py`
- `/backend/app/services/lightroom/sync_service.py`
- `/backend/app/api/lightroom.py`
- `/backend/create_local_cert.sh`
- `/docker-compose.https.yml`
- `/Caddyfile`
- `/LIGHTROOM_SETUP.md`
- `/SESSION_CONTEXT.md` (this file)

### Modified Files
- `/backend/app/main.py` - Added lightroom router
- `/backend/app/core/config.py` - Added Adobe & Anthropic settings
- `/backend/.env.example` - Added API key templates

## Session Summary

Successfully implemented a complete Lightroom integration backend with OAuth 2.0 authentication, photo syncing, and hybrid storage. The system uses Neo4j for metadata, MinIO for image caching, and is ready for Claude Vision AI identification. Currently blocked on Adobe API credential setup due to HTTPS redirect URI requirements. Multiple solutions provided (ngrok, self-signed cert, Caddy proxy).

The next critical step is obtaining Adobe API credentials and testing the OAuth flow. Once connected, the system can sync photos from Lightroom albums and prepare them for AI identification using Claude Vision with A/B testing for optimal accuracy.