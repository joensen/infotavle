const { google } = require('googleapis');
const NodeCache = require('node-cache');
const config = require('../config/config');

// Initialize cache with 9-minute TTL
const cache = new NodeCache({ stdTTL: config.cache.calendarTTL / 1000 });

class CalendarService {
  constructor() {
    this.calendar = null;
    this.initialized = false;
    this.cache = cache;
  }

  initialize() {
    if (this.initialized) return;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      return;
    }

    this.calendar = google.calendar({
      version: 'v3',
      auth: apiKey
    });
    this.initialized = true;
    console.log('Calendar service initialized');
  }

  async fetchEventsForCalendar(calendarConfig) {
    try {
      // Start from midnight today (keeps events from earlier in the day visible)
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const timeMin = todayMidnight.toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now

      const response = await this.calendar.events.list({
        calendarId: calendarConfig.id,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      });

      const events = response.data.items || [];

      if (events.length > 0) {
        console.log(`✓ Fetched ${events.length} events from ${calendarConfig.name} (${calendarConfig.color})`);
      } else {
        console.log(`⚠ No events found in ${calendarConfig.name} (${calendarConfig.color})`);
      }

      // Add calendar metadata to each event
      return events.map(event => ({
        id: event.id,
        summary: event.summary || 'Ingen titel',
        description: event.description || '',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        calendarId: calendarConfig.id,
        calendarColor: calendarConfig.color,
        calendarName: calendarConfig.name,
        location: event.location || ''
      }));
    } catch (error) {
      console.error(`✗ Error fetching calendar ${calendarConfig.name}:`, error.message);
      if (error.code === 404) {
        console.error(`  → Calendar not found or not accessible with current API key`);
      } else if (error.code === 403) {
        console.error(`  → Access forbidden - calendar might be private`);
      }
      return [];
    }
  }

  async fetchAllEvents() {
    this.initialize();

    if (!this.initialized) {
      console.error('Calendar service not initialized - check API key');
      // Try to return cached data
      const cachedData = cache.get('all_events');
      if (cachedData) {
        console.log('Returning cached calendar data (service not initialized)');
        return cachedData;
      }
      return { events: [], lastUpdated: new Date().toISOString() };
    }

    // Check cache first
    const cachedData = cache.get('all_events');
    if (cachedData) {
      console.log('Returning cached calendar data');
      return cachedData;
    }

    console.log('Fetching fresh calendar data from Google Calendar API...');

    try {
      // Fetch events from all calendars in parallel
      const allCalendarPromises = config.calendars.map(cal =>
        this.fetchEventsForCalendar(cal)
      );

      const results = await Promise.all(allCalendarPromises);

      // Merge all events into a single array
      const allEvents = results.flat();

      // Sort by start time
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start);
        const dateB = new Date(b.start);
        return dateA - dateB;
      });

      const result = {
        events: allEvents,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      cache.set('all_events', result);
      console.log(`Fetched ${allEvents.length} events from ${config.calendars.length} calendars`);

      return result;
    } catch (error) {
      console.error('Error fetching calendar events:', error.message);

      // Fallback to cached data even if expired
      const cachedData = cache.get('all_events');
      if (cachedData) {
        console.log('Returning expired cached data due to error');
        return cachedData;
      }

      return { events: [], lastUpdated: new Date().toISOString() };
    }
  }
}

module.exports = new CalendarService();
