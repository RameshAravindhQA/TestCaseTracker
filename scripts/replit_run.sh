
#!/bin/bash

# Function to kill processes on port 5000
cleanup_port() {
    echo "🧹 Cleaning up port 5000..."
    
    # Kill processes using port 5000
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    
    # Kill any tsx processes
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    
    # Kill any npm dev processes
    pkill -f "npm run dev" 2>/dev/null || true
    
    # Wait for processes to fully terminate
    sleep 3
    
    # Check if port is still in use
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port 5000 still in use, force killing..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Cleanup function
cleanup() {
    echo "🛑 Stopping server..."
    cleanup_port
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Cleanup any existing processes
cleanup_port

# Clear the console and start fresh
clear
echo "🚀 Starting Test Case Management System..."
echo "   Server will be available at http://localhost:5000"
echo "   Features: Enhanced messaging, WebSocket support, GitHub issue reporter"
echo "   Press Ctrl+C to stop the server"
echo ""

# Navigate to the project directory
cd TestCaseTracker

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server with error handling
echo "🔧 Starting development server..."
npm run dev

# If we get here, the server stopped
echo "✨ Server stopped successfully"
