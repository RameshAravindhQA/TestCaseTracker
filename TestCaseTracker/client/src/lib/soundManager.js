
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
    console.log('🔊 Starting sound preload...');
    
    const soundFiles = {
      click: '/sounds/click.mp3',
      crud: '/sounds/crud.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      message: '/sounds/success.mp3'
    };

    console.log('🔊 Sound files to preload:', soundFiles);

    for (const [type, url] of Object.entries(soundFiles)) {
      try {
        console.log(`🔊 Preloading ${type} from ${url}...`);
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = this.volume;
        
        // Wait for the audio to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn(`⏰ Audio load timeout for ${type}`);
            reject(new Error('Audio load timeout'));
          }, 5000);

          audio.addEventListener('canplaythrough', () => {
            console.log(`✅ Sound ${type} loaded successfully`);
            clearTimeout(timeout);
            resolve();
          }, { once: true });

          audio.addEventListener('error', (e) => {
            console.warn(`❌ Failed to preload sound: ${type}`, e);
            clearTimeout(timeout);
            resolve(); // Don't reject, just continue
          }, { once: true });

          audio.load();
        });

        this.sounds.set(type, audio);
        console.log(`✅ Sound ${type} added to collection`);
      } catch (error) {
        console.warn(`❌ Error preloading sound: ${type}`, error);
      }
    }
    
    console.log(`🔊 Sound preload complete. Loaded ${this.sounds.size} sounds:`, Array.from(this.sounds.keys()));
  }

  async playSound(type) {
    console.log(`🔊 Attempting to play sound: ${type}`);
    
    if (!this.enabled) {
      console.log('🔇 Sound is disabled, skipping playback');
      return;
    }

    try {
      let audio = this.sounds.get(type);
      
      if (!audio) {
        console.warn(`❌ Sound not found: ${type}. Available sounds:`, Array.from(this.sounds.keys()));
        return;
      }

      console.log(`🔊 Playing sound: ${type} at volume ${this.volume}`);
      
      // Clone the audio to allow multiple simultaneous plays
      audio = audio.cloneNode();
      audio.volume = this.volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log(`✅ Sound ${type} played successfully`);
      }
    } catch (error) {
      console.warn(`❌ Failed to play sound: ${type}`, error);
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
