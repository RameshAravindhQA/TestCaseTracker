export class SoundManager {
  constructor() {
    this.audioCache = new Map();
    this.isEnabled = true;
    this.volume = 0.5;
    this.soundMappings = {
      click: '/sounds/Mouse Click Sound.mp3',
      crud: '/sounds/CRUD Operation Sounds.mp3',
      success: '/sounds/happy-pop-2-185287.mp3',
      error: '/sounds/error-011-352286.mp3',
      message: '/sounds/message.mp3'
    };
    this.fallbackSounds = {
      click: this.generateTone(800, 100),
      crud: this.generateTone(600, 200),
      success: this.generateTone(880, 150),
      error: this.generateTone(300, 300),
      message: this.generateTone(500, 120)
    };
    this.init();
    this.settings = {
      enabled: true,
      volume: 0.5,
      theme: 'default',
      effects: {
        click: true,
        crud: true,
        success: true,
        error: true,
        message: true
      }
    };
  }

  async init() {
    console.log('🔊 Initializing Sound Manager...');
    await this.preloadSounds();
    this.setupGlobalEventListeners();
    console.log('🔊 Sound Manager initialized successfully');
  }

  async preloadSounds() {
    console.log('🔊 Preloading sounds...');
    const loadPromises = Object.entries(this.soundMappings).map(([key, path]) => 
      this.loadSound(key, path)
    );

    await Promise.allSettled(loadPromises);

    const loadedSounds = Array.from(this.audioCache.keys());
    console.log('🔊 Sound preload complete. Loaded sounds:', loadedSounds);
  }

  async loadSound(key, path) {
    try {
      console.log(`🔊 Preloading ${key} from ${path}...`);

      const audio = new Audio();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Audio load timeout for ${key} with ${path}`);
          reject(new Error(`Timeout loading ${key}`));
        }, 5000);

        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          console.log(`✅ Sound ${key} loaded successfully from ${path}`);
          this.audioCache.set(key, audio);
          resolve(audio);
        }, { once: true });

        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.log(`❌ Error loading ${key} from ${path}:`, e);
          reject(e);
        }, { once: true });

        audio.preload = 'auto';
        audio.src = path;
        audio.volume = this.volume;
      });
    } catch (error) {
      console.log(`❌ Failed to preload sound: ${key} from ${path}`, error);
      // Create synthetic sound as fallback
      console.log(`🎵 Creating synthetic sound for ${key}`);
      this.audioCache.set(key, this.fallbackSounds[key]);
    }
  }

  generateTone(frequency, duration) {
    return {
      play: () => {
        if (!this.isEnabled) return;
        console.log(`🎵 Playing synthetic sound: ${frequency}Hz for ${duration}ms`);

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      }
    };
  }

  setupGlobalEventListeners() {
    // Enhanced form submission detection
    document.addEventListener('submit', (event) => {
      console.log('🔊 Form submission detected, playing CRUD sound');
      this.playSound('crud');
    }, true);

    // Global click detection with priority system
    document.addEventListener('click', (event) => {
      const target = event.target;

      // Priority 1: Form submission buttons -> CRUD sound
      if (this.isFormSubmissionButton(target)) {
        console.log('🔊 Form submission button detected, playing CRUD sound');
        this.playSound('crud');
        return;
      }

      // Priority 2: API-related buttons -> CRUD sound
      if (this.isApiButton(target)) {
        console.log('🔊 API button detected, playing CRUD sound');
        this.playSound('crud');
        return;
      }

      // Priority 3: Any clickable element -> click sound
      if (this.isClickableElement(target)) {
        console.log('🔊 Clickable element detected, playing click sound');
        this.playSound('click');
      }
    }, true);

    // Enhanced mutation observer for dynamic buttons
    this.observeFormElements();
  }

  isClickableElement(element) {
    if (!element) return false;

    const clickableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const clickableRoles = ['button', 'link', 'tab', 'menuitem'];

    // Check tag name
    if (clickableElements.includes(element.tagName)) {
      return true;
    }

    // Check parent elements
    const parent = element.closest('button, a, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick], [data-click]');
    if (parent) {
      return true;
    }

    // Check role attribute
    if (clickableRoles.includes(element.getAttribute('role'))) {
      return true;
    }

    // Check for click handlers
    if (element.onclick || element.getAttribute('onClick')) {
      return true;
    }

    // Check for cursor pointer style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
      return true;
    }

    return false;
  }

  isFormSubmissionButton(element) {
    if (!element) return false;

    const button = element.tagName === 'BUTTON' ? element : element.closest('button');
    if (!button) return false;

    // Exclude dropdown and select elements
    if (button.closest('[role="option"]') || 
        button.closest('[data-radix-select-item]') ||
        button.closest('.select-item') ||
        button.closest('select') ||
        button.closest('[role="menuitem"]') ||
        button.closest('.dropdown-menu')) {
      return false;
    }

    // Check button type
    if (button.type === 'submit') return true;

    // Check button text content for submission indicators
    const text = button.textContent?.toLowerCase() || '';
    const submissionKeywords = [
      'save', 'submit', 'create', 'update', 'delete', 'remove', 
      'add', 'edit', 'confirm', 'apply', 'send', 'post', 'put',
      'upload', 'download', 'export', 'import', 'generate',
      'register', 'login', 'sign in', 'sign up'
    ];

    if (submissionKeywords.some(keyword => text.includes(keyword))) {
      return true;
    }

    // Check if button is inside a form (but not in dropdown components)
    const form = button.closest('form');
    if (form && !button.closest('[role="combobox"]') && !button.closest('[data-radix-select-root]')) {
      return true;
    }

    return false;
  }

  isApiButton(element) {
    if (!element) return false;

    const button = element.tagName === 'BUTTON' ? element : element.closest('button');
    if (!button) return false;

    // Check for data attributes that suggest API calls
    const apiAttributes = ['data-action', 'data-method', 'data-api', 'data-endpoint'];
    if (apiAttributes.some(attr => button.hasAttribute(attr))) {
      return true;
    }

    // Check class names for API-related patterns
    const className = button.className.toLowerCase();
    const apiClasses = ['api-', 'crud-', 'submit-', 'action-', 'mutate-'];
    if (apiClasses.some(cls => className.includes(cls))) {
      return true;
    }

    return false;
  }

  observeFormElements() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for new form elements
            const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
            const buttons = node.querySelectorAll ? node.querySelectorAll('button[type="submit"]') : [];

            if (forms.length > 0 || buttons.length > 0) {
              console.log('🔊 New form elements detected, updating listeners');
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async playSound(soundKey) {
    if (!this.isEnabled) {
      console.log(`🔊 Sound disabled, skipping: ${soundKey}`);
      return;
    }

    console.log(`🔊 Attempting to play sound: ${soundKey}`);

    try {
      const audio = this.audioCache.get(soundKey);
      if (audio) {
        if (audio.play) {
          audio.currentTime = 0;
          await audio.play();
          console.log(`🎵 Successfully played sound: ${soundKey}`);
        } else {
          // Synthetic sound
          audio.play();
          console.log(`🎵 Playing synthetic sound: ${soundKey}`);
        }
      } else {
        console.warn(`⚠️ Sound not found: ${soundKey}`);
        // Try to load and play immediately
        const path = this.soundMappings[soundKey];
        if (path) {
          const audio = new Audio(path);
          audio.volume = this.volume;
          await audio.play();
        }
      }
    } catch (error) {
      console.error(`❌ Error playing sound ${soundKey}:`, error);
      // Fallback to synthetic sound
      const fallback = this.fallbackSounds[soundKey];
      if (fallback) {
        fallback.play();
      }
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach((audio) => {
      if (audio.volume !== undefined) {
        audio.volume = this.volume;
      }
    });
    console.log(`🔊 Volume set to: ${this.volume}`);
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Public API methods
  playCrudSound() { this.playSound('crud'); }
  playClickSound() { this.playSound('click'); }
  playSuccessSound() { this.playSound('success'); }
  playErrorSound() { this.playSound('error'); }
  playMessageSound() { this.playSound('message'); }

  setupGlobalErrorHandling() {
    // Only handle explicit UI errors triggered by user actions
    document.addEventListener('ui:error', (event) => {
      if (this.userHasInteracted && event.detail && event.detail.playSound !== false) {
        console.log('🔊 UI handler: Playing error sound for user interaction error');
        this.playSound('error');
      }
    });
    
    // Listen for form validation errors
    document.addEventListener('form:validation:error', (event) => {
      if (this.userHasInteracted) {
        console.log('🔊 Form validation: Playing error sound');
        this.playSound('error');
      }
    });
  }

  // Method to trigger UI error sound manually
  triggerUIError() {
    if (this.isEnabled) {
      this.playSound('error');
    }
  }
    // Get current settings
  getSettings() {
    return {
      ...this.settings,
      volume: this.volume,
      enabled: this.isEnabled,
      theme: this.currentTheme
    };
  }

  // Update settings
  updateSettings(newSettings) {
    if (newSettings.enabled !== undefined) {
      this.isEnabled = newSettings.enabled;
      this.settings.enabled = newSettings.enabled;
    }

    if (newSettings.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, newSettings.volume));
      this.settings.volume = this.volume;
    }

    if (newSettings.theme !== undefined) {
      this.currentTheme = newSettings.theme;
      this.settings.theme = newSettings.theme;
    }

    if (newSettings.effects !== undefined) {
      this.settings.effects = { ...this.settings.effects, ...newSettings.effects };
    }

    // Save to localStorage
    try {
      localStorage.setItem('soundSettings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save sound settings to localStorage:', e);
    }

    console.log('🔊 Sound settings updated:', this.settings);
    return this.settings;
  }

  // Test a specific sound
  testSound(soundName) {
    if (!this.isEnabled) {
      console.log(`🔇 Sound testing disabled`);
      return false;
    }

    const audio = this.audioCache.get(soundName);
    if (!sound || !sound.audio) {
      console.warn(`🔊 Test sound not found: ${soundName}`);
      return false;
    }

    try {
      sound.audio.currentTime = 0;
      sound.audio.volume = this.volume;
      const playPromise = sound.audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 Test sound played successfully: ${soundName}`);
          })
          .catch(error => {
            console.error(`🔊 Test sound play failed: ${soundName}`, error);
          });
      }
      return true;
    } catch (error) {
      console.error(`🔊 Error testing sound ${soundName}:`, error);
      return false;
    }
  }

  // Get available sounds list
  getAvailableSounds() {
    return Array.from(this.audioCache.keys());
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem('soundSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.updateSettings(settings);
        console.log('🔊 Loaded sound settings from localStorage:', settings);
      }
    } catch (e) {
      console.warn('Failed to load sound settings from localStorage:', e);
    }
  }

  // Clean up resources
  destroy() {
    this.audioCache.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    });
    this.audioCache.clear();
  }
}

// Initialize sound manager when this module is imported
if (typeof window !== 'undefined') {
  window.soundManager = new SoundManager();
  // Load saved settings
  window.soundManager.loadSettings();
  console.log('🔊 Sound manager initialized successfully');
}

export const soundManager = typeof window !== 'undefined' ? window.soundManager : null;