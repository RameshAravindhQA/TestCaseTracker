import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSound } from '@/hooks/use-sound';

export function SoundTest() {
  const { playSound, getSoundSettings } = useSound();

  const testSounds = [
    { type: 'click' as const, label: 'Click Sound', description: 'General UI click' },
    { type: 'crud' as const, label: 'CRUD Sound', description: 'Create/Update/Delete operations' },
    { type: 'success' as const, label: 'Success Sound', description: 'Successful operations' },
    { type: 'error' as const, label: 'Error Sound', description: 'Error notifications' },
    { type: 'message' as const, label: 'Message Sound', description: 'New messages' }
  ];

  const settings = getSoundSettings();

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
        {testSounds.map((sound) => (
          <div key={sound.type} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">{sound.label}</h3>
              <p className="text-sm text-muted-foreground">{sound.description}</p>
            </div>
            <Button 
              onClick={() => playSound(sound.type)}
              variant="outline"
            >
              Play
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}