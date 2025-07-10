#!/bin/bash

echo "🚀 Starting TestCaseTracker..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node dev.js" 2>/dev/null || true

# Wait a moment
sleep 2

# Change to TestCaseTracker directory and start
cd TestCaseTracker
node dev.js