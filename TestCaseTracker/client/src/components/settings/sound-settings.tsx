import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Volume2, VolumeX, Upload, Download, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SoundSettings() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const { toast } = useToast();

  useEffect(() => {
    if (window.soundManager) {
      const settings = window.soundManager.getSettings();
      setEnabled(settings.enabled);
      setVolume(settings.volume * 100);
    }
  }, []);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (window.soundManager) {
      window.soundManager.setEnabled(checked);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (window.soundManager) {
      window.soundManager.setVolume(newVolume / 100);
    }
  };

  const testSound = (type: string) => {
    if (window.soundManager) {
      window.soundManager.playSound(type);
    }
  };

  const handleSoundUpload = async (type: string, file: File) => {
    try {
      if (window.soundManager) {
        await window.soundManager.setCustomSound(type, file);
        toast({
          title: "Success",
          description: `${type} sound updated successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload sound file",
        variant: "destructive"
      });
    }
  };

  const exportSounds = () => {
    if (window.soundManager) {
      window.soundManager.exportSounds();
      toast({
        title: "Success",
        description: "Sound settings exported successfully"
      });
    }
  };

  const importSounds = (file: File) => {
    if (window.soundManager) {
      window.soundManager.importSounds(file)
        .then(() => {
          toast({
            title: "Success",
            description: "Sound settings imported successfully"
          });
          // Refresh settings display
          const settings = window.soundManager.getSettings();
          setEnabled(settings.enabled);
          setVolume(settings.volume * 100);
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to import sound settings",
            variant: "destructive"
          });
        });
    }
  };

  const resetToDefaults = () => {
    if (window.soundManager) {
      window.soundManager.resetToDefaults();
      setEnabled(true);
      setVolume(50);
      toast({
        title: "Success",
        description: "Sound settings reset to defaults"
      });
    }
  };

  const soundTypes = [
    { key: 'click', name: 'Click Sound', description: 'Button click feedback' },
    { key: 'crud', name: 'CRUD Sound', description: 'Data operations' },
    { key: 'success', name: 'Success Sound', description: 'Success notifications' },
    { key: 'error', name: 'Error Sound', description: 'Error notifications' },
    { key: 'message', name: 'Message Sound', description: 'Message notifications' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sound Settings</CardTitle>
        <CardDescription>Configure sound effects and volume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled">Enable Sound Effects</Label>
          <Switch
            id="sound-enabled"
            checked={enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Volume</Label>
          <div className="flex items-center space-x-2">
            <VolumeX className="h-4 w-4" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Custom Sound Files</Label>
          <div className="text-sm text-muted-foreground">
            Upload custom sound files (MP3, WAV, OGG supported)
          </div>

          {soundTypes.map((soundType) => (
            <div key={soundType.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{soundType.name}</div>
                <div className="text-sm text-muted-foreground">{soundType.description}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testSound(soundType.key)}
                >
                  Test
                </Button>
                <Input
                  type="file"
                  accept=".mp3,.wav,.ogg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSoundUpload(soundType.key, file);
                    }
                  }}
                  className="w-24"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button onClick={exportSounds} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importSounds(file);
              }
            }}
            className="hidden"
            id="import-sounds"
          />
          <Button
            onClick={() => document.getElementById('import-sounds')?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Settings
          </Button>
        </div>

        <Button onClick={resetToDefaults} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}