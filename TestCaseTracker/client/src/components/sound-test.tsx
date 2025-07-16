import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SoundButton, ClickButton, CrudButton, SuccessButton, ErrorButton } from '@/components/ui/sound-button';

export function SoundTest() {
  const [settings, setSettings] = React.useState({ enabled: true, volume: 0.5 });

  React.useEffect(() => {
    if (window.soundManager) {
      setSettings(window.soundManager.getSettings());
    }
  }, []);

  const testSounds = [
    { type: 'click' as const, label: 'Click Sound', description: 'General UI click' },
    { type: 'crud' as const, label: 'CRUD Sound', description: 'Create/Update/Delete operations' },
    { type: 'success' as const, label: 'Success Sound', description: 'Successful operations' },
    { type: 'error' as const, label: 'Error Sound', description: 'Error notifications' },
    { type: 'message' as const, label: 'Message Sound', description: 'New messages' }
  ];

  const playSound = (type: string) => {
    if (window.soundManager) {
      window.soundManager.playSound(type);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Sound Effects Test</CardTitle>
        <CardDescription>
          Test all available sound effects. Sounds enabled: {settings.enabled ? 'Yes' : 'No'}, 
          Volume: {Math.round(settings.volume * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <ClickButton size="sm">Click Sound</ClickButton>
          <CrudButton size="sm">CRUD Sound</CrudButton>
          <SuccessButton size="sm">Success Sound</SuccessButton>
          <ErrorButton size="sm">Error Sound</ErrorButton>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Direct Sound Tests</h3>
          {testSounds.map((sound) => (
            <div key={sound.type} className="flex items-center justify-between p-4 border rounded-lg mb-2">
              <div>
                <h4 className="font-medium">{sound.label}</h4>
                <p className="text-sm text-muted-foreground">{sound.description}</p>
              </div>
              <Button 
                onClick={() => playSound(sound.type)}
                variant="outline"
                size="sm"
              >
                Play
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}