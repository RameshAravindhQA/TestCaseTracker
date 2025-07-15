import React from 'react';
import { useSound, SoundType } from '../hooks/useSound';
import { Button, ButtonProps } from './ui/button';

interface SoundButtonProps extends ButtonProps {
  soundType?: SoundType;
}

export const SoundButton: React.FC<SoundButtonProps> = ({
  soundType = 'click',
  onClick,
  children,
  ...props
}) => {
  const { playSound } = useSound();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    playSound(soundType);
    onClick?.(event);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};