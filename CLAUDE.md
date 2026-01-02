# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Security and Privacy

**CRITICAL: NEVER expose or leak these sensitive values in any documentation, code examples, commits, or external communication:**
- Ad server URL (configured in `server/config/config.js` and `.env` as `AD_SERVER_URL`)
- Google API keys (`GOOGLE_API_KEY`)
- Calendar IDs (long hashed strings in `server/config/config.js`)
- Any production URLs or endpoints that are not localhost

**When writing documentation or code examples:**
- Use placeholder values: `https://your-ad-server.com`, `https://example.com`
- Use generic calendar IDs: `calendar-id@group.calendar.google.com`
- Reference environment variables instead of actual values: `process.env.AD_SERVER_URL`
- When asked to update README or other public-facing docs, replace any exposed URLs with placeholders

**The ad server URL and calendar IDs are considered private to the church organization and must not be shared.**

## Project Overview

**Infotavle** is a church information display system designed to run 24/7 on a Raspberry Pi 5 in Chromium kiosk mode. It displays rotating advertisements and events from 7 Google Calendars on a TV screen.

The system consists of:
- **Backend**: Node.js/Express server (port 3000) that proxies Google Calendar API and discovers ads from remote server
- **Frontend**: Vanilla JavaScript (no framework) for optimal Raspberry Pi performance
- **Target Environment**: Raspberry Pi 5 (2GB RAM) running Chromium in kiosk mode

## Commands

### Development
```bash
# Start server
node server/server.js

# Access application
# Open browser to http://localhost:3000

# Clear cache (useful for testing)
# Navigate to http://localhost:3000?clear-cache=true
# Or POST to http://localhost:3000/api/clear-cache
```

### Testing Features
```bash
# Simulate specific time for past event testing
# http://localhost:3000?simulate-time=2026-01-04T12:20:00

# Clear cache via query string
# http://localhost:3000?clear-cache=true
```

### Raspberry Pi Deployment
```bash
# Start in kiosk mode (on Raspberry Pi)
./scripts/start-kiosk.sh

# Make script executable first
chmod +x scripts/start-kiosk.sh
```

## Architecture

### Data Flow
1. **Ad Discovery**: On startup and every 10 minutes, backend discovers ads from remote server via sequential HEAD requests
2. **Calendar Sync**: Every 10 minutes, backend fetches events from 7 Google Calendars in parallel
3. **Client Updates**: Frontend polls every 10 minutes, seamlessly updating without page refresh
4. **Ad Rotation**: Client-side setTimeout-based rotation with per-ad custom durations

### Caching Strategy
- **Calendar Cache**: 9 minutes (server-side node-cache)
- **Ad Discovery Cache**: 10 minutes (server-side node-cache)
- **Browser Cache Busting**: Only applied during 10-minute updates (not during normal ad rotation)

### Backend Services

**calendarService.js**
- Fetches events from 7 Google Calendars using API key authentication
- Starts from midnight today (preserves past events for current day)
- Fetches 90 days forward
- Merges events from all calendars with color/name metadata
- Returns events sorted by start time

**adDiscoveryService.js**
- Auto-discovers ads using naming convention: `rotating-001.png`, `rotating-002.mp4`, etc.
- Uses HEAD requests for bandwidth efficiency
- Stops after 3 consecutive 404s
- Fetches `ad-durations.txt` for custom per-ad display durations
- Returns: `{ rotating: [{ url, duration }], static: [urls] }`

### Frontend Components

**AdRotator** ([adRotator.js](public/js/adRotator.js))
- Manages top section ad rotation with custom per-ad durations
- Uses `setTimeout` (not setInterval) for precise per-ad timing
- Preloads next ad 5 seconds before transition
- Default duration: 20 seconds (overridden by `ad-durations.txt`)
- Supports both PNG images and MP4 videos
- Memory cleanup: properly disposes video elements to prevent leaks

**CalendarRenderer** ([calendarRenderer.js](public/js/calendarRenderer.js))
- Displays events grouped by date with Danish locale formatting
- Color-codes events by source calendar (7 different colors)
- All-day events sorted to bottom of each day
- Past events: 50% opacity, gray text, green checkmark
- Multi-day events: shows date range on first day only
- Simulated time support for testing via query string

**UpdateManager** ([updateManager.js](public/js/updateManager.js))
- Coordinates 10-minute update cycle
- Updates calendar, rotating ads, and static ads in parallel
- Applies cache busting only during updates (not during rotation)
- Ad rotation continues seamlessly during updates

## Configuration

### Environment Variables (.env)
```
GOOGLE_API_KEY=your_api_key_here
AD_SERVER_URL=https://xxx
PORT=3000
```

### Calendar Configuration ([server/config/config.js](server/config/config.js))
- 7 calendars with specific IDs, colors, and names
- Calendar IDs are long hashed strings from Google Calendar
- Colors use hex format (#33B679, #D50000, etc.)

### Ad Server Configuration
- **Remote URL**: `https://xxx`
- **Rotating ads**: `rotating-001.png`, `rotating-002.mp4`, etc.
- **Static ads**: `static-1.png` through `static-4.png`
- **Ad durations**: Optional `ad-durations.txt` file on server

### Ad Duration Configuration
Create `ad-durations.txt` on the ad server with format:
```
# Comments start with #
1: 30s      # Ad 001 shows for 30 seconds
2: 10       # Ad 002 shows for 10 seconds (s is optional)
3: 45s      # Ad 003 shows for 45 seconds
```

Numbers are auto-normalized (1 → 001, 2 → 002). If file doesn't exist or ad not specified, uses 20-second default.

## Key Technical Details

### Ad Rotation Timing
- Changed from `setInterval` to `setTimeout` to support per-ad custom durations
- Each ad schedules the next ad after its specific duration
- `adStartTime` tracking logs actual vs expected duration for debugging
- Comprehensive console logging shows:
  - List of all ads with durations on load
  - Start time, expected end time for each ad
  - Actual duration of previous ad

### Calendar Event Handling
- **Midnight Start**: Fetches from midnight today (not current time) to keep day's past events visible
- **Past Detection**: Events marked past when end time < current time (or simulated time)
- **All-Day Events**: Never marked as past, always sorted to bottom
- **Multi-Day Events**: Google Calendar end date is exclusive, handled by subtracting 1 day for display

### Memory Management
Critical for Raspberry Pi with limited RAM:
```javascript
// Video cleanup in adRotator.js
video.pause();
video.src = '';
video.load();
```

### Danish Locale
All dates/times formatted with 'da-DK' locale:
- Date format: "fredag den 5. januar 2026"
- Time format: "14:30"
- Month names in lowercase (except all-day multi-day ranges)

## API Endpoints

- `GET /` - Serves static frontend
- `GET /api/calendar` - Returns merged calendar events
- `GET /api/ads` - Returns discovered ad URLs with durations
- `GET /health` - Server health check
- `POST /api/clear-cache` - Manually clear all caches (testing only)

## File Structure

```
infotavle/
├── server/
│   ├── server.js                 # Express app entry point
│   ├── config/config.js          # Calendar IDs, colors, ad server config
│   ├── routes/
│   │   ├── calendar.js           # /api/calendar endpoint
│   │   └── ads.js                # /api/ads endpoint
│   └── services/
│       ├── calendarService.js    # Google Calendar API + caching
│       └── adDiscoveryService.js # Ad discovery + duration parsing
├── public/
│   ├── index.html                # Main page structure
│   ├── css/styles.css            # Visual styling
│   └── js/
│       ├── app.js                # Initialization + static ad loading
│       ├── adRotator.js          # Top ad rotation logic
│       ├── calendarRenderer.js   # Calendar display component
│       └── updateManager.js      # 10-minute update cycle
├── scripts/
│   └── start-kiosk.sh            # Raspberry Pi kiosk startup
├── .env                          # Environment variables (not in git)
└── package.json
```

## Important Implementation Notes

### When Modifying Ad Rotation
- Ad rotation uses `setTimeout`, not `setInterval` - each ad schedules the next
- Duration comes from `ad.duration` property (from `ad-durations.txt`)
- Always clean up video elements to prevent memory leaks
- Preload timing: `Math.max(duration - 5000, 1000)`

### When Modifying Calendar Display
- Events fetched from midnight (not current time) - preserves day context
- All-day detection: `!event.start.includes('T')`
- Past detection: Only for timed events, checks `event.end < currentTime`
- Simulated time: Check `URLSearchParams` for `simulate-time` parameter

### When Adding New Calendars
1. Update [server/config/config.js](server/config/config.js) calendars array
2. Add calendar ID (from Google Calendar settings)
3. Choose unique hex color
4. Provide display name
5. Restart server

### When Debugging Timing Issues
Check browser console for detailed logs:
- `📦 Loaded X rotating ads with custom durations:` - Shows all ads on load
- `🎬 Showing ad X/Y:` - Shows start time, expected duration, end time
- `⏱️ Previous ad was shown for Xs` - Shows actual duration vs expected

### Cache Busting Rules
- During normal ad rotation: NO cache busting (uses direct URL)
- During 10-minute updates: YES cache busting (`?t=${Date.now()}`)
- Static ads: Cache busted only during updates
- This prevents unnecessary reloads during smooth rotation

## Visual Design Constraints

**DO NOT CHANGE** these aspects without explicit user request:
- Black background (`#000`)
- White text, 3em header font size
- 50/50 two-column flexbox layout
- Calendar height: 1300px with hidden scrollbar
- Compact event spacing (intentionally tight)
- Color-coded left borders for calendar categories
- Past event styling: 50% opacity, gray text, green checkmark
