
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SoundButton, ClickButton, CrudButton, SuccessButton, ErrorButton } from '@/components/ui/sound-button';

export function SoundDebug() {
  const testDirectSound = (type: string) => {
    if (window.soundManager) {
      window.soundManager.playSound(type);
    }
  };

  const checkSoundFiles = () => {
    const sounds = ['click', 'crud', 'success', 'error'];
    sounds.forEach(sound => {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.addEventListener('load', () => console.log(`${sound}.mp3 loaded`));
      audio.addEventListener('error', (e) => console.error(`${sound}.mp3 failed to load:`, e));
    });
  };

  React.useEffect(() => {
    checkSoundFiles();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sound Debug Panel</CardTitle>
        <CardDescription>Test sound effects and debug audio issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <ClickButton size="sm">Click Sound</ClickButton>
          <CrudButton size="sm">CRUD Sound</CrudButton>
          <SuccessButton size="sm">Success Sound</SuccessButton>
          <ErrorButton size="sm">Error Sound</ErrorButton>
        </div>
        
        <div className="border-t pt-3">
          <p className="text-sm text-muted-foreground mb-2">Direct Tests:</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              onClick={() => testDirectSound('click')}
            >
              Direct Click
            </button>
            <button 
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              onClick={() => testDirectSound('crud')}
            >
              Direct CRUD
            </button>
            <button 
              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
              onClick={() => testDirectSound('success')}
            >
              Direct Success
            </button>
            <button 
              className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              onClick={() => testDirectSound('error')}
            >
              Direct Error
            </button>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-sm text-muted-foreground">
            Manager Status: {window.soundManager ? 'Ready' : 'Not Loaded'}
          </p>
          <p className="text-sm text-muted-foreground">
            Sounds Loaded: {window.soundManager?.sounds?.size || 0}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
