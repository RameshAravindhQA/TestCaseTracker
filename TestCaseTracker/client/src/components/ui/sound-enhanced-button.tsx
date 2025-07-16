
import React from 'react';
import { Button, ButtonProps } from './button';
import { useSoundContext } from '@/hooks/use-sound-provider';

interface SoundEnhancedButtonProps extends ButtonProps {
  soundType?: 'click' | 'create' | 'update' | 'delete' | 'navigation';
  crudOperation?: 'create' | 'update' | 'delete';
}

export const SoundEnhancedButton: React.FC<SoundEnhancedButtonProps> = ({
  soundType = 'click',
  crudOperation,
  onClick,
  children,
  ...props
}) => {
  const { playSound, playCrudSound } = useSoundContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (crudOperation) {
      playCrudSound(crudOperation);
    } else {
      playSound(soundType);
    }
    
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
