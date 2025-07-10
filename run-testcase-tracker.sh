#!/bin/bash

echo "🚀 Starting TestCaseTracker Application..."
echo "📂 Changing to TestCaseTracker directory..."

cd TestCaseTracker/TestCaseTracker

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in TestCaseTracker directory"
    exit 1
fi

echo "✅ Found package.json, starting application..."
echo "🌐 Application will be available on port 5000"

# Start the application
npm run dev