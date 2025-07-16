
import React from 'react';
import { Button, ButtonProps } from './button';
import { useSoundPlayer } from '@/hooks/use-sound-provider';

interface SoundEnhancedButtonProps extends ButtonProps {
  soundType?: 'click' | 'crud' | 'success';
  disableSound?: boolean;
}

export const SoundEnhancedButton = React.forwardRef<
  HTMLButtonElement,
  SoundEnhancedButtonProps
>(({ soundType = 'click', disableSound = false, onClick, ...props }, ref) => {
  const { playSound } = useSoundPlayer();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disableSound) {
      playSound(soundType);
    }
    onClick?.(event);
  };

  return <Button ref={ref} onClick={handleClick} {...props} />;
});

SoundEnhancedButton.displayName = 'SoundEnhancedButton';
