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
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Only play sound if user has interacted AND it's not a network error
      if (this.userHasInteracted && !this.isNetworkError(event.reason)) {
        console.log('🔊 Global handler: Playing error sound for unhandled rejection');
        this.playSound('error');
      } else {
        console.log('🔊 Skipping error sound - network/connection error detected');
      }
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      // Only play sound if user has interacted AND it's not a network/resource error
      if (this.userHasInteracted && !this.isResourceError(event) && !this.isNetworkError(event.message)) {
        console.log('🔊 Global handler: Playing error sound for general error');
        this.playSound('error');
      } else {
        console.log('🔊 Skipping error sound - resource/network error detected');
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

// Create global instance
const globalSoundHandler = new GlobalSoundHandler();

// Export for use in other modules
export default globalSoundHandler;