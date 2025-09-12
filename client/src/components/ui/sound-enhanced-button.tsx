import React from 'react';
import { Button } from './button';
import { useSound } from '@/hooks/use-sound';

interface SoundEnhancedButtonProps extends React.ComponentProps<typeof Button> {
  soundType?: 'click' | 'crud' | 'error' | 'success' | 'message';
  children: React.ReactNode;
}

export function SoundEnhancedButton({ 
  soundType = 'click', 
  onClick, 
  children, 
  ...props 
}: SoundEnhancedButtonProps) {
  const { playSound } = useSound();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await playSound(soundType);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}