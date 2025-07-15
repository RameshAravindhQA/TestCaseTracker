const SOUND_CACHE = new Map<string, HTMLAudioElement>();

interface SoundSettings {
  enabled: boolean;
  volume: number;
  sounds: {
    create: string;
    update: string;
    delete: string;
    success: string;
    error: string;
    notification: string;
    click: string;
    navigation: string;
  };
}

export const getSettings = (): SoundSettings => {
  const defaultSettings: SoundSettings = {
    enabled: true,
    volume: 50,
    sounds: {
      create: '/sounds/create.mp3',
      update: '/sounds/update.mp3',
      delete: '/sounds/delete.mp3',
      success: '/sounds/happy-pop-2-185287.mp3',
      error: '/sounds/error-011-352286.mp3',
      notification: '/sounds/click-tap-computer-mouse-352734.mp3',
      click: '/sounds/click-tap-computer-mouse-352734.mp3',
      navigation: '/sounds/crud.mp3'
    }
  };

  try {
    const saved = localStorage.getItem('soundSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const playSound = async (soundPath: string, volume?: number): Promise<void> => {
  const settings = getSettings();

  if (!settings.enabled) return;

  try {
    let audio = SOUND_CACHE.get(soundPath);

    if (!audio) {
      audio = new Audio(soundPath);
      audio.preload = 'auto';
      SOUND_CACHE.set(soundPath, audio);
    }

    audio.volume = (volume ?? settings.volume) / 100;
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise) {
      await playPromise;
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

export const playSoundEffect = (effectType: keyof SoundSettings['sounds']): void => {
  const settings = getSettings();
  const soundPath = settings.sounds[effectType];

  if (soundPath) {
    playSound(soundPath, settings.volume);
  }
};

// Preload commonly used sounds
export const preloadSounds = (): void => {
  const settings = getSettings();
  Object.values(settings.sounds).forEach(soundPath => {
    if (soundPath && !SOUND_CACHE.has(soundPath)) {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      SOUND_CACHE.set(soundPath, audio);
    }
  });
};

export const saveSettings = (settings: SoundSettings): void => {
  try {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save sound settings:', error);
  }
};

export const toggleSound = (): boolean => {
  const settings = getSettings();
  const newSettings = { ...settings, enabled: !settings.enabled };
  saveSettings(newSettings);
  return newSettings.enabled;
};

export const isSoundEnabled = (): boolean => {
  const settings = getSettings();
  return settings.enabled;
};

export const setSoundVolume = (volume: number): void => {
  const settings = getSettings();
  const newSettings = { ...settings, volume: Math.max(0, Math.min(100, volume)) };
  saveSettings(newSettings);
};

export const getSoundVolume = (): number => {
  const settings = getSettings();
  return settings.volume;
};