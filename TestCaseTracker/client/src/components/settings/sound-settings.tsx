import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useSoundContext } from '@/hooks/use-sound-provider';
import { SoundType } from '@/hooks/use-sound';

export const SoundSettings: React.FC = () => {
  const { isEnabled, volume, toggleSound, setVolume, playSound } = useSoundContext();

  const testSounds: { type: SoundType; label: string }[] = [
    { type: 'click', label: 'Click Sound' },
    { type: 'navigation', label: 'Navigation' },
    { type: 'success', label: 'Success' },
    { type: 'error', label: 'Error' },
    { type: 'create', label: 'Create Action' },
    { type: 'update', label: 'Update Action' },
    { type: 'delete', label: 'Delete Action' },
    { type: 'message', label: 'Message' },
  ];

  const handleTestSound = async (soundType: SoundType) => {
    try {
      await playSound(soundType);
    } catch (error) {
      console.warn('Error testing sound:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sound Settings
        </CardTitle>
        <CardDescription>
          Configure sound effects and audio feedback for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="sound-enabled">Enable Sound Effects</Label>
            <p className="text-sm text-muted-foreground">
              Turn on/off all sound effects in the application
            </p>
          </div>
          <Switch
            id="sound-enabled"
            checked={isEnabled}
            onCheckedChange={toggleSound}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider">Master Volume</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            id="volume-slider"
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            disabled={!isEnabled}
            className="w-full"
          />
        </div>

        {isEnabled && (
          <div className="space-y-3">
            <Label>Test Sound Effects</Label>
            <div className="grid grid-cols-2 gap-2">
              {testSounds.map(({ type, label }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestSound(type)}
                  className="justify-start gap-2"
                >
                  <Play className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Sound Effects Info</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Sounds are played for various UI interactions</p>
            <p>• Settings are automatically saved to browser storage</p>
            <p>• Compatible with modern browsers that support Web Audio API</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};