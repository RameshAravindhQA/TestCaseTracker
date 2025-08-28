
#!/bin/bash

# Start virtual display for Playwright
echo "🖥️ Starting virtual display for Playwright automation..."

# Kill any existing Xvfb processes
pkill -f Xvfb || true

# Start Xvfb on display :99
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 3

# Set display environment variable
export DISPLAY=:99

echo "✅ Virtual display started on :99"
echo "🎯 XVFB_PID: $XVFB_PID"

# Start window manager (optional, for better window handling)
fluxbox -display :99 &

echo "🪟 Window manager started"
echo "🚀 Virtual display setup complete!"
