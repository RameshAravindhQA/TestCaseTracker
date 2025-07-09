#!/bin/bash

# Kill any existing server processes to prevent duplicates
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Clear the console and start fresh
clear
echo "🚀 Starting Test Case Management System..."
echo "   Server will be available at http://localhost:5000"
echo "   Features: Enhanced messaging, WebSocket support, GitHub issue reporter"
echo ""

# Start the server
npm run dev