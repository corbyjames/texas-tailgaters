#!/bin/bash
echo "🚀 Setting up Marine Life ID System..."

# Copy environment file
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Created backend/.env - please add your API keys"
fi

# Start services
docker-compose up -d

echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

echo "✅ Setup complete!"
echo ""
echo "🌐 Access your services at:"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Neo4j:    http://localhost:7474"
echo "   MinIO:    http://localhost:9001"
