import { Button } from './button';
import { Slider } from './slider';
import { Volume2, VolumeX } from 'lucide-react';
import { 
  toggleSound, 
  isSoundEnabled, 
  setSoundVolume, 
  getSoundVolume,
  playSoundEffect 
} from '@/utils/sound-effects';
import React from 'react';

export function SoundControls() {
  const [enabled, setEnabled] = React.useState(isSoundEnabled());
  const [volume, setVolume] = React.useState(getSoundVolume());

  const handleToggle = () => {
    const newState = toggleSound();
    setEnabled(newState);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] * 100; // Convert to 0-100 range
    setVolume(newVolume);
    setSoundVolume(newVolume);
  };

  const handleTest = () => {
    playSoundEffect('click');
  };

  return (
    <div className="flex items-center space-x-2 p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        title={enabled ? 'Disable Sound' : 'Enable Sound'}
      >
        {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>

      {enabled && (
        <>
          <div className="w-20">
            <Slider
              value={[volume / 100]} // Convert to 0-1 range for slider
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            title="Test Sound"
          >
            Test
          </Button>
        </>
      )}
    </div>
  );
}