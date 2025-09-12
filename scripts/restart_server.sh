#!/bin/bash

echo "Stopping any running node processes..."
killall -9 node 2>/dev/null || true

echo "Deleting any existing .log files..."
rm -f *.log 2>/dev/null || true

echo "Making sure uploads directory exists..."
mkdir -p uploads/bug-attachment uploads/profile-pictures 2>/dev/null || true

echo "Giving proper permissions to upload directories..."
chmod -R 755 uploads 2>/dev/null || true

echo "Starting TestCaseTracker application..."
cd "$(dirname "$0")"
npm run dev
