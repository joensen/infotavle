#!/bin/bash

# Raspberry Pi Kiosk Mode Startup Script for Infotavle
# This script starts the Node.js server and launches Chromium in kiosk mode

# Navigate to the project directory
cd /home/pi/infotavle

# Start the Node.js server in the background
echo "Starting Infotavle server..."
node server/server.js &

# Store the server process ID
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "Warning: Server may not have started properly"
fi

# Start Chromium in kiosk mode
echo "Starting Chromium in kiosk mode..."
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:3000

# When Chromium closes, stop the server
echo "Chromium closed, stopping server..."
kill $SERVER_PID
