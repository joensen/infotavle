class CalendarRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.events = [];
    this.simulatedTime = null;

    // Check for simulated time in URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const simTime = urlParams.get('simulate-time');
    if (simTime) {
      this.simulatedTime = new Date(simTime);
      console.log(`⏰ Simulating time: ${this.simulatedTime.toLocaleString('da-DK')}`);
    }
  }

  getCurrentTime() {
    return this.simulatedTime || new Date();
  }

  async loadEvents() {
    try {
      const response = await fetch('/api/calendar');
      const data = await response.json();

      if (data.events) {
        this.events = data.events;
        console.log(`Loaded ${this.events.length} calendar events`);
        this.render();
      } else {
        console.warn('No calendar events found');
        this.renderEmpty();
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
      this.renderError();
    }
  }

  render() {
    if (this.events.length === 0) {
      this.renderEmpty();
      return;
    }

    // Group events by date
    const eventsByDate = this.groupByDate(this.events);

    let html = '<div class="calendar-events">';

    for (const [date, events] of Object.entries(eventsByDate)) {
      html += '<div class="date-group">';
      html += `<h2 class="date-header">${this.formatDate(date)}</h2>`;

      // Sort events: timed events first (by time), then all-day events
      const sortedEvents = this.sortEvents(events);

      sortedEvents.forEach(event => {
        html += this.renderEvent(event);
      });

      html += '</div>';
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  sortEvents(events) {
    return events.sort((a, b) => {
      const aIsAllDay = !a.start.includes('T');
      const bIsAllDay = !b.start.includes('T');

      // All-day events go to the bottom
      if (aIsAllDay && !bIsAllDay) return 1;
      if (!aIsAllDay && bIsAllDay) return -1;

      // Both are same type, sort by time
      return new Date(a.start) - new Date(b.start);
    });
  }

  renderEvent(event) {
    const timeDisplay = this.formatTimeRange(event.start, event.end);
    const borderColor = event.calendarColor || '#33B679';
    const isPast = this.isEventPast(event);
    const pastClass = isPast ? ' event-past' : '';
    const checkmark = isPast ? '<span class="event-checkmark">✓</span>' : '';

    return `
      <div class="event-item${pastClass}" style="border-left-color: ${borderColor}">
        <div class="event-time">${timeDisplay}</div>
        <div class="event-title">${this.escapeHtml(event.summary)}</div>
        ${checkmark}
      </div>
    `;
  }

  isEventPast(event) {
    const now = this.getCurrentTime();

    // For all-day events, never mark as past (they're valid all day)
    if (!event.end.includes('T')) {
      return false;
    }

    // For timed events, check if end time has passed
    const endTime = new Date(event.end);
    return endTime < now;
  }

  formatTimeRange(startStr, endStr) {
    // Check if it's an all-day event
    const isAllDay = !startStr.includes('T');

    if (isAllDay) {
      // Check if it spans multiple days
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);

      // End date is exclusive in Google Calendar, so subtract 1 day
      endDate.setDate(endDate.getDate() - 1);

      if (startDate.getTime() !== endDate.getTime()) {
        // Multi-day event: show date range
        return `${this.formatShortDate(startDate)} - ${this.formatShortDate(endDate)}`;
      } else {
        // Single all-day event
        return 'Hele dagen';
      }
    } else {
      // Timed event: show time range
      const startTime = this.formatTime(startStr);
      const endTime = this.formatTime(endStr);
      return `${startTime} - ${endTime}`;
    }
  }

  formatShortDate(date) {
    const day = date.getDate();
    const month = date.toLocaleDateString('da-DK', { month: 'short' });
    return `${day}. ${month}`;
  }

  groupByDate(events) {
    const grouped = {};

    events.forEach(event => {
      // Extract date from ISO string (YYYY-MM-DD)
      let dateKey;
      if (event.start.includes('T')) {
        dateKey = event.start.split('T')[0];
      } else {
        dateKey = event.start;
      }

      // Only show multi-day events on their first day
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const weekday = date.toLocaleDateString('da-DK', { weekday: 'short' });
      const day = date.getDate();
      const month = date.toLocaleDateString('da-DK', { month: 'long' });

      // Lowercase first letter of month
      const monthLower = month.charAt(0).toLowerCase() + month.slice(1);

      return `${weekday} ${day}. ${monthLower}`;
    } catch (error) {
      return dateString;
    }
  }

  formatTime(dateTimeString) {
    try {
      // Handle all-day events (no time component)
      if (!dateTimeString.includes('T')) {
        return 'Hele dagen';
      }

      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="loading">
        <p>Ingen kommende begivenheder</p>
      </div>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <div class="loading">
        <p>Kunne ikke indlæse kalender</p>
        <p style="font-size: 0.9em; color: #666;">Prøver igen om lidt...</p>
      </div>
    `;
  }
}
