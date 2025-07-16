
import { useCallback } from 'react';

export type SoundType = 'click' | 'crud' | 'error' | 'success' | 'message';

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
    message: '/sounds/success.mp3'
  }
};

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

  const playSound = useCallback((type: SoundType) => {
    const settings = getSoundSettings();
    if (!settings.enabled) return;

    try {
      const audio = new Audio(settings.sounds[type]);
      audio.volume = settings.volume;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getSoundSettings]);

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

  return {
    playSound,
    getSoundSettings,
    setSoundSettings,
    uploadSound
  };
};
