# Infotavle - Church Information Screen

Dynamic information display system for Silkeborg Adventistkirke, showing rotating ads and Google Calendar events.

## Features

- **Rotating Ads**: Top section rotates through 10+ ads (PNG/MP4) with custom per-ad durations (default 20 seconds)
- **Static Ads**: 4 static advertisement images in right column
- **Google Calendar Integration**: Displays events from 7 church calendars with color coding
- **Auto-discovery**: Automatically discovers available ads from remote server
- **Custom Ad Durations**: Configure display time per ad via `ad-durations.txt` file
- **Past Event Detection**: Events show completion status with checkmark and visual fade
- **Live Updates**: Content refreshes every 10 minutes without page reload
- **Kiosk Mode**: Designed for Raspberry Pi running Chromium in fullscreen

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework)
- **APIs**: Google Calendar API v3
- **Deployment**: Raspberry Pi 5 (2GB RAM)

## Project Structure

```
infotavle/
├── server/                  # Backend Express server
│   ├── config/             # Configuration (calendar IDs, colors)
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic (calendar, ads)
│   └── server.js           # Main server file
├── public/                 # Frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── assets/            # Static assets
│   └── index.html         # Main HTML page
├── scripts/               # Deployment scripts
│   └── start-kiosk.sh    # Raspberry Pi startup script
├── .env                   # Environment variables (API keys)
└── package.json          # Node.js dependencies
```

## Setup Instructions

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create credentials → **API Key**
5. Restrict API key to Calendar API (recommended)
6. Copy the API key

### 2. Local Setup (Development)

```bash
# Clone or navigate to project
cd c:\Users\Bruger\Projects\infotavle

# Install dependencies (already done)
npm install

# Configure environment variables
# Edit .env file and add your Google API key:
GOOGLE_API_KEY=your_actual_api_key_here
```

### 3. Ad Server Setup

Upload ad files to your configured ad server with these naming conventions:

**Rotating Ads** (top section):
- `rotating-001.png`, `rotating-002.mp4`, `rotating-003.png`, etc.
- System will auto-discover sequentially numbered files
- Supports both .png and .mp4 formats

**Static Ads** (right column):
- `static-1.png`, `static-2.png`, `static-3.png`, `static-4.png`
- Exactly 4 static ads

**Ad Durations** (optional):
- Create `ad-durations.txt` on the ad server to configure custom display times
- Format: `1: 30s`, `2: 10`, `3: 45s` (one per line)
- Numbers auto-normalize (1 → 001, 2 → 002, etc.)
- Use seconds (with or without 's' suffix)
- Lines starting with `#` are comments
- If not specified, ads default to 20 seconds

### 4. Run Locally

```bash
# Start the server
node server/server.js

# Open browser
http://localhost:3000
```

Test the API endpoints:
- Calendar: http://localhost:3000/api/calendar
- Ads: http://localhost:3000/api/ads
- Health: http://localhost:3000/health

### 5. Raspberry Pi Deployment

#### Install Dependencies

```bash
ssh pi@your-raspberry-pi
sudo apt-get update
sudo apt-get install -y nodejs npm chromium-browser
```

#### Deploy Application

```bash
# Copy project to Raspberry Pi
scp -r c:\Users\Bruger\Projects\infotavle pi@raspberry-pi:/home/pi/

# SSH into Raspberry Pi
ssh pi@raspberry-pi

# Navigate to project
cd /home/pi/infotavle

# Install dependencies
npm install

# Configure environment
nano .env
# Add: GOOGLE_API_KEY=your_actual_api_key_here
# Save: Ctrl+X, Y, Enter
```

#### Set Up Auto-Start

```bash
# Make script executable
chmod +x /home/pi/infotavle/scripts/start-kiosk.sh

# Edit autostart file
nano /etc/xdg/lxsession/LXDE-pi/autostart

# Add this line at the end:
@/home/pi/infotavle/scripts/start-kiosk.sh

# Save and reboot
sudo reboot
```

## Configuration

### Calendar Configuration

Edit `server/config/config.js` to modify calendars:

```javascript
calendars: [
  {
    id: 'calendar_id@group.calendar.google.com',
    color: '#33B679',
    name: 'Gudstjenester'
  },
  // Add more calendars...
]
```

### Ad Discovery Settings

In `server/config/config.js`:

```javascript
adServer: {
  url: process.env.AD_SERVER_URL || 'https://your-ad-server.com',
  rotatingPrefix: 'rotating-',
  staticPrefix: 'static-',
  staticCount: 4,
  maxRotatingAds: 50
}
```

### Cache Settings

```javascript
cache: {
  calendarTTL: 540000,    // 9 minutes
  adDiscoveryTTL: 600000  // 10 minutes
}
```

## Maintenance

### Adding New Ads

1. Upload file to ad server following naming convention:
   - Rotating: `rotating-010.mp4`
   - Static: `static-1.png` (to replace existing)
2. (Optional) Update `ad-durations.txt` to set custom duration:
   - Add line: `10: 30s` (for 30 second display time)
3. Wait up to 10 minutes for auto-discovery
4. No code changes required

### Updating Ad Durations

1. Edit `ad-durations.txt` on the ad server
2. Example content:
   ```
   # Custom ad durations (in seconds)
   1: 30    # Ad 001 shows for 30 seconds
   2: 10s   # Ad 002 shows for 10 seconds
   3: 45    # Ad 003 shows for 45 seconds
   ```
3. Save the file
4. Wait up to 10 minutes for cache refresh (or clear cache manually)

### Updating Google API Key

```bash
# On Raspberry Pi
nano /home/pi/infotavle/.env
# Update GOOGLE_API_KEY=new_key_here

# Restart (reboot or manually restart server)
sudo reboot
```

### Adding New Calendar

1. Edit `server/config/config.js`
2. Add new calendar object to `calendars` array
3. Restart server

### Monitoring

Check server logs:
```bash
# If running manually
node server/server.js

# View browser console (press F12 in Chromium)
# Look for timing logs:
#   📦 Loaded X rotating ads with custom durations
#   🎬 Showing ad X/Y: filename
#   ⏱️ Previous ad was shown for Xs
```

Health check:
```bash
curl http://localhost:3000/health
```

### Clearing Cache

To force immediate refresh of calendar and ads:

**Via Browser:**
```
http://localhost:3000?clear-cache=true
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/clear-cache
```

## Troubleshooting

### Calendar Not Loading

- **Check API key**: Verify `.env` has correct `GOOGLE_API_KEY`
- **Check calendars are public**: Calendars must be publicly accessible
- **Check console**: Open browser DevTools (F12) for error messages
- **Test API directly**: Visit `http://localhost:3000/api/calendar`

### Ads Not Displaying

- **Check file names**: Must match `rotating-001.png` format (3-digit padding)
- **Check file accessibility**: Visit ad URLs directly in browser
- **Check console**: Look for 404 errors or timing issues
- **Test API**: Visit `http://localhost:3000/api/ads`
- **Check durations file**: Look for log message about `ad-durations.txt` fetch status

### Ads Showing Wrong Duration

- **Check `ad-durations.txt`**: Format must be `1: 30s` or `1: 30`
- **Check number padding**: System normalizes `1` to `001` automatically
- **Clear cache**: Use `?clear-cache=true` to force refresh
- **Check browser console**: Look for "📦 Loaded X rotating ads with custom durations"
- **Verify actual timing**: Console shows expected vs actual duration for each ad

### Raspberry Pi Won't Auto-Start

- **Check script permissions**: `chmod +x scripts/start-kiosk.sh`
- **Check autostart file**: `/etc/xdg/lxsession/LXDE-pi/autostart`
- **Check paths**: Ensure `/home/pi/infotavle` exists
- **Manual test**: Run `./scripts/start-kiosk.sh` manually

### Performance Issues

- **Compress videos**: Keep videos under 50MB if possible
- **Reduce ad count**: Fewer rotating ads = less memory usage
- **Check memory**: `free -h` to see available RAM
- **Restart regularly**: Set up weekly auto-reboot if needed

## API Endpoints

### GET /api/calendar

Returns calendar events from all configured calendars.

**Response:**
```json
{
  "events": [
    {
      "id": "event_id",
      "summary": "Morgengudstjeneste",
      "start": "2026-01-05T10:00:00+01:00",
      "end": "2026-01-05T12:00:00+01:00",
      "calendarColor": "#33B679",
      "calendarName": "Gudstjenester"
    }
  ],
  "lastUpdated": "2026-01-01T14:30:00Z"
}
```

### GET /api/ads

Returns discovered ad URLs.

**Response:**
```json
{
  "rotating": [
    "https://server.com/rotating-001.mp4",
    "https://server.com/rotating-002.png"
  ],
  "static": [
    "https://server.com/static-1.png",
    "https://server.com/static-2.png"
  ],
  "lastDiscovered": "2026-01-01T14:30:00Z"
}
```

### GET /health

Server health check.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-01-01T14:30:00Z"
}
```

## File Naming Conventions

### Rotating Ads
- Format: `rotating-NNN.ext`
- Examples: `rotating-001.png`, `rotating-002.mp4`, `rotating-015.png`
- Number with 3 digits, zero-padded
- Extensions: `.png` or `.mp4`

### Static Ads
- Format: `static-N.ext`
- Examples: `static-1.png`, `static-2.png`, `static-3.png`, `static-4.png`
- Number without padding
- Extensions: `.png` or `.mp4`

## Technical Details

### Auto-Discovery Process

1. System tries sequential numbers: 001, 002, 003, etc.
2. For each number, tries `.png` then `.mp4`
3. Uses HTTP HEAD requests (bandwidth efficient)
4. Stops after 3 consecutive 404 errors
5. Caches results for 10 minutes

### Update Mechanism

- **Initial load**: On page load
- **Scheduled updates**: Every 10 minutes via `setInterval`
- **Calendar cache**: 9 minutes server-side
- **Ad cache**: 10 minutes server-side
- **No page reload**: Updates happen seamlessly

### Memory Management

- Video elements cleaned up after playback
- Preloading next ad 5 seconds before transition
- Old media elements properly disposed
- Fade transitions (500ms) for smooth UX

## License

Private use for Silkeborg Adventistkirke.

## Support

For issues or questions, check the browser console (F12) for error messages, or review server logs.
