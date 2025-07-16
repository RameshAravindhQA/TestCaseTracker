
class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;
    this.loadSettings();
    this.preloadSounds();
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('soundSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled !== false;
        this.volume = parsed.volume || 0.5;
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('soundSettings', JSON.stringify({
        enabled: this.enabled,
        volume: this.volume
      }));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  async preloadSounds() {
    const soundFiles = {
      click: '/sounds/click.mp3',
      crud: '/sounds/crud.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      message: '/sounds/success.mp3'
    };

    for (const [type, url] of Object.entries(soundFiles)) {
      try {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = this.volume;
        
        // Wait for the audio to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio load timeout'));
          }, 5000);

          audio.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });

          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            console.warn(`Failed to preload sound: ${type}`, e);
            resolve(); // Don't reject, just continue
          }, { once: true });

          audio.load();
        });

        this.sounds.set(type, audio);
      } catch (error) {
        console.warn(`Error preloading sound: ${type}`, error);
      }
    }
  }

  async playSound(type) {
    if (!this.enabled) return;

    try {
      let audio = this.sounds.get(type);
      
      if (!audio) {
        console.warn(`Sound not found: ${type}`);
        return;
      }

      // Clone the audio to allow multiple simultaneous plays
      audio = audio.cloneNode();
      audio.volume = this.volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.warn(`Failed to play sound: ${type}`, error);
    }
  }

  // Convenience methods
  playClick() { return this.playSound('click'); }
  playCrud() { return this.playSound('crud'); }
  playSuccess() { return this.playSound('success'); }
  playError() { return this.playSound('error'); }
  playMessage() { return this.playSound('message'); }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
    this.saveSettings();
  }

  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume
    };
  }
}

// Create global instance
window.soundManager = new SoundManager();

export default window.soundManager;
