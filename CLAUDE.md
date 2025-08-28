# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Setup
```bash
# Start all services (Neo4j, MinIO, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

### Backend Development
```bash
cd backend/

# Install dependencies
pip install -r requirements.txt

# Run development server with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run specific test scripts (no formal test runner)
python test_identification.py
python test_image_upload.py
python test_google_vision.py
```

### Frontend Development
```bash
cd frontend/

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Database Operations
```bash
# Connect to Neo4j browser: http://localhost:7474
# Default credentials: neo4j/password

# Initialize database with sample data
cd backend/
python -m app.core.init_db
```

## Architecture Overview

This is a **Marine Life Identification System** with AI-powered image recognition:

### Tech Stack
- **Backend**: FastAPI (Python) REST API running on port 8000
- **Frontend**: React 18 with Tailwind CSS on port 3000
- **Database**: Neo4j graph database for species relationships
- **Storage**: MinIO S3-compatible storage for images
- **Cache**: Redis for performance optimization
- **AI Services**: Google Cloud Vision API as primary, with mock service for development

### Key Components

1. **API Structure** (`backend/app/api/`):
   - `identification.py` - AI-powered species identification endpoint
   - `images.py` - Image upload and management
   - `species.py` - Species data and relationships
   - `feedback.py` - User feedback for improving identification
   - `search.py` - Advanced search functionality

2. **AI Services** (`backend/app/services/ai_identification/`):
   - Multiple identification backends (Google Vision, mock service, free classifier)
   - Configurable confidence thresholds
   - Result caching for performance

3. **Frontend Components** (`frontend/src/components/`):
   - Image upload with drag-and-drop
   - Real-time identification results
   - Species information display
   - Feedback system for corrections

### Environment Variables
Key settings in `backend/app/core/config.py`:
- `GOOGLE_CLOUD_CREDENTIALS` - Path to Google Cloud service account JSON
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` - Database connection
- `MINIO_*` - Object storage settings
- `REDIS_URL` - Cache connection

### API Documentation
- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Testing Approach
Tests are implemented as standalone Python scripts rather than using pytest:
- Integration tests for full API workflows
- Mock service available for development without API keys
- HTML test files for UI component testing