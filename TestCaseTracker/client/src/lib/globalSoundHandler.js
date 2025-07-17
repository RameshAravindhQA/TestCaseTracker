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

    console.log('🔊 Global sound handler initialized with sound manager:', !!soundManager);

    // Set up global error handling - but don't play sounds automatically
    this.setupGlobalErrorHandling();
    this.setupGlobalSuccessHandling();

    // Test sound manager connection
    if (soundManager && typeof soundManager.playSound === 'function') {
      console.log('🔊 Sound manager connection verified');
    } else {
      console.warn('🔊 Sound manager connection failed');
    }
  }

  setupGlobalErrorHandling() {
    // Only handle explicit application errors through custom events
    document.addEventListener('app:error', (event) => {
      if (this.userHasInteracted && !this.isNetworkError(event) && !this.isDevelopmentError(event)) {
        console.log('🔊 Global handler: Playing error sound for app error');
        this.playSound('error');
      }
    });

    // Listen for toast success events only
    document.addEventListener('toast:success', (event) => {
      if (this.userHasInteracted) {
        console.log('🔊 Global handler: Playing success sound for toast');
        this.playSound('success');
      }
    });

    // Disable all automatic console error handling
    // No longer intercept console methods to prevent unwanted sounds
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
           errorString.includes('socket') ||
           errorString.includes('failed to load resource') ||
           errorString.includes('err_connection_timeout') ||
           errorString.includes('connection_timed_out') ||
           errorString.includes('vite') ||
           errorString.includes('polling') ||
           errorString.includes('server connection lost') ||
           errorString.includes('unhandled promise rejection') ||
           errorString.includes('loading') ||
           errorString.includes('preload') ||
           errorString.includes('resource');
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
           errorString.includes('consider adding an error boundary') ||
           errorString.includes('err_connection_timed_out') ||
           errorString.includes('failed to load resource') ||
           errorString.includes('net::err_connection') ||
           errorString.includes('ping') ||
           errorString.includes('waitforsuccessfulping') ||
           errorString.includes('replit.dev') ||
           errorString.includes('unhandled promise rejection') ||
           errorString.includes('unhandledrejection') ||
           errorString.includes('connection_timed_out') ||
           errorString.includes('polling') ||
           errorString.includes('server connection lost') ||
           errorString.includes('loading') ||
           errorString.includes('preload') ||
           errorString.includes('import') ||
           errorString.includes('module') ||
           errorString.includes('sound') ||
           errorString.includes('audio') ||
           errorString.includes('global');
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
      console.log('🔊 Cannot play sound - not initialized or no sound manager');
      return;
    }

    // Mark that user has interacted since they triggered this action
    this.userHasInteracted = true;

    try {
      console.log(`🔊 Playing user action sound: ${soundName}`);
      if (typeof this.soundManager.playSound === 'function') {
        this.soundManager.playSound(soundName);
      } else {
        console.warn('🔊 Sound manager playSound method not available');
      }
    } catch (error) {
      console.error('🔊 Error playing user action sound:', error);
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
            // Only play error sound for explicit user actions that fail
            if (response.status >= 400 && response.status < 500 && this.isCrudOperation(method, url)) {
              console.log('🔊 Playing error sound for user action failure');
              this.soundManager?.playErrorSound();
            }
          }
        }

        return response;
      } catch (error) {
        // Only play error sound for explicit user actions that fail
        if (this.isCrudOperation(method, url) && !this.isNetworkError(error) && !this.isDevelopmentError(error)) {
          console.log('🔊 Playing error sound for user action failure');
          this.soundManager?.playErrorSound();
        }
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

    // Exclude dropdown/select operations - use click sound instead
    const dropdownPatterns = [
      'dropdown',
      'select',
      'option',
      'filter',
      'sort',
      'menu',
      'choice'
    ];

    if (dropdownPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
      return false;
    }

    // Only play CRUD sounds for actual form submissions and data operations
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
      '/api/github/integrations'
    ];

    // Check for actual CRUD operations with specific endpoints
    const hasFormSubmission = crudPatterns.some(pattern => url.includes(pattern));

    // Also check if this is a real form submission (not just a dropdown change)
    const isFormSubmission = url.includes('/create') || 
                             url.includes('/update') || 
                             url.includes('/delete') || 
                             url.includes('/upload') ||
                             url.includes('/submit') ||
                             url.includes('/save');

    return hasFormSubmission || isFormSubmission;
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

    // Don't play sounds for development/console related requests
    if (url?.includes('vite') || url?.includes('hmr') || url?.includes('@vite') || url?.includes('node_modules')) {
      return false;
    }

    // Don't play sounds for connection timeout errors (status 0 usually means network timeout)
    if (status === 0 || status === 408 || status === 504) {
      return false;
    }

    return true;
  }
}

// Disable all global error monitoring to prevent console error sounds
window.addEventListener('error', (event) => {
  // Do not play sounds for any global errors
  event.stopPropagation();
}, true);

window.addEventListener('unhandledrejection', (event) => {
  // Do not play sounds for unhandled promise rejections
  event.stopPropagation();
}, true);

// Create global instance
const globalSoundHandler = new GlobalSoundHandler();

// Handle all clicks globally and play sound
document.addEventListener('click', (event) => {
  if (!globalSoundHandler.initialized || !globalSoundHandler.soundManager) {
    return;
  }

  // Skip if no user interaction detected
  if (!event.isTrusted) {
    return;
  }

  const target = event.target;
  
  // Handle all clicks but exclude certain elements
  if (target.closest('.no-sound') || 
      target.closest('[data-no-sound]') ||
      target.closest('audio') ||
      target.closest('video')) {
    return;
  }

  // Check for CRUD operations first (higher priority)
  if (target.closest('form') && 
      (target.tagName === 'BUTTON' && target.type === 'submit')) {
    console.log('🔊 Global handler: Form submit button clicked, playing CRUD sound');
    globalSoundHandler.playUserActionSound('crud');
    return;
  }

  // Check for CRUD buttons by text content
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    const button = target.tagName === 'BUTTON' ? target : target.closest('button');
    const text = button.textContent?.toLowerCase() || '';
    
    if (text.includes('create') || text.includes('save') || text.includes('update') || 
        text.includes('delete') || text.includes('submit') || text.includes('add') ||
        text.includes('edit') || text.includes('remove')) {
      console.log('🔊 Global handler: CRUD button clicked, playing CRUD sound');
      globalSoundHandler.playUserActionSound('crud');
      return;
    }
  }

  // Special handling for dropdown items - use click sound
  if (target.closest('[role="menuitem"]') || 
      target.closest('.select-item') ||
      target.closest('[data-radix-select-item]') ||
      target.closest('[role="option"]') ||
      target.closest('select') ||
      target.closest('.dropdown-menu')) {
    console.log('🔊 Global handler: Dropdown item clicked, playing click sound');
    globalSoundHandler.playUserActionSound('click');
    return;
  }

  // Default click sound for any clickable element
  if (target.tagName === 'BUTTON' || target.tagName === 'A' || 
      target.closest('button') || target.closest('a') ||
      target.getAttribute('role') === 'button' ||
      target.onclick || target.getAttribute('onClick') ||
      window.getComputedStyle(target).cursor === 'pointer') {
    console.log('🔊 Global handler: Clickable element clicked, playing click sound');
    globalSoundHandler.playUserActionSound('click');
  }
}, true);

// Disable global error listening to prevent console error sounds
// Only handle application-specific errors through custom events

// Export for use in other modules
export default globalSoundHandler;