
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useSound, SoundType } from './use-sound';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  playClickSound: () => void;
  playCrudSound: () => void;
  playErrorSound: () => void;
  playSuccessSound: () => void;
  playMessageSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { playSound: originalPlaySound, getSoundSettings } = useSound();

  const playSound = useCallback((type: SoundType) => {
    const settings = getSoundSettings();
    if (settings.enabled) {
      originalPlaySound(type);
    }
  }, [originalPlaySound, getSoundSettings]);

  // Convenience methods for specific sound types
  const playClickSound = useCallback(() => playSound('click'), [playSound]);
  const playCrudSound = useCallback(() => playSound('crud'), [playSound]);
  const playErrorSound = useCallback(() => playSound('error'), [playSound]);
  const playSuccessSound = useCallback(() => playSound('success'), [playSound]);
  const playMessageSound = useCallback(() => playSound('message'), [playSound]);

  // Global error handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      playErrorSound();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      playErrorSound();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [playErrorSound]);

  return (
    <SoundContext.Provider value={{
      playSound,
      playClickSound,
      playCrudSound,
      playErrorSound,
      playSuccessSound,
      playMessageSound
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundPlayer() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSoundPlayer must be used within a SoundProvider');
  }
  return context;
}
