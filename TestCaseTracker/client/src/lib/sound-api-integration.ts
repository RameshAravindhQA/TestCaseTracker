
import { SoundType } from '@/hooks/use-sound';

interface ApiSoundConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  soundType: SoundType;
}

const apiSoundMap: Record<string, ApiSoundConfig> = {
  'POST': { method: 'POST', soundType: 'create' },
  'PUT': { method: 'PUT', soundType: 'update' },
  'PATCH': { method: 'PATCH', soundType: 'update' },
  'DELETE': { method: 'DELETE', soundType: 'delete' },
};

export const playApiSound = (method: string, success: boolean = true) => {
  try {
    const soundSettings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
    if (soundSettings.enabled === false) return;

    let soundType: SoundType;
    
    if (!success) {
      soundType = 'error';
    } else {
      const config = apiSoundMap[method.toUpperCase()];
      soundType = config ? config.soundType : 'success';
    }

    const audio = new Audio(soundSettings.sounds?.[soundType] || `/sounds/${soundType}.mp3`);
    audio.volume = soundSettings.volume || 0.5;
    audio.play().catch(console.error);
  } catch (error) {
    console.error('Error playing API sound:', error);
  }
};

// Axios interceptor setup
export const setupApiSoundInterceptors = (axiosInstance: any) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: any) => {
      config.metadata = { startTime: new Date() };
      return config;
    },
    (error: any) => {
      playApiSound('ERROR', false);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: any) => {
      const method = response.config.method?.toUpperCase();
      playApiSound(method, true);
      return response;
    },
    (error: any) => {
      const method = error.config?.method?.toUpperCase();
      playApiSound(method, false);
      return Promise.reject(error);
    }
  );
};

// Fetch wrapper with sound integration
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
