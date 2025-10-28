#!/bin/bash

# Claude Agent Service - Development Startup Script

echo "============================================"
echo " Claude Agent Service - Development Mode"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo "📝 Please edit .env and set ANTHROPIC_AUTH_TOKEN and POSTGRES_PASSWORD"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Start database services
echo "[1/4] Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for databases to be healthy
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Run database migrations
echo ""
echo "[2/4] Running database migrations..."
cd backend
export $(cat ../.env | xargs)
alembic upgrade head || echo "⚠️  Migration failed, but continuing..."
cd ..

# Start backend
echo ""
echo "[3/4] Starting backend service..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Start frontend in development mode
echo ""
echo "[4/4] Starting frontend development server..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "============================================"
echo " 🚀 Services are starting up!"
echo "============================================"
echo ""
echo " Frontend: http://localhost:3000"
echo " Backend:  http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo ""
echo "============================================"
echo ""
echo "Starting frontend dev server..."
npm run dev
