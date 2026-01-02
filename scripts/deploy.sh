#!/bin/bash

# Infotavle Deployment Script for Raspberry Pi
# Run this script on the Pi to pull latest code and restart the app

set -e  # Exit on any error

echo "========================================"
echo "Infotavle Deployment Script"
echo "========================================"
echo ""

# Configuration
PROJECT_DIR="/home/pi/infotavle"
BRANCH="master"
LOG_FILE="/home/pi/infotavle/deploy.log"

# Change to project directory
cd "$PROJECT_DIR" || { echo "Error: Cannot access $PROJECT_DIR"; exit 1; }

# Log deployment with timestamp
echo "[$(date)] Starting deployment..." | tee -a "$LOG_FILE"

# Stop running server if it exists
echo "Stopping running server..."
pkill -f "node server/server.js" || echo "No running server found"
sleep 2

# Pull latest code from GitHub
echo "Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/$BRANCH
echo "Code updated to latest commit: $(git rev-parse --short HEAD)"

# Install/update dependencies
echo "Installing dependencies..."
npm install --production

# Verify .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env file with required environment variables."
    echo "See DEPLOYMENT.md for instructions."
    exit 1
fi

echo ""
echo "========================================"
echo "Deployment completed successfully!"
echo "========================================"
echo ""
echo "To start the application in kiosk mode:"
echo "  ./scripts/start-kiosk.sh"
echo ""
echo "Or to run as a background service:"
echo "  sudo systemctl start infotavle"
echo ""

# Log completion
echo "[$(date)] Deployment completed successfully" | tee -a "$LOG_FILE"
