const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/config');

// Initialize cache with 10-minute TTL
const cache = new NodeCache({ stdTTL: config.cache.adDiscoveryTTL / 1000 });

class AdDiscoveryService {
  constructor() {
    this.baseUrl = config.adServer.url;
    this.cache = cache;
  }

  async checkFileExists(url) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async fetchAdDurations() {
    try {
      const propertiesUrl = `${this.baseUrl}/ad-durations.txt`;
      console.log(`Fetching ad durations from: ${propertiesUrl}`);

      const response = await axios.get(propertiesUrl, { timeout: 5000 });
      const durations = {};
      let parsedCount = 0;

      // Parse properties file
      const lines = response.data.split('\n');
      lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return; // Skip empty lines and comments

        const match = line.match(/^(\d+):\s*(\d+)s?$/i);
        if (match) {
          const adNumber = match[1].padStart(3, '0'); // Normalize to 001, 002, etc.
          const seconds = parseInt(match[2], 10);
          durations[adNumber] = seconds * 1000; // Convert to milliseconds
          parsedCount++;
          console.log(`  → Ad ${adNumber}: ${seconds}s`);
        }
      });

      console.log(`✓ Successfully loaded ad-durations.txt with ${parsedCount} custom durations:`, durations);
      return durations;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('⚠ ad-durations.txt not found on server - using default 20s for all ads');
      } else {
        console.log(`⚠ Error loading ad-durations.txt: ${error.message} - using default 20s for all ads`);
      }
      return {};
    }
  }

  async discoverRotatingAds() {
    const rotatingAds = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;

    for (let i = 1; i <= config.adServer.maxRotatingAds; i++) {
      const number = String(i).padStart(3, '0'); // Format: 001, 002, etc.
      let found = false;

      // Try each extension
      for (const ext of config.adServer.extensions) {
        const filename = `${config.adServer.rotatingPrefix}${number}${ext}`;
        const url = `${this.baseUrl}/${filename}`;

        const exists = await this.checkFileExists(url);

        if (exists) {
          rotatingAds.push({ url, number });
          found = true;
          consecutiveFailures = 0;
          console.log(`Found rotating ad: ${filename}`);
          break; // Found this number, move to next
        }
      }

      if (!found) {
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`Stopped rotating ad discovery after ${consecutiveFailures} consecutive failures`);
          break;
        }
      }
    }

    return rotatingAds;
  }

  async discoverStaticAds() {
    const staticAds = [];

    for (let i = 1; i <= config.adServer.staticCount; i++) {
      let found = false;

      // Try each extension
      for (const ext of config.adServer.extensions) {
        const filename = `${config.adServer.staticPrefix}${i}${ext}`;
        const url = `${this.baseUrl}/${filename}`;

        const exists = await this.checkFileExists(url);

        if (exists) {
          staticAds.push(url);
          found = true;
          console.log(`Found static ad: ${filename}`);
          break; // Found this number, move to next
        }
      }

      if (!found) {
        console.log(`Static ad ${i} not found, will use placeholder`);
      }
    }

    return staticAds;
  }

  async discoverAds() {
    // Check cache first
    const cachedData = cache.get('discovered_ads');
    if (cachedData) {
      console.log('Returning cached ad discovery data');
      return cachedData;
    }

    console.log('Discovering ads from server...');

    try {
      const [rotatingAdsData, staticAds, durations] = await Promise.all([
        this.discoverRotatingAds(),
        this.discoverStaticAds(),
        this.fetchAdDurations()
      ]);

      // Map rotating ads with their durations
      const rotating = rotatingAdsData.map(ad => ({
        url: ad.url,
        duration: durations[ad.number] || 20000 // Default 20 seconds
      }));

      const result = {
        rotating,
        static: staticAds,
        lastDiscovered: new Date().toISOString()
      };

      // Cache the result
      cache.set('discovered_ads', result);
      console.log(`Discovered ${rotating.length} rotating ads and ${staticAds.length} static ads`);

      return result;
    } catch (error) {
      console.error('Error discovering ads:', error.message);

      // Fallback to cached data even if expired
      const cachedData = cache.get('discovered_ads');
      if (cachedData) {
        console.log('Returning expired cached ad data due to error');
        return cachedData;
      }

      return {
        rotating: [],
        static: [],
        lastDiscovered: new Date().toISOString()
      };
    }
  }
}

module.exports = new AdDiscoveryService();
