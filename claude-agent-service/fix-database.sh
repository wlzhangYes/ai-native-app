#!/bin/bash

# Quick fix script to add tool_calls column

echo "============================================"
echo " Quick Database Fix - Add tool_calls Column"
echo "============================================"
echo ""

echo "[1/3] Adding tool_calls column to conversations table..."
docker-compose exec -T postgres psql -U claude_agent -d claude_agent_db << 'EOF'
-- Add tool_calls column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS tool_calls JSON;

-- Verify
\d conversations
EOF

echo ""
echo "[2/3] Updating alembic version to mark migration as applied..."
docker-compose exec backend alembic stamp head

echo ""
echo "[3/3] Verifying..."
docker-compose exec backend alembic current

echo ""
echo "============================================"
echo " ✅ Database fix completed!"
echo "============================================"
echo ""
echo "Please restart backend:"
echo "  docker-compose restart backend"
echo ""
