
import { SoundType, globalSoundPlayer } from '@/hooks/use-sound';

interface ApiSoundConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  soundType: SoundType;
}

const apiSoundMap: Record<string, ApiSoundConfig> = {
  'POST': { method: 'POST', soundType: 'create' },
  'PUT': { method: 'PUT', soundType: 'update' },
  'PATCH': { method: 'PATCH', soundType: 'update' },
  'DELETE': { method: 'DELETE', soundType: 'delete' },
  'GET': { method: 'GET', soundType: 'navigation' },
};

export const playApiSound = (method: string, success: boolean = true) => {
  try {
    if (!success) {
      globalSoundPlayer.playSound('error');
      return;
    }

    const config = apiSoundMap[method.toUpperCase()];
    const soundType = config ? config.soundType : 'success';
    globalSoundPlayer.playSound(soundType);

    // Dispatch event for other listeners
    window.dispatchEvent(new CustomEvent('api-response', {
      detail: { method, success, type: success ? 'success' : 'error' }
    }));
  } catch (error) {
    console.error('Error playing API sound:', error);
  }
};

// Enhanced fetch wrapper with sound integration
export const soundFetch = async (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  
  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      playApiSound(method, true);
    } else {
      playApiSound(method, false);
    }
    
    return response;
  } catch (error) {
    playApiSound(method, false);
    throw error;
  }
};

// Global fetch interceptor
export const setupGlobalFetchInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options = {}] = args;
    const method = options.method || 'GET';
    
    try {
      const response = await originalFetch(url, options);
      
      // Only play sounds for API calls
      if (typeof url === 'string' && url.includes('/api/')) {
        if (response.ok) {
          playApiSound(method, true);
        } else {
          playApiSound(method, false);
        }
      }
      
      return response;
    } catch (error) {
      if (typeof url === 'string' && url.includes('/api/')) {
        playApiSound(method, false);
      }
      throw error;
    }
  };
};
