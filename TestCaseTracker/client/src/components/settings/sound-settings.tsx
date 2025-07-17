
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Volume2, VolumeX, Upload, Download, RotateCcw, FileAudio, Trash2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cardVariants, buttonVariants } from '@/lib/animations';

export function SoundSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    volume: 0.5,
    theme: 'default',
    effects: {
      click: true,
      crud: true,
      success: true,
      error: true,
      message: true
    }
  });

  const [customSounds, setCustomSounds] = useState({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadType, setCurrentUploadType] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Load current settings
    if (window.soundManager) {
      if (typeof window.soundManager.getSettings === 'function') {
        const currentSettings = window.soundManager.getSettings();
        setSettings(currentSettings);
      } else {
        // Fallback to basic settings if getSettings doesn't exist
        setSettings({
          enabled: window.soundManager.isEnabled || true,
          volume: window.soundManager.volume || 0.5,
          theme: window.soundManager.currentTheme || 'default',
          effects: {
            click: true,
            crud: true,
            success: true,
            error: true,
            message: true
          }
        });
      }
    }

    // Load custom sounds from localStorage
    const savedCustomSounds = localStorage.getItem('customSounds');
    if (savedCustomSounds) {
      setCustomSounds(JSON.parse(savedCustomSounds));
    }
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    updateSoundManager(newSettings);
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0] / 100;
    const newSettings = { ...settings, volume };
    setSettings(newSettings);
    updateSoundManager(newSettings);
  };

  const handleEffectToggle = (effect: string, enabled: boolean) => {
    const newSettings = {
      ...settings,
      effects: { ...settings.effects, [effect]: enabled }
    };
    setSettings(newSettings);
    updateSoundManager(newSettings);
  };

  const updateSoundManager = (newSettings: typeof settings) => {
    if (window.soundManager) {
      if (typeof window.soundManager.updateSettings === 'function') {
        window.soundManager.updateSettings(newSettings);
      } else {
        window.soundManager.isEnabled = newSettings.enabled;
        window.soundManager.volume = newSettings.volume;
        if (typeof window.soundManager.setVolume === 'function') {
          window.soundManager.setVolume(newSettings.volume);
        }
        if (typeof window.soundManager.setEnabled === 'function') {
          window.soundManager.setEnabled(newSettings.enabled);
        }
      }
    }
  };

  const testSound = (type: string) => {
    if (window.soundManager && typeof window.soundManager.playSound === 'function') {
      window.soundManager.playSound(type);
      toast({
        title: "Sound Test",
        description: `Playing ${type} sound`,
        duration: 2000,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, soundType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an MP3, WAV, or OGG audio file",
        variant: "destructive",
      });
      return;
    }

    // Create URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Save to custom sounds
    const newCustomSounds = {
      ...customSounds,
      [soundType]: {
        name: file.name,
        url: fileURL,
        uploaded: new Date().toISOString()
      }
    };
    
    setCustomSounds(newCustomSounds);
    localStorage.setItem('customSounds', JSON.stringify(newCustomSounds));

    // Update sound manager if available
    if (window.soundManager && window.soundManager.soundMappings) {
      window.soundManager.soundMappings[soundType] = fileURL;
      // Preload the new sound
      if (typeof window.soundManager.loadSound === 'function') {
        window.soundManager.loadSound(soundType, fileURL);
      }
    }

    toast({
      title: "Sound Uploaded",
      description: `Custom ${soundType} sound uploaded successfully`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeCustomSound = (soundType: string) => {
    const newCustomSounds = { ...customSounds };
    
    // Revoke object URL to free memory
    if (newCustomSounds[soundType]?.url) {
      URL.revokeObjectURL(newCustomSounds[soundType].url);
    }
    
    delete newCustomSounds[soundType];
    setCustomSounds(newCustomSounds);
    localStorage.setItem('customSounds', JSON.stringify(newCustomSounds));

    // Reset to default sound in sound manager
    if (window.soundManager && window.soundManager.soundMappings) {
      const defaultSounds = {
        click: '/sounds/Mouse Click Sound.mp3',
        crud: '/sounds/CRUD Operation Sounds.mp3',
        success: '/sounds/happy-pop-2-185287.mp3',
        error: '/sounds/error-011-352286.mp3',
        message: '/sounds/message.mp3'
      };
      window.soundManager.soundMappings[soundType] = defaultSounds[soundType];
    }

    toast({
      title: "Custom Sound Removed",
      description: `${soundType} sound reset to default`,
    });
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      customSounds: Object.keys(customSounds).reduce((acc, key) => {
        acc[key] = {
          name: customSounds[key].name,
          uploaded: customSounds[key].uploaded
        };
        return acc;
      }, {})
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sound-settings.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Sound settings exported successfully",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.settings) {
          setSettings(importData.settings);
          updateSoundManager(importData.settings);
        }

        toast({
          title: "Settings Imported",
          description: "Sound settings imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let uploadedCount = 0;
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid audio file`,
          variant: "destructive",
        });
        return;
      }

      // Try to match filename to sound type
      const fileName = file.name.toLowerCase();
      let soundType = null;

      soundTypes.forEach(({ key, name }) => {
        if (fileName.includes(key) || fileName.includes(name.toLowerCase().replace(' ', '-'))) {
          soundType = key;
        }
      });

      if (!soundType) {
        // If no match found, use filename as custom sound type
        soundType = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '');
      }

      // Create URL for the file
      const fileURL = URL.createObjectURL(file);
      
      // Save to custom sounds
      const newCustomSounds = {
        ...customSounds,
        [soundType]: {
          name: file.name,
          url: fileURL,
          uploaded: new Date().toISOString()
        }
      };
      
      setCustomSounds(newCustomSounds);
      localStorage.setItem('customSounds', JSON.stringify(newCustomSounds));

      // Update sound manager
      if (window.soundManager && window.soundManager.soundMappings) {
        window.soundManager.soundMappings[soundType] = fileURL;
        if (typeof window.soundManager.loadSound === 'function') {
          window.soundManager.loadSound(soundType, fileURL);
        }
      }

      uploadedCount++;
    });

    if (uploadedCount > 0) {
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully uploaded ${uploadedCount} sound files`,
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      enabled: true,
      volume: 0.5,
      theme: 'default',
      effects: {
        click: true,
        crud: true,
        success: true,
        error: true,
        message: true,
        notification: true,
        warning: true,
        info: true
      }
    };

    setSettings(defaultSettings);
    updateSoundManager(defaultSettings);
    
    // Clear custom sounds
    Object.values(customSounds).forEach((sound: any) => {
      if (sound.url) {
        URL.revokeObjectURL(sound.url);
      }
    });
    setCustomSounds({});
    localStorage.removeItem('customSounds');

    toast({
      title: "Settings Reset",
      description: "All sound settings reset to defaults",
    });
  };

  const soundTypes = [
    { key: 'click', name: 'Click Sound', description: 'Button click feedback' },
    { key: 'crud', name: 'CRUD Sound', description: 'Data operations' },
    { key: 'success', name: 'Success Sound', description: 'Success notifications' },
    { key: 'error', name: 'Error Sound', description: 'Error notifications' },
    { key: 'message', name: 'Message Sound', description: 'Message notifications' },
    { key: 'notification', name: 'Notification Sound', description: 'General notifications' },
    { key: 'warning', name: 'Warning Sound', description: 'Warning alerts' },
    { key: 'info', name: 'Info Sound', description: 'Information alerts' }
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>Configure sound effects and volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Controls */}
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled">Enable Sound Effects</Label>
            <Switch
              id="sound-enabled"
              checked={settings.enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Volume</Label>
            <div className="flex items-center space-x-2">
              <VolumeX className="h-4 w-4" />
              <Slider
                value={[settings.volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4" />
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(settings.volume * 100)}%
            </div>
          </div>

          {/* Import/Export Controls */}
          <div className="flex gap-2 pt-4 border-t">
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button onClick={exportSettings} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Settings
              </Button>
            </motion.div>
            
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button 
                onClick={() => document.getElementById('import-settings')?.click()} 
                variant="outline" 
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </Button>
            </motion.div>

            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button 
                onClick={() => document.getElementById('bulk-upload')?.click()} 
                variant="outline" 
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload Sounds
              </Button>
            </motion.div>
            
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </motion.div>
          </div>

          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={importSettings}
            style={{ display: 'none' }}
          />
          
          <input
            id="bulk-upload"
            type="file"
            accept="audio/*"
            multiple
            onChange={handleBulkUpload}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Individual Sound Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Sound Controls</CardTitle>
          <CardDescription>Customize each sound effect</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {soundTypes.map((sound, index) => (
              <motion.div
                key={sound.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{sound.name}</h4>
                    {customSounds[sound.key] && (
                      <FileAudio className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{sound.description}</p>
                  {customSounds[sound.key] && (
                    <p className="text-xs text-blue-600 mt-1">
                      Custom: {customSounds[sound.key].name}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.effects[sound.key]}
                    onCheckedChange={(checked) => handleEffectToggle(sound.key, checked)}
                  />
                  
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={() => testSound(sound.key)}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={() => {
                        setCurrentUploadType(sound.key);
                        fileInputRef.current?.click();
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  {customSounds[sound.key] && (
                    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                      <Button
                        onClick={() => removeCustomSound(sound.key)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileUpload(e, currentUploadType)}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
