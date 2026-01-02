# Deployment Guide - Raspberry Pi

This guide covers deploying the Infotavle application to a Raspberry Pi 5.

## Prerequisites

- Raspberry Pi 5 (2GB RAM or higher)
- Raspberry Pi OS installed
- Node.js 18+ installed on the Pi
- Git installed on the Pi
- SSH access to the Pi
- Internet connection on the Pi

## Initial Setup (One-Time)

### 1. Install Node.js on Raspberry Pi

```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js 18+
sudo apt install nodejs
```

### 2. Clone Repository on Pi

```bash
# Navigate to home directory
cd /home/pi

# Clone the repository
git clone https://github.com/joensen/infotavle.git

# Navigate to project
cd infotavle
```

### 3. Create .env File

Create a `.env` file in the project root with your sensitive configuration:

```bash
nano .env
```

Add the following content (replace with your actual values):

```env
# Google Calendar API Key
# Get your API key from: https://console.cloud.google.com/apis/credentials
GOOGLE_API_KEY=your_api_key_here

# Ad Server Configuration
AD_SERVER_URL=https://your-ad-server.com

# Calendar IDs (from Google Calendar settings)
CALENDAR_ID_SABUS_DDU=your_calendar_id_1@group.calendar.google.com
CALENDAR_ID_AKTIVITETER=your_calendar_id_2@group.calendar.google.com
CALENDAR_ID_INTERNE_MOEDER=your_calendar_id_3@group.calendar.google.com
CALENDAR_ID_BIBELSTUDIUM=your_calendar_id_4@group.calendar.google.com
CALENDAR_ID_GUDSTJENESTE=your_calendar_id_5@group.calendar.google.com
CALENDAR_ID_FOREDRAG_KONCERTER=your_calendar_id_6@group.calendar.google.com
CALENDAR_ID_SPEJDER=your_calendar_id_7@group.calendar.google.com

# Server Port
PORT=3000
```

Save and exit (Ctrl+X, Y, Enter).

### 4. Install Dependencies

```bash
npm install --production
```

### 5. Make Scripts Executable

```bash
chmod +x scripts/deploy.sh
chmod +x scripts/start-kiosk.sh
```

### 6. Test the Application

```bash
# Start the server
node server/server.js

# In another terminal, test it's working
curl http://localhost:3000/health

# If successful, stop the server (Ctrl+C)
```

## Deployment Workflow

### From Development Machine

When you make changes and want to deploy:

```bash
# Commit and push changes
git add .
git commit -m "Your commit message"
git push origin master
```

### On Raspberry Pi

SSH to the Pi and run the deployment script:

```bash
# SSH to Pi
ssh pi@raspberrypi.local

# Navigate to project
cd /home/pi/infotavle

# Run deployment script
./scripts/deploy.sh
```

The script will:
1. Stop the running server
2. Pull latest code from GitHub
3. Install/update dependencies
4. Verify .env file exists

## Running the Application

### Option 1: Kiosk Mode (Recommended for Production)

Start the app in full-screen kiosk mode:

```bash
./scripts/start-kiosk.sh
```

This will:
- Start the Node.js server in the background
- Launch Chromium in kiosk mode (full screen, no UI)
- Display the application on the connected screen

### Option 2: Background Server Only

For testing or development:

```bash
# Start server
node server/server.js

# Or run in background
nohup node server/server.js > server.log 2>&1 &

# View logs
tail -f server.log
```

### Option 3: Systemd Service (Auto-start on Boot)

Set up the application as a system service:

```bash
# Copy service file to systemd
sudo cp scripts/infotavle.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable infotavle

# Start the service
sudo systemctl start infotavle

# Check status
sudo systemctl status infotavle

# View logs
sudo journalctl -u infotavle -f
```

**Note:** The systemd service only runs the Node.js server, not the Chromium browser. For full kiosk mode on boot, see "Auto-start Kiosk on Boot" below.

## Auto-start Kiosk on Boot

To automatically start the application in kiosk mode when the Pi boots:

### Method 1: Using Autostart (Recommended)

```bash
# Create autostart directory if it doesn't exist
mkdir -p /home/pi/.config/autostart

# Create autostart entry
nano /home/pi/.config/autostart/infotavle.desktop
```

Add this content:

```ini
[Desktop Entry]
Type=Application
Name=Infotavle
Exec=/home/pi/infotavle/scripts/start-kiosk.sh
X-GNOME-Autostart-enabled=true
```

Save and reboot to test.

### Method 2: Using Crontab

```bash
# Edit crontab
crontab -e

# Add this line
@reboot sleep 30 && /home/pi/infotavle/scripts/start-kiosk.sh
```

The 30-second delay ensures the network is ready.

## Maintenance

### View Deployment History

```bash
cat /home/pi/infotavle/deploy.log
```

### Update .env File

The `.env` file is never overwritten by deployments. To update it:

```bash
nano /home/pi/infotavle/.env
```

After editing, restart the application.

### Clear Application Cache

```bash
# Via API
curl -X POST http://localhost:3000/api/clear-cache

# Or via browser query string
# Navigate to: http://localhost:3000?clear-cache=true
```

### Restart Application

If using systemd:
```bash
sudo systemctl restart infotavle
```

If running manually:
```bash
pkill -f "node server/server.js"
./scripts/start-kiosk.sh
```

## Troubleshooting

### Server Won't Start

1. Check .env file exists and has correct values:
   ```bash
   cat .env
   ```

2. Check for errors:
   ```bash
   node server/server.js
   ```

3. Check port 3000 isn't already in use:
   ```bash
   sudo lsof -i :3000
   ```

### Calendar Not Loading

1. Verify Google API key is valid
2. Check calendar IDs are correct
3. View server logs for errors:
   ```bash
   sudo journalctl -u infotavle -f
   ```

### Ads Not Loading

1. Verify AD_SERVER_URL is accessible:
   ```bash
   curl -I $AD_SERVER_URL/rotating-001.png
   ```

2. Check server logs for ad discovery errors

### Deployment Script Fails

1. Ensure you have internet connection:
   ```bash
   ping github.com
   ```

2. Check git credentials:
   ```bash
   git pull origin master
   ```

3. Verify scripts are executable:
   ```bash
   ls -la scripts/
   ```

### Screen Goes Black / Chromium Crashes

1. Check Chromium is installed:
   ```bash
   which chromium-browser
   ```

2. Restart the kiosk:
   ```bash
   pkill chromium
   ./scripts/start-kiosk.sh
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Calendar API key | `AIzaSy...` |
| `AD_SERVER_URL` | Remote ad server URL | `https://example.com` |
| `CALENDAR_ID_SABUS_DDU` | Calendar 1 ID | `abc123...@group.calendar.google.com` |
| `CALENDAR_ID_AKTIVITETER` | Calendar 2 ID | `def456...@group.calendar.google.com` |
| `CALENDAR_ID_INTERNE_MOEDER` | Calendar 3 ID | `ghi789...@group.calendar.google.com` |
| `CALENDAR_ID_BIBELSTUDIUM` | Calendar 4 ID | `jkl012...@group.calendar.google.com` |
| `CALENDAR_ID_GUDSTJENESTE` | Calendar 5 ID | `mno345...@group.calendar.google.com` |
| `CALENDAR_ID_FOREDRAG_KONCERTER` | Calendar 6 ID | `pqr678...@group.calendar.google.com` |
| `CALENDAR_ID_SPEJDER` | Calendar 7 ID | `stu901...@group.calendar.google.com` |
| `PORT` | Server port | `3000` |

## Security Notes

- The `.env` file contains sensitive credentials and should NEVER be committed to Git
- `.env` is already in `.gitignore` to prevent accidental commits
- Keep your Google API key secure and restrict it to Calendar API only
- Consider restricting API key to specific IP addresses in Google Cloud Console

## Performance Notes

- The Raspberry Pi 5 with 2GB RAM is sufficient for this application
- The app is optimized with:
  - Server-side caching (9-minute calendar cache, 10-minute ad cache)
  - Vanilla JavaScript (no heavy frameworks)
  - Minimal DOM updates
  - Video memory cleanup to prevent leaks

## Support

For issues or questions:
- Check the main [README.md](README.md) for application documentation
- Review the [CLAUDE.md](CLAUDE.md) for technical architecture details
- Open an issue on GitHub: https://github.com/joensen/infotavle/issues
