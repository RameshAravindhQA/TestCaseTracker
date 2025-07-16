// Global sound event handler
class GlobalSoundHandler {
  constructor() {
    console.log('🔊 Initializing Global Sound Handler...');
    this.setupGlobalListeners();
    console.log('✅ Global Sound Handler initialized');
  }

  setupGlobalListeners() {
    console.log('🔊 Setting up global sound listeners...');

    // Global click handler for interactive elements only
    document.addEventListener('click', (event) => {
      const target = event.target;

      // Only play sound for specific interactive elements
      const isButton = target.tagName.toLowerCase() === 'button' || 
                      target.getAttribute('role') === 'button' ||
                      target.closest('button') !== null;
      
      const isLink = target.tagName.toLowerCase() === 'a' || 
                    target.getAttribute('role') === 'link';
      
      const isInput = target.tagName.toLowerCase() === 'input' && 
                     ['submit', 'button', 'reset'].includes(target.type);

      // Don't play sound for disabled elements or divs with selected state
      const isDisabled = target.disabled || target.closest('[disabled]') || 
                        target.classList.contains('disabled') || 
                        target.closest('.disabled');

      // Don't play sound on divs or spans unless they have explicit button role
      const isDivOrSpan = ['div', 'span'].includes(target.tagName.toLowerCase()) && 
                         target.getAttribute('role') !== 'button';

      if ((isButton || isLink || isInput) && !isDisabled && !isDivOrSpan && window.soundManager) {
        console.log('🔊 Global handler: Playing click sound for', target.tagName);
        window.soundManager.playClick();
      }
    });

    // Add sound to form submissions
    document.addEventListener('submit', () => {
      this.playCrudSound();
    });

    // Add sound to input changes for CRUD operations
    let inputTimer;
    document.addEventListener('input', () => {
      clearTimeout(inputTimer);
      inputTimer = setTimeout(() => {
        this.playClickSound();
      }, 200);
    });

    // Listen for API responses
    this.setupApiSounds();
  }

  shouldPlayClickSound(element) {
    // Only play sound for actual buttons and button-like elements
    const tagName = element.tagName.toLowerCase();

    // Check if it's a button
    if (tagName === 'button') {
      return true;
    }

    // Check if it's an element with button role
    if (element.getAttribute('role') === 'button') {
      return true;
    }

    // Check if it's a clickable input (submit, button, etc.)
    if (tagName === 'input' && ['submit', 'button', 'reset'].includes(element.type)) {
      return true;
    }

    // Check if it has specific button classes (common UI library patterns)
    if (element.className && (
      element.className.includes('btn') ||
      element.className.includes('button') ||
      element.className.includes('Button') // React components
    )) {
      return true;
    }

    // Check if it's inside a button element (for nested elements)
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'button' || parent.getAttribute('role') === 'button') {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  async playClickSound() {
    console.log('🔊 Global handler: Playing click sound');
    if (window.soundManager) {
      await window.soundManager.playClick();
    } else {
      console.warn('⚠️ Sound manager not available for click sound');
    }
  }

  async playCrudSound() {
    console.log('🔊 Global handler: Playing CRUD sound');
    if (window.soundManager) {
      await window.soundManager.playCrud();
    } else {
      console.warn('⚠️ Sound manager not available for CRUD sound');
    }
  }

  async playSuccessSound() {
    console.log('🔊 Global handler: Playing success sound');
    if (window.soundManager) {
      await window.soundManager.playSuccess();
    } else {
      console.warn('⚠️ Sound manager not available for success sound');
    }
  }

  async playErrorSound() {
    console.log('🔊 Global handler: Playing error sound');
    if (window.soundManager) {
      await window.soundManager.playError();
    } else {
      console.warn('⚠️ Sound manager not available for error sound');
    }
  }

  setupApiSounds() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Play sound based on response status
        if (response.ok) {
          const url = args[0];
          if (typeof url === 'string') {
            if (url.includes('/api/') && (
              url.includes('POST') || 
              url.includes('PUT') || 
              url.includes('DELETE') ||
              args[1]?.method === 'POST' ||
              args[1]?.method === 'PUT' ||
              args[1]?.method === 'DELETE'
            )) {
              this.playCrudSound();
            } else {
              this.playSuccessSound();
            }
          }
        } else {
          this.playErrorSound();
        }

        return response;
      } catch (error) {
        this.playErrorSound();
        throw error;
      }
    };
  }
}

// Initialize global sound handler
if (typeof window !== 'undefined') {
  window.globalSoundHandler = new GlobalSoundHandler();
}

export default window.globalSoundHandler;