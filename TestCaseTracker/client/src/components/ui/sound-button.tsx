
import React from 'react';
import { Button } from './button';

interface SoundButtonProps extends React.ComponentProps<typeof Button> {
  soundType?: 'click' | 'crud' | 'success' | 'error' | 'message';
  children: React.ReactNode;
}

export function SoundButton({ 
  soundType = 'click', 
  onClick, 
  children, 
  ...props 
}: SoundButtonProps) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound
    if (window.soundManager) {
      try {
        await window.soundManager.playSound(soundType);
      } catch (error) {
        console.warn('Failed to play sound:', error);
      }
    }

    // Call original onClick
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

// Export convenience components
export function ClickButton(props: Omit<SoundButtonProps, 'soundType'>) {
  return <SoundButton soundType="click" {...props} />;
}

export function CrudButton(props: Omit<SoundButtonProps, 'soundType'>) {
  return <SoundButton soundType="crud" {...props} />;
}

export function SuccessButton(props: Omit<SoundButtonProps, 'soundType'>) {
  return <SoundButton soundType="success" {...props} />;
}

export function ErrorButton(props: Omit<SoundButtonProps, 'soundType'>) {
  return <SoundButton soundType="error" {...props} />;
}
