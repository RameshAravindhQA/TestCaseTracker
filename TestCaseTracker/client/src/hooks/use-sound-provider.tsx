import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSound, SoundType } from './use-sound';

interface SoundContextType {
  isEnabled: boolean;
  volume: number;
  playSound: (type: SoundType) => Promise<void>;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  playCrudSound: () => Promise<void>;
  playErrorSound: () => Promise<void>;
  playSuccessSound: () => Promise<void>;
  playMessageSound: () => Promise<void>;
  playNavigationSound: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.5);
  const { playSound: playSoundHook, setEnabled, setVolume: setSoundVolume } = useSound();

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem('sound-enabled');
      const savedVolume = localStorage.getItem('sound-volume');

      if (savedEnabled !== null) {
        const enabled = savedEnabled === 'true';
        setIsEnabled(enabled);
        setEnabled(enabled);
      }

      if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) {
          setVolumeState(vol);
          setSoundVolume(vol);
        }
      }
    } catch (error) {
      console.warn('Error loading sound settings:', error);
    }
  }, [setEnabled, setSoundVolume]);

  const playSound = async (type: SoundType) => {
    if (isEnabled) {
      try {
        await playSoundHook(type);
      } catch (error) {
        console.warn('Error playing sound:', error);
      }
    }
  };

  const toggleSound = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    setEnabled(newEnabled);

    try {
      localStorage.setItem('sound-enabled', newEnabled.toString());
    } catch (error) {
      console.warn('Error saving sound enabled state:', error);
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    setSoundVolume(clampedVolume);

    try {
      localStorage.setItem('sound-volume', clampedVolume.toString());
    } catch (error) {
      console.warn('Error saving sound volume:', error);
    }
  };

  // Enhanced sound methods
  const playCrudSound = async () => {
    await playSound('crud');
  };

  const playErrorSound = async () => {
    await playSound('error');
  };

  const playSuccessSound = async () => {
    await playSound('success');
  };

  const playMessageSound = async () => {
    await playSound('message');
  };

  const playNavigationSound = async () => {
    await playSound('navigation');
  };

  const contextValue: SoundContextType = {
    isEnabled,
    volume,
    playSound,
    toggleSound,
    setVolume,
    playCrudSound,
    playErrorSound,
    playSuccessSound,
    playMessageSound,
    playNavigationSound
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
};

export default SoundProvider;