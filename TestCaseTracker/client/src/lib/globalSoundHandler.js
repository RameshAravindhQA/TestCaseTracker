
// Global sound event handler
class GlobalSoundHandler {
  constructor() {
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Add click sound to all buttons and interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      if (this.shouldPlayClickSound(target)) {
        this.playClickSound();
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
    if (!element) return false;
    
    const tagName = element.tagName?.toLowerCase();
    const role = element.getAttribute('role');
    const type = element.getAttribute('type');
    
    return (
      tagName === 'button' ||
      tagName === 'a' ||
      type === 'submit' ||
      type === 'button' ||
      role === 'button' ||
      element.classList.contains('clickable') ||
      element.closest('button') ||
      element.closest('[role="button"]')
    );
  }

  async playClickSound() {
    if (window.soundManager) {
      await window.soundManager.playClick();
    }
  }

  async playCrudSound() {
    if (window.soundManager) {
      await window.soundManager.playCrud();
    }
  }

  async playSuccessSound() {
    if (window.soundManager) {
      await window.soundManager.playSuccess();
    }
  }

  async playErrorSound() {
    if (window.soundManager) {
      await window.soundManager.playError();
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
