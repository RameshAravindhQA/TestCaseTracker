
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SoundEnhancedButton } from '@/components/ui/sound-enhanced-button';
import { useSoundPlayer } from '@/hooks/use-sound-provider';

export function SoundTest() {
  const { playClickSound, playCrudSound, playErrorSound, playSuccessSound, playMessageSound } = useSoundPlayer();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sound Test Panel</CardTitle>
        <CardDescription>Test different sound effects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SoundEnhancedButton 
          onClick={playClickSound}
          className="w-full"
          soundType="click"
        >
          Test Click Sound
        </SoundEnhancedButton>
        
        <SoundEnhancedButton 
          onClick={playCrudSound}
          className="w-full"
          soundType="crud"
        >
          Test CRUD Sound
        </SoundEnhancedButton>
        
        <SoundEnhancedButton 
          onClick={playErrorSound}
          className="w-full"
          variant="destructive"
        >
          Test Error Sound
        </SoundEnhancedButton>
        
        <SoundEnhancedButton 
          onClick={playSuccessSound}
          className="w-full"
          variant="default"
        >
          Test Success Sound
        </SoundEnhancedButton>
        
        <SoundEnhancedButton 
          onClick={playMessageSound}
          className="w-full"
          variant="secondary"
        >
          Test Message Sound
        </SoundEnhancedButton>
      </CardContent>
    </Card>
  );
}
