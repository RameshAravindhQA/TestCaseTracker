
import { useCallback, useEffect, useRef } from 'react';

export type SoundType = 'click' | 'crud' | 'error' | 'success' | 'message' | 'navigation' | 'delete' | 'update' | 'create';

interface SoundSettings {
  enabled: boolean;
  volume: number;
  sounds: {
    [key in SoundType]: string;
  };
}

const defaultSoundSettings: SoundSettings = {
  enabled: true,
  volume: 0.5,
  sounds: {
    click: '/sounds/click.mp3',
    crud: '/sounds/crud.mp3',
    error: '/sounds/error.mp3',
    success: '/sounds/success.mp3',
    message: '/sounds/message.mp3',
    navigation: '/sounds/navigation.mp3',
    delete: '/sounds/delete.mp3',
    update: '/sounds/update.mp3',
    create: '/sounds/create.mp3'
  }
};

// Global audio cache to prevent loading same sound multiple times
const audioCache = new Map<string, HTMLAudioElement>();

// Preload audio files
const preloadAudio = (soundUrl: string): HTMLAudioElement => {
  if (audioCache.has(soundUrl)) {
    return audioCache.get(soundUrl)!;
  }

  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = 0.5;
  
  // Handle loading with fallback
  audio.addEventListener('canplaythrough', () => {
    console.log(`Sound preloaded: ${soundUrl}`);
  });
  
  audio.addEventListener('error', (e) => {
    console.warn(`Failed to preload sound: ${soundUrl}`, e);
  });
  
  audio.src = soundUrl;
  audioCache.set(soundUrl, audio);
  
  return audio;
};

export const useSound = () => {
  const soundSettingsRef = useRef<SoundSettings>(defaultSoundSettings);

  const getSoundSettings = useCallback((): SoundSettings => {
    try {
      const stored = localStorage.getItem('soundSettings');
      const settings = stored ? { ...defaultSoundSettings, ...JSON.parse(stored) } : defaultSoundSettings;
      soundSettingsRef.current = settings;
      return settings;
    } catch (error) {
      console.error('Error getting sound settings:', error);
      return defaultSoundSettings;
    }
  }, []);

  const setSoundSettings = useCallback((settings: Partial<SoundSettings>) => {
    try {
      const current = getSoundSettings();
      const updated = { ...current, ...settings };
      soundSettingsRef.current = updated;
      localStorage.setItem('soundSettings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error setting sound settings:', error);
    }
  }, [getSoundSettings]);

  const playSound = useCallback((soundType: SoundType) => {
    try {
      const settings = soundSettingsRef.current;
      if (!settings.enabled) return;

      const soundUrl = settings.sounds[soundType];
      if (!soundUrl) return;

      // Get or create audio element
      let audio = audioCache.get(soundUrl);
      if (!audio) {
        audio = preloadAudio(soundUrl);
      }

      // Clone audio for overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = settings.volume;

      // Play with promise handling
      const playPromise = audioClone.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'NotAllowedError') {
            console.warn(`Failed to play sound: ${soundUrl}`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  const uploadSound = useCallback((type: SoundType, file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const settings = getSoundSettings();
        setSoundSettings({
          sounds: {
            ...settings.sounds,
            [type]: dataUrl
          }
        });
        // Clear cache for this sound type
        const oldUrl = settings.sounds[type];
        if (audioCache.has(oldUrl)) {
          audioCache.delete(oldUrl);
        }
        // Preload new sound
        preloadAudio(dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [getSoundSettings, setSoundSettings]);

  // Initialize sound settings on mount
  useEffect(() => {
    getSoundSettings();
    
    // Preload all default sounds
    Object.values(defaultSoundSettings.sounds).forEach(soundUrl => {
      preloadAudio(soundUrl);
    });
  }, [getSoundSettings]);

  return {
    playSound,
    getSoundSettings,
    setSoundSettings,
    uploadSound
  };
};

// Global sound instance for direct use
export const globalSoundPlayer = {
  playSound: (soundType: SoundType) => {
    try {
      const stored = localStorage.getItem('soundSettings');
      const settings = stored ? { ...defaultSoundSettings, ...JSON.parse(stored) } : defaultSoundSettings;
      
      if (!settings.enabled) return;

      const soundUrl = settings.sounds[soundType];
      if (!soundUrl) return;

      let audio = audioCache.get(soundUrl);
      if (!audio) {
        audio = preloadAudio(soundUrl);
      }

      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = settings.volume;
      audioClone.play().catch(() => {});
    } catch (error) {
      console.error('Error playing global sound:', error);
    }
  }
};
