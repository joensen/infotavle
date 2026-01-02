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

# Detect which Chromium browser is installed
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_CMD="chromium-browser"
elif command -v chromium &> /dev/null; then
    CHROMIUM_CMD="chromium"
else
    echo "Error: Chromium browser not found!"
    echo "Please install Chromium:"
    echo "  sudo apt install chromium-browser"
    kill $SERVER_PID
    exit 1
fi

# Start Chromium in kiosk mode
echo "Starting Chromium in kiosk mode..."
$CHROMIUM_CMD \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --disable-background-networking \
  --disable-sync \
  --disable-component-update \
  --autoplay-policy=no-user-gesture-required \
  --log-level=3 \
  http://localhost:3000 2>/dev/null

# When Chromium closes, stop the server
echo "Chromium closed, stopping server..."
kill $SERVER_PID
