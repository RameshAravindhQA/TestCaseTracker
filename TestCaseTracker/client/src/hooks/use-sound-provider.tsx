
import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { useSound, SoundType, globalSoundPlayer } from './use-sound';

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
  const { playSound: playSoundHook } = useSound();

  const playSound = useCallback((type: SoundType) => {
    playSoundHook(type);
  }, [playSoundHook]);

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

  // Global click handler with improved detection
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if it's a clickable element
      const clickableElement = target.closest('button, a, [role="button"], .cursor-pointer, [data-clickable], input[type="submit"], input[type="button"]');
      
      if (clickableElement) {
        const elementText = clickableElement.textContent?.toLowerCase() || '';
        const classList = clickableElement.className.toLowerCase();
        const dataAction = clickableElement.getAttribute('data-action')?.toLowerCase() || '';

        // Determine sound based on element properties
        if (elementText.includes('delete') || classList.includes('destructive') || dataAction.includes('delete')) {
          globalSoundPlayer.playSound('delete');
        } else if (elementText.includes('save') || elementText.includes('create') || elementText.includes('add') || dataAction.includes('create')) {
          globalSoundPlayer.playSound('create');
        } else if (elementText.includes('update') || elementText.includes('edit') || dataAction.includes('update')) {
          globalSoundPlayer.playSound('update');
        } else if (elementText.includes('nav') || classList.includes('nav') || dataAction.includes('navigate')) {
          globalSoundPlayer.playSound('navigation');
        } else {
          globalSoundPlayer.playSound('click');
        }
      }
    };

    // Use capture phase to ensure we catch all clicks
    document.addEventListener('click', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // Listen for API responses and form submissions
  useEffect(() => {
    const handleApiResponse = (event: CustomEvent) => {
      if (event.detail?.type === 'success') {
        playSuccessSound();
      } else if (event.detail?.type === 'error') {
        playErrorSound();
      }
    };

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const action = form.getAttribute('data-action')?.toLowerCase() || '';
      
      if (action.includes('delete')) {
        globalSoundPlayer.playSound('delete');
      } else if (action.includes('create')) {
        globalSoundPlayer.playSound('create');
      } else if (action.includes('update')) {
        globalSoundPlayer.playSound('update');
      } else {
        globalSoundPlayer.playSound('click');
      }
    };

    // Listen for toast notifications
    const handleToast = (event: CustomEvent) => {
      const toastType = event.detail?.variant || event.detail?.type;
      if (toastType === 'destructive' || toastType === 'error') {
        playErrorSound();
      } else {
        playSuccessSound();
      }
    };

    window.addEventListener('api-response', handleApiResponse as EventListener);
    window.addEventListener('toast-notification', handleToast as EventListener);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      window.removeEventListener('api-response', handleApiResponse as EventListener);
      window.removeEventListener('toast-notification', handleToast as EventListener);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, [playErrorSound, playSuccessSound]);

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
