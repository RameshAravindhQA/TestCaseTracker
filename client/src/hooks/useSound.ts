import { useCallback, useEffect, useState } from 'react';
import { 
  playSound as playSoundEffect, 
  isSoundEnabled, 
  toggleSound, 
  getMasterVolume, 
  setMasterVolume,
  updateSoundPath,
  getAllSounds,
  SOUND_EFFECTS
} from '../utils/sound-effects';

export type SoundType = 'click' | 'success' | 'error' | 'warning' | 'crud' | 'message' | 'notification' | 'login' | 'logout' | 'info' | 'hover' | 'create' | 'update' | 'delete';

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  sounds: Record<SoundType, string>;
}

class SoundManager {
  private settings: SoundSettings;

  constructor() {
    this.settings = {
      enabled: isSoundEnabled(),
      volume: getMasterVolume(),
      sounds: getAllSounds() as Record<SoundType, string>
    };
  }

  playSound(type: SoundType, volume?: number) {
    if (!this.settings.enabled) return;
    playSoundEffect(type, volume);
  }

  updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };

    if (newSettings.enabled !== undefined) {
      toggleSound();
    }

    if (newSettings.volume !== undefined) {
      setMasterVolume(newSettings.volume);
    }
  }

  updateSoundPath(type: SoundType, path: string) {
    this.settings.sounds[type] = path;
    updateSoundPath(type, path);
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }
}

export const useSound = () => {
  const [soundManager] = useState(() => new SoundManager());
  const [settings, setSettings] = useState<SoundSettings>(soundManager.getSettings());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentSettings = soundManager.getSettings();
      setSettings(currentSettings);
    }, 1000);

    return () => clearInterval(interval);
  }, [soundManager]);

  const playSound = useCallback((type: SoundType, volume?: number) => {
    soundManager.playSound(type, volume);
  }, [soundManager]);

  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    soundManager.updateSettings(newSettings);
    setSettings(soundManager.getSettings());
  }, [soundManager]);

  const updateSoundPath = useCallback((type: SoundType, path: string) => {
    soundManager.updateSoundPath(type, path);
    setSettings(soundManager.getSettings());
  }, [soundManager]);

  return {
    playSound,
    settings,
    updateSettings,
    updateSoundPath
  };
};

// React component wrapper for sound effects
export const SoundButton: React.FC<{
  soundType?: SoundType;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ 
  soundType = 'click', 
  onClick, 
  children, 
  className = '',
  disabled = false 
}) => {
  const { playSound } = useSound();

  const handleClick = useCallback(() => {
    if (!disabled) {
      playSound(soundType);
      onClick?.();
    }
  }, [soundType, onClick, disabled, playSound]);

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};