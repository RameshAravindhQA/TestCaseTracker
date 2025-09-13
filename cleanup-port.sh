
#!/bin/bash
echo "🧹 Cleaning up port 5000..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Port cleanup complete"
