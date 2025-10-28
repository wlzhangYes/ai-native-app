#!/bin/sh

# Inject runtime configuration
echo "Injecting runtime configuration..."
echo "API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000}"

# Replace placeholder in config.js
sed -i "s|REPLACE_API_URL|${NEXT_PUBLIC_API_URL:-http://localhost:8000}|g" /app/public/config.js

# Start Next.js server
echo "Starting Next.js server..."
exec node server.js
