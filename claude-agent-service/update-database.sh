#!/bin/bash

# Database Migration Script
# Updates database schema to latest version

echo "============================================"
echo " Database Migration - Claude Agent Service"
echo "============================================"
echo ""

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running"
    echo "   Please start it first: docker-compose up -d backend"
    exit 1
fi

echo "[1/3] Checking current database version..."
docker-compose exec backend alembic current

echo ""
echo "[2/3] Running migrations to HEAD..."
docker-compose exec backend alembic upgrade head

echo ""
echo "[3/3] Verifying new version..."
docker-compose exec backend alembic current

echo ""
echo "============================================"
echo " ✅ Database migration completed!"
echo "============================================"
echo ""
echo "New tables/columns added:"
echo "  • sessions.claude_session_id"
echo "  • conversations.tool_calls (JSON)"
echo ""
echo "You can now restart the backend:"
echo "  docker-compose restart backend"
echo ""
