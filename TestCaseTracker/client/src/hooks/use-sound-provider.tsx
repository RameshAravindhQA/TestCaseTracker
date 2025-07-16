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

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element or its parent is clickable
      const clickableElement = target.closest('button, a, [role="button"], .cursor-pointer');
      
      if (clickableElement) {
        // Check for specific button types
        const elementText = clickableElement.textContent?.toLowerCase() || '';
        const classList = clickableElement.className.toLowerCase();

        if (elementText.includes('delete') || classList.includes('destructive')) {
          playSound('delete');
        } else if (elementText.includes('save') || elementText.includes('create') || elementText.includes('add')) {
          playSound('create');
        } else if (elementText.includes('update') || elementText.includes('edit')) {
          playSound('update');
        } else {
          playSound('click');
        }
      }
    };

    // Use capture phase to ensure we catch all clicks
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [playSound]);

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