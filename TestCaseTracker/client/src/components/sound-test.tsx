
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSoundContext } from '@/hooks/use-sound-provider';
import { SoundType } from '@/hooks/use-sound';

export const SoundTest: React.FC = () => {
  const { playSound, isEnabled, toggleSound } = useSoundContext();

  const testSounds: { type: SoundType; label: string }[] = [
    { type: 'click', label: 'Click' },
    { type: 'navigation', label: 'Navigation' },
    { type: 'success', label: 'Success' },
    { type: 'error', label: 'Error' },
    { type: 'create', label: 'Create' },
    { type: 'update', label: 'Update' },
    { type: 'delete', label: 'Delete' },
    { type: 'message', label: 'Message' },
    { type: 'crud', label: 'CRUD' },
  ];

  const handleTestSound = async (soundType: SoundType) => {
    try {
      await playSound(soundType);
      console.log(`Played sound: ${soundType}`);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Sound Test Panel</h3>
      
      <div className="mb-4">
        <Button onClick={toggleSound} variant={isEnabled ? "default" : "outline"}>
          Sound {isEnabled ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {testSounds.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleTestSound(type)}
            disabled={!isEnabled}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
