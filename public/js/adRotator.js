class AdRotator {
  constructor(containerId, defaultDuration = 20000) {
    this.container = document.getElementById(containerId);
    this.defaultDuration = defaultDuration;
    this.ads = [];
    this.currentIndex = 0;
    this.timeoutId = null;
    this.preloadedMedia = null;
    this.adStartTime = null;
    this.progressFill = document.getElementById('ad-progress-fill');
  }

  async loadAds() {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();

      if (data.rotating && data.rotating.length > 0) {
        this.ads = data.rotating;
        console.log(`📦 Loaded ${this.ads.length} rotating ads with custom durations:`);
        this.ads.forEach((ad, i) => {
          const duration = ad.duration || this.defaultDuration;
          console.log(`  ${i + 1}. ${ad.url.split('/').pop()} → ${duration / 1000}s`);
        });

        // Only restart if not already running or if ads changed
        if (!this.timeoutId) {
          this.startRotation();
        }
      } else {
        console.warn('No rotating ads found');
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  }

  startRotation() {
    if (this.ads.length === 0) {
      console.warn('No ads to rotate');
      return;
    }

    // Show first ad immediately
    this.showAd(0);
  }

  showAd(index) {
    if (index >= this.ads.length) return;

    // Log actual duration of previous ad
    if (this.adStartTime !== null) {
      const actualDuration = Date.now() - this.adStartTime;
      console.log(`⏱️  Previous ad was shown for ${(actualDuration / 1000).toFixed(1)}s`);
    }

    const ad = this.ads[index];
    const baseUrl = ad.url || ad; // Support both object and string format
    const hour = new Date().getHours();
    const skipCacheBust = hour >= 8 && hour < 14; // No cache-bust during 8:00-14:00
    const adUrl = skipCacheBust ? baseUrl : `${baseUrl}?t=${Date.now()}`;
    const duration = ad.duration || this.defaultDuration;
    const isVideo = baseUrl.toLowerCase().endsWith('.mp4');
    const fileName = baseUrl.split('/').pop();

    this.adStartTime = Date.now();
    const expectedEndTime = new Date(this.adStartTime + duration);

    console.log(`\n🎬 Showing ad ${index + 1}/${this.ads.length}: ${fileName}`);
    console.log(`   Expected duration: ${duration / 1000}s`);
    console.log(`   Started at: ${new Date(this.adStartTime).toLocaleTimeString('da-DK')}`);
    console.log(`   Will end at: ${expectedEndTime.toLocaleTimeString('da-DK')}`);

    // Preload next ad
    const nextIndex = (index + 1) % this.ads.length;
    const preloadDelay = Math.max(duration - 5000, 1000); // Preload 5s before or at least 1s
    setTimeout(() => this.preloadNext(nextIndex), preloadDelay);

    // Schedule next ad transition
    this.timeoutId = setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.ads.length;
      this.showAd(this.currentIndex);
    }, duration);

    // Reset and start progress bar animation
    this.startProgressBar(duration);

    // Fade out current content
    this.container.style.opacity = '0';

    setTimeout(() => {
      // Clean up old content
      this.clearContainer();

      // Create new content
      if (isVideo) {
        const video = document.createElement('video');
        video.src = adUrl;
        video.autoplay = true;
        video.muted = true;
        video.loop = false;
        video.playsInline = true;
        video.style.width = '100%';

        // Handle video errors
        video.onerror = () => {
          console.error(`Failed to load video: ${adUrl}`);
          this.showNextAd();
        };

        this.container.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = adUrl;
        img.style.width = '100%';

        // Handle image errors
        img.onerror = () => {
          console.error(`Failed to load image: ${adUrl}`);
          this.showNextAd();
        };

        this.container.appendChild(img);
      }

      // Fade in new content
      setTimeout(() => {
        this.container.style.opacity = '1';
      }, 50);
    }, 500);
  }

  showNextAd() {
    // Skip to next ad if current one fails
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.currentIndex = (this.currentIndex + 1) % this.ads.length;
    this.showAd(this.currentIndex);
  }

  preloadNext(index) {
    if (index >= this.ads.length) return;

    const ad = this.ads[index];
    const baseUrl = ad.url || ad; // Support both object and string format
    const hour = new Date().getHours();
    const skipCacheBust = hour >= 8 && hour < 14; // No cache-bust during 8:00-14:00
    const nextAdUrl = skipCacheBust ? baseUrl : `${baseUrl}?t=${Date.now()}`;
    const isVideo = baseUrl.toLowerCase().endsWith('.mp4');

    // Clean up previous preloaded media
    if (this.preloadedMedia) {
      if (this.preloadedMedia.tagName === 'VIDEO') {
        this.preloadedMedia.src = '';
        this.preloadedMedia.load();
      }
      this.preloadedMedia = null;
    }

    // Preload next media
    if (isVideo) {
      this.preloadedMedia = document.createElement('video');
      this.preloadedMedia.src = nextAdUrl;
      this.preloadedMedia.load();
    } else {
      this.preloadedMedia = new Image();
      this.preloadedMedia.src = nextAdUrl;
    }
  }

  clearContainer() {
    // Clean up video elements properly to free memory
    const videos = this.container.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.src = '';
      video.load();
    });

    // Clear all content
    this.container.innerHTML = '';
  }

  startProgressBar(duration) {
    // Reset progress bar
    this.progressFill.style.transition = 'none';
    this.progressFill.style.width = '0%';

    // Force reflow to ensure the reset takes effect
    this.progressFill.offsetHeight;

    // Start animation
    this.progressFill.style.transition = `width ${duration}ms linear`;
    this.progressFill.style.width = '100%';
  }

  stopRotation() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.clearContainer();
      console.log('Stopped ad rotation');
    }
  }
}
