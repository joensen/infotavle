class UpdateManager {
  constructor(calendarRenderer, adRotator) {
    this.calendarRenderer = calendarRenderer;
    this.adRotator = adRotator;
    this.updateInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.intervalId = null;
  }

  start() {
    console.log('Starting update manager...');

    // Initial load
    this.update();

    // Schedule updates every 10 minutes
    this.intervalId = setInterval(() => {
      this.update();
    }, this.updateInterval);

    console.log(`Update manager started (updates every ${this.updateInterval / 1000 / 60} minutes)`);
  }

  async update() {
    const timestamp = new Date().toLocaleString('da-DK');
    console.log(`[${timestamp}] Updating content...`);

    try {
      // Update calendar and ads in parallel
      await Promise.all([
        this.updateCalendar(),
        this.updateAds(),
        this.updateStaticAds()
      ]);

      console.log(`[${timestamp}] Update complete`);
    } catch (error) {
      console.error(`[${timestamp}] Update failed:`, error);
      // Continue with cached content, will retry in 10 minutes
    }
  }

  async updateCalendar() {
    try {
      await this.calendarRenderer.loadEvents();
    } catch (error) {
      console.error('Failed to update calendar:', error);
    }
  }

  async updateAds() {
    try {
      await this.adRotator.loadAds();
      // Ad rotation continues seamlessly with new ad list
    } catch (error) {
      console.error('Failed to update ads:', error);
    }
  }

  async updateStaticAds() {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();

      if (data.static && data.static.length > 0) {
        data.static.forEach((url, index) => {
          const img = document.getElementById(`static-ad-${index + 1}`);
          if (img) {
            // Add cache busting to force reload
            const cacheBustedUrl = `${url}?t=${Date.now()}`;
            img.src = cacheBustedUrl;
          }
        });
        console.log(`Updated ${data.static.length} static ads`);
      }
    } catch (error) {
      console.error('Failed to update static ads:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Update manager stopped');
    }
  }
}
