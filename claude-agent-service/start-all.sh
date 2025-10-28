#!/bin/bash

# Claude Agent Service - Full Docker Startup Script

echo "============================================"
echo " Claude Agent Service - Docker Mode"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo "📝 Please edit .env and set ANTHROPIC_AUTH_TOKEN and POSTGRES_PASSWORD"
    echo ""
    exit 1
fi

# Build services
echo "[1/3] Building Docker images..."
docker-compose build

# Start all services
echo ""
echo "[2/3] Starting all services..."
docker-compose up -d

# Show status
echo ""
echo "[3/3] Checking service status..."
sleep 5
docker-compose ps

echo ""
echo "============================================"
echo " 🚀 All services are running!"
echo "============================================"
echo ""
echo " Frontend: http://localhost:3000"
echo " Backend:  http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo ""
echo " Postgres: localhost:5432"
echo " Redis:    localhost:6379"
echo ""
echo "============================================"
echo ""
echo "View logs:"
echo " docker-compose logs -f"
echo ""
echo "Stop services:"
echo " docker-compose down"
echo ""
