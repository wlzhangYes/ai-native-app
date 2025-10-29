#!/bin/bash
# Build without type checking (for quick deployment)

echo "Building without type checking..."

# Use vite build directly without tsc
vite build

if [ -d "dist" ]; then
    echo "✅ Build completed successfully"
    exit 0
else
    echo "❌ Build failed"
    exit 1
fi
