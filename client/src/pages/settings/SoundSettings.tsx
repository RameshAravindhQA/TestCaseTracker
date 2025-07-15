import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Upload, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { useSounds } from '../../hooks/useSounds';

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

const SoundSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { playSound } = useSounds();
  const [settings, setSettings] = useState<SoundSettings>({
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
      navigation: '/sounds/CRUD.mp3'
    }
  });

  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Available sound categories
  const soundCategories = [
    { key: 'create', label: 'Create/Add Action', description: 'Played when creating new items' },
    { key: 'update', label: 'Update/Edit Action', description: 'Played when updating existing items' },
    { key: 'delete', label: 'Delete Action', description: 'Played when deleting items' },
    { key: 'success', label: 'Success Notification', description: 'Played on successful operations' },
    { key: 'error', label: 'Error Notification', description: 'Played when errors occur' },
    { key: 'notification', label: 'General Notification', description: 'General notification sound' },
    { key: 'click', label: 'Click/Tap Sound', description: 'Button click feedback' },
    { key: 'navigation', label: 'Navigation Sound', description: 'Page navigation feedback' }
  ];

  // Default sound options
  const defaultSounds = [
    { value: '/sounds/create.mp3', label: 'Create Sound' },
    { value: '/sounds/update.mp3', label: 'Update Sound' },
    { value: '/sounds/delete.mp3', label: 'Delete Sound' },
    { value: '/sounds/crud.mp3', label: 'CRUD Sound' },
    { value: '/sounds/happy-pop-2-185287.mp3', label: 'Happy Pop' },
    { value: '/sounds/error-011-352286.mp3', label: 'Error Sound' },
    { value: '/sounds/click-tap-computer-mouse-352734.mp3', label: 'Click Sound' }
  ];

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('soundSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: SoundSettings) => {
    setSettings(newSettings);
    localStorage.setItem('soundSettings', JSON.stringify(newSettings));
    toast({
      title: "Settings Saved",
      description: "Sound settings have been updated successfully.",
    });
  };

  // Toggle sound enabled/disabled
  const toggleSoundEnabled = (enabled: boolean) => {
    saveSettings({ ...settings, enabled });
  };

  // Update volume
  const updateVolume = (volume: number[]) => {
    saveSettings({ ...settings, volume: volume[0] });
  };

  // Update sound for category
  const updateSound = (category: string, soundPath: string) => {
    saveSettings({
      ...settings,
      sounds: { ...settings.sounds, [category]: soundPath }
    });
  };

  // Play sound preview
  const previewSound = async (soundPath: string, category: string) => {
    if (isPlaying === category) {
      setIsPlaying(null);
      return;
    }

    try {
      setIsPlaying(category);
      await playSound(soundPath, settings.volume / 100);
      setTimeout(() => setIsPlaying(null), 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play sound preview.",
        variant: "destructive"
      });
      setIsPlaying(null);
    }
  };

  // Upload custom sound
  const handleSoundUpload = async (category: string, file: File) => {
    setUploadingFor(category);
    try {
      const formData = new FormData();
      formData.append('sound', file);
      formData.append('category', category);

      const response = await fetch('/api/upload/sound', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { filePath } = await response.json();
      updateSound(category, filePath);

      toast({
        title: "Sound Uploaded",
        description: `Custom sound for ${category} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload sound file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFor(null);
    }
  };

  // Test all sounds
  const testAllSounds = async () => {
    for (const [category, soundPath] of Object.entries(settings.sounds)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await previewSound(soundPath, category);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
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
    saveSettings(defaultSettings);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sound Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testAllSounds}>
            Test All Sounds
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Global Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            Global Sound Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound-enabled">Enable Sound Effects</Label>
              <p className="text-sm text-gray-500">Turn on/off all sound effects globally</p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.enabled}
              onCheckedChange={toggleSoundEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Master Volume: {settings.volume}%</Label>
            <Slider
              value={[settings.volume]}
              onValueChange={updateVolume}
              max={100}
              min={0}
              step={5}
              className="w-full"
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sound Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {soundCategories.map((category) => (
            <div key={category.key} className="p-4 border rounded-lg space-y-4">
              <div>
                <h3 className="font-medium">{category.label}</h3>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Current Sound</Label>
                  <Select
                    value={settings.sounds[category.key as keyof typeof settings.sounds]}
                    onValueChange={(value) => updateSound(category.key, value)}
                    disabled={!settings.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultSounds.map((sound) => (
                        <SelectItem key={sound.value} value={sound.value}>
                          {sound.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewSound(settings.sounds[category.key as keyof typeof settings.sounds], category.key)}
                  disabled={!settings.enabled}
                >
                  {isPlaying === category.key ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".mp3,.wav,.ogg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSoundUpload(category.key, file);
                    }}
                    className="hidden"
                    id={`upload-${category.key}`}
                    disabled={!settings.enabled}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`upload-${category.key}`)?.click()}
                    disabled={!settings.enabled || uploadingFor === category.key}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingFor === category.key ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SoundSettingsPage;