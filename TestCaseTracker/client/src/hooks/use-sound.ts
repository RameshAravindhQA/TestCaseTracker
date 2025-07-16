import { useCallback, useEffect } from 'react';

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

// Global sound instance to prevent multiple instances
let globalSoundInstance: any = null;

export const useSound = () => {
  const getSoundSettings = useCallback((): SoundSettings => {
    const stored = localStorage.getItem('soundSettings');
    return stored ? { ...defaultSoundSettings, ...JSON.parse(stored) } : defaultSoundSettings;
  }, []);

  const setSoundSettings = useCallback((settings: Partial<SoundSettings>) => {
    const current = getSoundSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('soundSettings', JSON.stringify(updated));
  }, [getSoundSettings]);

  const getSettings = useCallback((): SoundSettings => {
    const stored = localStorage.getItem('soundSettings');
    return stored ? { ...defaultSoundSettings, ...JSON.parse(stored) } : defaultSoundSettings;
  }, []);

  const playSound = useCallback((soundType: SoundType) => {
    try {
      const settings = getSettings();
      if (!settings.enabled) return;

      const soundUrl = settings.sounds[soundType];
      if (!soundUrl) return;

      // Create audio element with preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = settings.volume;
      
      // Set source after creating audio element
      audio.src = soundUrl;

      // Handle loading errors gracefully
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${soundUrl}`, e);
      });

      // Attempt to play with fallback
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play policy prevented playback
          if (error.name === 'NotAllowedError') {
            console.log('Audio play prevented by browser policy');
          } else {
            console.warn(`Failed to play sound: ${soundUrl}`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getSettings]);

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
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [getSoundSettings, setSoundSettings]);

  // Setup global click handler
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if it's a clickable element
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        playSound('click');
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [playSound]);

  return {
    playSound,
    getSoundSettings,
    setSoundSettings,
    uploadSound
  };
};