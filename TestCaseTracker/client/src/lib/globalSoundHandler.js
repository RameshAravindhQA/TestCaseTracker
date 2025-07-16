// Global sound event handler for the entire application
class GlobalSoundHandler {
  constructor() {
    this.soundManager = null;
    this.initialized = false;
    this.userHasInteracted = false;
    this.setupUserInteractionTracking();
  }

  // Track when user has actually interacted with the page
  setupUserInteractionTracking() {
    const markUserInteraction = () => {
      this.userHasInteracted = true;
      console.log('👤 User interaction detected - sounds enabled');
      // Remove listeners after first interaction
      document.removeEventListener('click', markUserInteraction);
      document.removeEventListener('keydown', markUserInteraction);
      document.removeEventListener('touchstart', markUserInteraction);
    };

    document.addEventListener('click', markUserInteraction);
    document.addEventListener('keydown', markUserInteraction);
    document.addEventListener('touchstart', markUserInteraction);
  }

  async initialize(soundManager) {
    if (this.initialized) {
      console.log('🔊 Global sound handler already initialized');
      return;
    }

    this.soundManager = soundManager;
    this.initialized = true;

    console.log('🔊 Global sound handler initialized');

    // Set up global error handling - but don't play sounds automatically
    this.setupGlobalErrorHandling();
    this.setupGlobalSuccessHandling();
  }

  setupGlobalErrorHandling() {
    // Only handle custom application errors, not console/development errors
    document.addEventListener('app:error', (event) => {
      if (this.userHasInteracted && 
          !this.isNetworkError(event) && 
          !this.isDevelopmentError(event) && 
          !this.isResourceError(event)) {
        console.log('🔊 Global handler: Playing error sound for app error');
        this.playSound('error');
      }
    });
  }

  setupGlobalSuccessHandling() {
    // Listen for custom success events only
    document.addEventListener('app:success', () => {
      if (this.userHasInteracted) {
        console.log('🔊 Global handler: Playing success sound');
        this.playSound('success');
      }
    });
  }

  // Check if error is network-related (shouldn't trigger sounds)
  isNetworkError(error) {
    if (!error) return false;
    const errorString = error.toString().toLowerCase();
    return errorString.includes('network') || 
           errorString.includes('fetch') || 
           errorString.includes('connection') ||
           errorString.includes('timeout') ||
           errorString.includes('err_connection') ||
           errorString.includes('err_connection_timed_out') ||
           errorString.includes('net::err_connection_timed_out') ||
           errorString.includes('websocket') ||
           errorString.includes('socket');
  }

  // Check if error is development-related (shouldn't trigger sounds)
  isDevelopmentError(error) {
    if (!error) return false;
    const errorString = error.toString().toLowerCase();
    return errorString.includes('uncaught referenceerror') || 
           errorString.includes('syntaxerror') ||
           errorString.includes('chunk-') ||
           errorString.includes('vite') ||
           errorString.includes('dev server') ||
           errorString.includes('hmr') ||
           errorString.includes('hot reload') ||
           errorString.includes('useeffect is not defined') ||
           errorString.includes('console') ||
           errorString.includes('warning') ||
           errorString.includes('validatedomnesting') ||
           errorString.includes('the above error occurred') ||
           errorString.includes('consider adding an error boundary');
  }

  // Check if error is resource-related (shouldn't trigger sounds)
  isResourceError(event) {
    if (!event) return false;
    return event.type === 'error' && 
           (event.target.tagName === 'IMG' || 
            event.target.tagName === 'AUDIO' || 
            event.target.tagName === 'VIDEO' ||
            event.target.tagName === 'SCRIPT' ||
            event.target.tagName === 'LINK');
  }

  // Public method to play sounds (only if user has interacted)
  playSound(soundName) {
    if (!this.initialized || !this.soundManager) {
      console.warn('🔊 Sound manager not initialized');
      return;
    }

    if (!this.userHasInteracted) {
      console.log('🔊 Skipping sound - user has not interacted yet');
      return;
    }

    try {
      this.soundManager.playSound(soundName);
    } catch (error) {
      console.error('🔊 Error playing sound:', error);
    }
  }

  // Method to play sound on user actions (buttons, form submissions, etc.)
  playUserActionSound(soundName) {
    if (!this.initialized || !this.soundManager) {
      return;
    }

    // Mark that user has interacted since they triggered this action
    this.userHasInteracted = true;

    try {
      console.log(`🔊 Playing user action sound: ${soundName}`);
      this.soundManager.playSound(soundName);
    } catch (error) {
      console.error('🔊 Error playing user action sound:', error);
    }
  }
}

// Global Sound Handler for API Integrations
class GlobalSoundHandler {
  constructor() {
    this.isInitialized = false;
    this.soundManager = null;
    this.requestCount = 0;
    this.init();
  }

  async init() {
    console.log('🔊 Initializing global sound handler...');

    // Wait for sound manager to be available
    let attempts = 0;
    while (!window.soundManager && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.soundManager) {
      this.soundManager = window.soundManager;
      this.setupApiInterceptors();
      this.setupQueryClientIntegration();
      this.isInitialized = true;
      console.log('🔊 Global sound handler initialized successfully');
    } else {
      console.warn('⚠️ Sound manager not available after waiting');
    }
  }

  setupApiInterceptors() {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const method = options?.method || 'GET';

      console.log(`🔊 API call intercepted: ${method} ${url}`);

      try {
        const response = await originalFetch(...args);

        if (this.shouldPlaySound(method, url, response.status)) {
          if (response.ok) {
            if (this.isCrudOperation(method, url)) {
              console.log('🔊 Playing CRUD success sound');
              this.soundManager?.playCrudSound();
            } else {
              console.log('🔊 Playing success sound');
              this.soundManager?.playSuccessSound();
            }
          } else {
            console.log('🔊 Playing error sound for HTTP error');
            this.soundManager?.playErrorSound();
          }
        }

        return response;
      } catch (error) {
        console.log('🔊 Playing error sound for network error');
        this.soundManager?.playErrorSound();
        throw error;
      }
    };
  }

  setupQueryClientIntegration() {
    // Enhanced TanStack Query integration
    if (typeof window !== 'undefined') {
      // Listen for mutation events
      document.addEventListener('tanstack-query-mutation-start', () => {
        console.log('🔊 TanStack Query mutation started');
      });

      document.addEventListener('tanstack-query-mutation-success', () => {
        console.log('🔊 TanStack Query mutation succeeded, playing CRUD sound');
        this.soundManager?.playCrudSound();
      });

      document.addEventListener('tanstack-query-mutation-error', () => {
        console.log('🔊 TanStack Query mutation failed, playing error sound');
        this.soundManager?.playErrorSound();
      });
    }
  }

  isCrudOperation(method, url = '') {
    const crudMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!crudMethods.includes(method?.toUpperCase())) {
      return false;
    }

    // Enhanced URL pattern matching for CRUD operations
    const crudPatterns = [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/auth/logout',
      '/api/user/',
      '/api/projects',
      '/api/test-cases',
      '/api/bugs',
      '/api/modules',
      '/api/reports',
      '/api/documents',
      '/api/timesheets',
      '/api/notebooks',
      '/api/github/integrations',
      'upload',
      'create',
      'update',
      'delete'
    ];

    return crudPatterns.some(pattern => url.includes(pattern));
  }

  shouldPlaySound(method, url, status) {
    // Don't play sounds for polling or health check endpoints
    const silentEndpoints = ['/health', '/ping', '/status', '/heartbeat', '/socket.io'];
    if (silentEndpoints.some(endpoint => url?.includes(endpoint))) {
      return false;
    }

    // Don't play sounds for asset requests
    if (url?.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|mp3|wav|ogg|json)$/)) {
      return false;
    }

    // Don't play sounds for WebSocket connections
    if (url?.includes('socket.io') || url?.includes('ws://') || url?.includes('wss://')) {
      return false;
    }

    return true;
  }
}

// Create global instance
const globalSoundHandler = new GlobalSoundHandler();

// Export for use in other modules
export default globalSoundHandler;