
import React from 'react';
import { Button, ButtonProps } from './button';
import { useSoundContext } from '@/hooks/use-sound-provider';
import { SoundType } from '@/hooks/use-sound';

interface SoundEnhancedButtonProps extends ButtonProps {
  soundType?: SoundType;
  enableSound?: boolean;
}

export const SoundEnhancedButton: React.FC<SoundEnhancedButtonProps> = ({
  onClick,
  soundType = 'click',
  enableSound = true,
  children,
  ...props
}) => {
  const { playSound } = useSoundContext();

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound effect
    if (enableSound) {
      try {
        await playSound(soundType);
      } catch (error) {
        console.warn('Error playing button sound:', error);
      }
    }

    // Call original onClick handler
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

export default SoundEnhancedButton;
