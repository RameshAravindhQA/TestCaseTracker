
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useSound, SoundType } from './use-sound';
import { useToast } from './use-toast';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  playCrudSound: (operation: 'create' | 'update' | 'delete') => void;
  playErrorSound: () => void;
  playSuccessSound: () => void;
  playMessageSound: () => void;
  playNavigationSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const { playSound } = useSound();
  const { toast } = useToast();

  const playCrudSound = useCallback((operation: 'create' | 'update' | 'delete') => {
    switch (operation) {
      case 'create':
        playSound('create');
        break;
      case 'update':
        playSound('update');
        break;
      case 'delete':
        playSound('delete');
        break;
      default:
        playSound('crud');
    }
  }, [playSound]);

  const playErrorSound = useCallback(() => {
    playSound('error');
  }, [playSound]);

  const playSuccessSound = useCallback(() => {
    playSound('success');
  }, [playSound]);

  const playMessageSound = useCallback(() => {
    playSound('message');
  }, [playSound]);

  const playNavigationSound = useCallback(() => {
    playSound('navigation');
  }, [playSound]);

  // Setup global error and success handlers
  React.useEffect(() => {
    const originalToast = toast;
    
    // Override toast to play sounds
    const enhancedToast = (options: any) => {
      if (options.variant === 'destructive') {
        playErrorSound();
      } else {
        playSuccessSound();
      }
      return originalToast(options);
    };

    // Listen for API responses
    const handleApiResponse = (event: any) => {
      if (event.detail?.type === 'success') {
        playSuccessSound();
      } else if (event.detail?.type === 'error') {
        playErrorSound();
      }
    };

    window.addEventListener('api-response', handleApiResponse);
    
    return () => {
      window.removeEventListener('api-response', handleApiResponse);
    };
  }, [playErrorSound, playSuccessSound, toast]);

  const value: SoundContextType = {
    playSound,
    playCrudSound,
    playErrorSound,
    playSuccessSound,
    playMessageSound,
    playNavigationSound
  };

  return (
    <SoundContext.Provider value={value}>
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
