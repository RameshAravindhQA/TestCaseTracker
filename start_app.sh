#!/bin/bash
echo "Starting TestCaseTracker Application..."
echo "Port: 5000"
echo "Database: PostgreSQL"
echo "Environment: Development"
echo "====================================="

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true

# Start the application
npm run dev