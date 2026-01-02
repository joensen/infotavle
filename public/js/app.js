// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Infotavle application starting...');

  // Check for cache clearing query parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clear-cache') === 'true') {
    console.log('Cache clearing requested via query string...');
    await clearCache();
  }

  // Initialize components
  const adRotator = new AdRotator('top-ad-display', 15000); // 15 seconds per ad
  const calendarRenderer = new CalendarRenderer('calendar-container');
  const updateManager = new UpdateManager(calendarRenderer, adRotator);

  // Load static ads
  loadStaticAds();

  // Start the update manager (loads initial data and schedules updates)
  updateManager.start();

  console.log('Infotavle application initialized');
});

async function clearCache() {
  try {
    const response = await fetch('/api/clear-cache', {
      method: 'POST'
    });
    const data = await response.json();
    console.log('Cache cleared:', data.message);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

async function loadStaticAds() {
  try {
    const response = await fetch('/api/ads');
    const data = await response.json();

    if (data.static && data.static.length > 0) {
      data.static.forEach((url, index) => {
        const img = document.getElementById(`static-ad-${index + 1}`);
        if (img) {
          img.src = url;
          img.onerror = () => {
            console.error(`Failed to load static ad ${index + 1}: ${url}`);
            // Keep the img element but it will show broken image or alt text
          };
        }
      });

      console.log(`Loaded ${data.static.length} static ads`);
    } else {
      console.warn('No static ads found');
    }
  } catch (error) {
    console.error('Error loading static ads:', error);
  }
}
