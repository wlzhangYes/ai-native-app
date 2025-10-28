#!/bin/bash

echo "🚀 Starting Claude Agent Service Frontend"
echo ""
echo "Prerequisites:"
echo "1. Backend running at http://localhost:8000"
echo "2. Node.js 18+ installed"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from example..."
    cp .env.example .env.local
fi

echo ""
echo "✅ Starting development server..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""

npm run dev
