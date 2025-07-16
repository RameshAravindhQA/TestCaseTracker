
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
      message: '/sounds/message.mp3'
    };

    console.log('🔊 Sound files to preload:', soundFiles);

    for (const [type, url] of Object.entries(soundFiles)) {
      try {
        console.log(`🔊 Preloading ${type} from ${url}...`);
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = this.volume;
        audio.crossOrigin = 'anonymous';
        
        // Create a more robust loading promise
        const loadPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn(`⏰ Audio load timeout for ${type}`);
            // Create a fallback silent audio
            const fallbackAudio = this.createFallbackAudio();
            this.sounds.set(type, fallbackAudio);
            resolve(fallbackAudio);
          }, 3000);

          const onLoad = () => {
            console.log(`✅ Sound ${type} loaded successfully`);
            clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', onLoad);
            audio.removeEventListener('error', onError);
            resolve(audio);
          };

          const onError = (e) => {
            console.warn(`❌ Failed to preload sound: ${type}`, e);
            clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', onLoad);
            audio.removeEventListener('error', onError);
            // Create fallback audio instead of rejecting
            const fallbackAudio = this.createFallbackAudio();
            resolve(fallbackAudio);
          };

          audio.addEventListener('canplaythrough', onLoad, { once: true });
          audio.addEventListener('error', onError, { once: true });
        });

        // Set the source after setting up event listeners
        audio.src = url;
        
        const loadedAudio = await loadPromise;
        this.sounds.set(type, loadedAudio);
        console.log(`✅ Sound ${type} added to collection`);
      } catch (error) {
        console.warn(`❌ Error preloading sound: ${type}`, error);
        // Add fallback audio
        this.sounds.set(type, this.createFallbackAudio());
      }
    }
    
    console.log(`🔊 Sound preload complete. Loaded ${this.sounds.size} sounds:`, Array.from(this.sounds.keys()));
  }

  createFallbackAudio() {
    // Create a silent audio element as fallback
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwiBjiuztfSeiMJJX7P9+OQShEIZrjt52d/S';
    return audio;
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
      const clonedAudio = audio.cloneNode();
      clonedAudio.volume = this.volume;
      clonedAudio.currentTime = 0;

      const playPromise = clonedAudio.play();
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
