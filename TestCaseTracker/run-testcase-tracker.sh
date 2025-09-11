#!/bin/bash

echo "🚀 Starting TestCaseTracker Application..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node.*main.js" 2>/dev/null || true

# Wait for cleanup
sleep 2

# Ensure we're in the right directory and start the app
cd TestCaseTracker

echo "📂 Working directory: $(pwd)"
echo "🔧 Starting with npx tsx..."

# Start the server
exec npx tsx server/index.ts