#!/bin/bash

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true

# Wait a moment for cleanup
sleep 1

# Start the server
echo "🚀 Starting Test Case Management System..."
echo "Server will be available at http://localhost:5000"
echo "Features: Enhanced messaging, WebSocket support, GitHub issue reporter"
echo ""

# Run the development server
npm run dev