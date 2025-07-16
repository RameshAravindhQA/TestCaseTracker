
import { useCallback, useRef, useEffect } from 'react';

export type SoundType = 'navigation' | 'message' | 'create' | 'update' | 'delete' | 'click' | 'success' | 'error' | 'crud';

interface SoundConfig {
  volume?: number;
  enabled?: boolean;
}

class SoundManager {
  private audioCache = new Map<SoundType, HTMLAudioElement>();
  private config: SoundConfig = { volume: 0.5, enabled: true };

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    const soundTypes: SoundType[] = ['navigation', 'message', 'create', 'update', 'delete', 'click', 'success', 'error', 'crud'];

    soundTypes.forEach(type => {
      try {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.preload = 'auto';
        audio.volume = this.config.volume || 0.5;

        // Handle loading errors gracefully
        audio.addEventListener('error', () => {
          console.warn(`Failed to load sound: ${type}.mp3`);
        });

        audio.addEventListener('canplaythrough', () => {
          console.log(`Sound loaded successfully: ${type}.mp3`);
        });

        this.audioCache.set(type, audio);
      } catch (error) {
        console.warn(`Error creating audio element for ${type}:`, error);
      }
    });
  }

  setConfig(newConfig: Partial<SoundConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Update volume for all cached audio elements
    this.audioCache.forEach(audio => {
      audio.volume = this.config.volume || 0.5;
    });
  }

  async playSound(type: SoundType): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const audio = this.audioCache.get(type);
      if (!audio) {
        console.warn(`Sound not found: ${type}`);
        return;
      }

      // Reset audio to beginning
      audio.currentTime = 0;

      // Play with promise handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.warn(`Error playing sound ${type}:`, error);
    }
  }

  isEnabled(): boolean {
    return this.config.enabled || false;
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach(audio => {
      audio.volume = this.config.volume || 0.5;
    });
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Export global sound player for external use
export const globalSoundPlayer = soundManager;

export const useSound = () => {
  const playSound = useCallback(async (type: SoundType) => {
    await soundManager.playSound(type);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    soundManager.setEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume);
  }, []);

  const isEnabled = useCallback(() => {
    return soundManager.isEnabled();
  }, []);

  return {
    playSound,
    setEnabled,
    setVolume,
    isEnabled
  };
};

export default useSound;
