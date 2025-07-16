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

  // Create procedural sounds using Web Audio API
  createSyntheticSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies and patterns for different sound types
      switch (type) {
        case 'click':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'success':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
        case 'crud':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(550, audioContext.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'message':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
        default:
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      }

      oscillator.type = 'sine';
      
      return new Promise((resolve) => {
        oscillator.onended = () => {
          audioContext.close();
          resolve();
        };
        
        oscillator.start();
        
        const duration = type === 'success' ? 0.3 : type === 'error' ? 0.3 : type === 'message' ? 0.2 : 0.1;
        oscillator.stop(audioContext.currentTime + duration);
      });
    } catch (error) {
      console.warn('Failed to create synthetic sound:', error);
      return Promise.resolve();
    }
  }

  createFallbackAudio() {
    // Create a minimal working audio element
    const audio = new Audio();
    // Very short silent audio data URI
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAAAQESWAkAfAAABAAEAZGF0YQAAAAA=';
    audio.volume = this.volume;
    return audio;
  }

  async preloadSounds() {
    console.log('🔊 Starting sound preload...');

    // Load custom sounds from localStorage if available
    const customSounds = this.getCustomSounds();

    const soundFiles = {
      click: customSounds.click || '/sounds/click.mp3',
      crud: customSounds.crud || '/sounds/crud.mp3',
      success: customSounds.success || '/sounds/success.mp3',
      error: customSounds.error || '/sounds/error.mp3',
      message: customSounds.message || '/sounds/message.mp3'
    };

    console.log('🔊 Sound files to preload:', soundFiles);

    for (const [type, url] of Object.entries(soundFiles)) {
      try {
        console.log(`🔊 Preloading ${type} from ${url}...`);
        
        // Try multiple formats
        const formats = [url, url.replace('.mp3', '.wav'), url.replace('.mp3', '.ogg')];
        let audioLoaded = false;

        for (const formatUrl of formats) {
          if (audioLoaded) break;
          
          try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.volume;
            audio.crossOrigin = 'anonymous';
            
            const loadPromise = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.warn(`⏰ Audio load timeout for ${type} with ${formatUrl}`);
                reject(new Error('Timeout'));
              }, 2000);

              const onLoad = () => {
                console.log(`✅ Sound ${type} loaded successfully from ${formatUrl}`);
                clearTimeout(timeout);
                audio.removeEventListener('canplaythrough', onLoad);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                resolve(audio);
              };

              const onError = (e) => {
                console.warn(`❌ Failed to preload sound: ${type} from ${formatUrl}`, e);
                clearTimeout(timeout);
                audio.removeEventListener('canplaythrough', onLoad);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                reject(e);
              };

              audio.addEventListener('canplaythrough', onLoad, { once: true });
              audio.addEventListener('loadeddata', onLoad, { once: true });
              audio.addEventListener('error', onError, { once: true });
            });

            audio.src = formatUrl;
            
            const loadedAudio = await loadPromise;
            this.sounds.set(type, loadedAudio);
            console.log(`✅ Sound ${type} added to collection from ${formatUrl}`);
            audioLoaded = true;
          } catch (error) {
            console.warn(`❌ Error loading ${type} from ${formatUrl}:`, error);
          }
        }

        // If no format worked, create synthetic sound
        if (!audioLoaded) {
          console.log(`🎵 Creating synthetic sound for ${type}`);
          this.sounds.set(type, 'synthetic');
        }
      } catch (error) {
        console.warn(`❌ Error preloading sound: ${type}`, error);
        this.sounds.set(type, 'synthetic');
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
        // Create synthetic sound on-demand
        await this.createSyntheticSound(type);
        return;
      }

      if (audio === 'synthetic') {
        console.log(`🎵 Playing synthetic sound: ${type}`);
        await this.createSyntheticSound(type);
        return;
      }

      console.log(`🔊 Playing sound: ${type} at volume ${this.volume}`);
      
      // Clone the audio to allow multiple simultaneous plays
      const clonedAudio = audio.cloneNode();
      clonedAudio.volume = this.volume;
      clonedAudio.currentTime = 0;

      // Handle different audio states
      if (clonedAudio.readyState >= 2) { // HAVE_CURRENT_DATA
        const playPromise = clonedAudio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`✅ Sound ${type} played successfully`);
        }
      } else {
        console.log(`🎵 Audio not ready, falling back to synthetic sound for ${type}`);
        await this.createSyntheticSound(type);
      }
    } catch (error) {
      console.warn(`❌ Failed to play sound: ${type}`, error);
      // Fallback to synthetic sound
      console.log(`🎵 Falling back to synthetic sound for ${type}`);
      await this.createSyntheticSound(type);
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
      if (audio !== 'synthetic' && audio.volume !== undefined) {
        audio.volume = this.volume;
      }
    });
    this.saveSettings();
  }

  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume
    };
  }

  // Import/Export functionality
  getCustomSounds() {
    try {
      const stored = localStorage.getItem('customSounds');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
      return {};
    }
  }

  setCustomSound(type, audioFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const customSounds = this.getCustomSounds();
          customSounds[type] = e.target.result;
          localStorage.setItem('customSounds', JSON.stringify(customSounds));
          
          // Create audio element for the custom sound
          const audio = new Audio(e.target.result);
          audio.volume = this.volume;
          this.sounds.set(type, audio);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioFile);
    });
  }

  exportSounds() {
    const customSounds = this.getCustomSounds();
    const settings = this.getSettings();
    
    const exportData = {
      sounds: customSounds,
      settings: settings,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sound-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importSounds(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.sounds) {
            localStorage.setItem('customSounds', JSON.stringify(importData.sounds));
          }
          
          if (importData.settings) {
            this.enabled = importData.settings.enabled !== false;
            this.volume = importData.settings.volume || 0.5;
            this.saveSettings();
          }
          
          // Reload sounds
          this.preloadSounds();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  resetToDefaults() {
    localStorage.removeItem('customSounds');
    localStorage.removeItem('soundSettings');
    this.enabled = true;
    this.volume = 0.5;
    this.sounds.clear();
    this.preloadSounds();
  }

  getCustomSounds() {
    try {
      const customSounds = localStorage.getItem('customSounds');
      return customSounds ? JSON.parse(customSounds) : {};
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
      return {};
    }
  }
}

// Create global instance
window.soundManager = new SoundManager();

export default window.soundManager;