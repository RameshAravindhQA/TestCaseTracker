#!/bin/bash

echo "🚀 Starting TestCaseTracker Application..."
echo "📂 Navigating to TestCaseTracker directory..."

# Change to the TestCaseTracker directory
cd TestCaseTracker/TestCaseTracker

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Current directory: $(pwd)"
    echo "Contents:"
    ls -la
    exit 1
fi

echo "✅ Found package.json"
echo "🌐 Starting server on port 5000..."

# Start the development server
npm run dev