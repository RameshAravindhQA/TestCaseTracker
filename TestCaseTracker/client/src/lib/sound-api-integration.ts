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

// Create a sound manager instance for API integration
let soundManager: any = null;

const initSoundManager = () => {
  if (!soundManager) {
    try {
      // Create a simple sound manager for API calls
      soundManager = {
        playSound: async (type: SoundType) => {
          try {
            const audio = new Audio(`/sounds/${type}.mp3`);
            audio.volume = 0.5;
            await audio.play();
          } catch (error) {
            console.warn(`Error playing sound ${type}:`, error);
          }
        }
      };
    } catch (error) {
      console.warn('Error initializing sound manager:', error);
    }
  }
  return soundManager;
};

// Enhanced fetch function with sound feedback
export const soundFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const method = (options.method || 'GET').toUpperCase();
  const manager = initSoundManager();

  try {
    // Play appropriate sound based on method
    if (manager) {
      switch (method) {
        case 'POST':
          await manager.playSound('create');
          break;
        case 'PUT':
        case 'PATCH':
          await manager.playSound('update');
          break;
        case 'DELETE':
          await manager.playSound('delete');
          break;
        default:
          await manager.playSound('navigation');
      }
    }

    const response = await fetch(url, options);

    // Play success or error sound based on response
    if (manager) {
      if (response.ok) {
        await manager.playSound('success');
      } else {
        await manager.playSound('error');
      }
    }

    return response;
  } catch (error) {
    // Play error sound on fetch failure
    if (manager) {
      await manager.playSound('error');
    }
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