# Marine Life ID System

AI-powered marine species identification system using computer vision and graph database.

## Features

- 🐠 **AI Species Identification**: Multiple AI services (iNaturalist, Google Vision)
- 🖼️ **Image Management**: Upload, store, and organize marine life photos
- 🔍 **Smart Search**: Search by species, location, date, and more
- 📊 **Graph Database**: Neo4j for complex relationships between species, locations, and observations
- 🔄 **Lightroom Integration**: Sync with Adobe Lightroom (coming soon)
- 📱 **Responsive Web UI**: React + Tailwind CSS

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Google Cloud Vision API key
- (Optional) iNaturalist API credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/marine-life-id.git
cd marine-life-id
```

2. Copy environment file:
```bash
cp backend/.env.example backend/.env
# Edit .env with your API keys
```

3. Start the services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Neo4j Browser: http://localhost:7474 (neo4j/marinelife123)
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

## License

MIT License
