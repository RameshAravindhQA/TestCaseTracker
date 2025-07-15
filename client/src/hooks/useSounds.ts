
import { useEffect, useState } from 'react';

interface SoundEffect {
  id: string;
  name: string;
  file: string;
  volume: number;
  enabled: boolean;
  description: string;
}

interface SoundSettings {
  masterVolume: number;
  soundsEnabled: boolean;
  soundEffects: SoundEffect[];
}

export function useSounds() {
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    masterVolume: 80,
    soundsEnabled: true,
    soundEffects: [],
  });

  useEffect(() => {
    loadSoundSettings();
    
    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      setSoundSettings(event.detail);
    };

    window.addEventListener('soundSettingsChanged', handleSettingsChange as any);
    
    return () => {
      window.removeEventListener('soundSettingsChanged', handleSettingsChange as any);
    };
  }, []);

  const loadSoundSettings = () => {
    const savedSettings = localStorage.getItem('soundSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSoundSettings(settings);
      } catch (error) {
        console.error('Error loading sound settings:', error);
      }
    }
  };

  const playSound = (soundId: string) => {
    if (!soundSettings.soundsEnabled) return;

    const sound = soundSettings.soundEffects.find(s => s.id === soundId);
    if (sound && sound.enabled) {
      try {
        const audio = new Audio(sound.file);
        audio.volume = (sound.volume / 100) * (soundSettings.masterVolume / 100);
        audio.play().catch(console.error);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  return {
    playSound,
    soundSettings,
  };
}
