
import { SoundType } from '@/hooks/use-sound';

interface SoundApiIntegration {
  playSound: (type: SoundType) => void;
}

let soundIntegration: SoundApiIntegration | null = null;

export function initializeSoundIntegration(integration: SoundApiIntegration) {
  soundIntegration = integration;
}

export function playSoundForApiResponse(success: boolean, operation: 'create' | 'update' | 'delete' | 'read' = 'read') {
  if (!soundIntegration) return;

  if (success) {
    if (operation === 'create' || operation === 'update' || operation === 'delete') {
      soundIntegration.playSound('crud');
    } else {
      soundIntegration.playSound('success');
    }
  } else {
    soundIntegration.playSound('error');
  }
}

export function playErrorSound() {
  if (!soundIntegration) return;
  soundIntegration.playSound('error');
}

export function playSuccessSound() {
  if (!soundIntegration) return;
  soundIntegration.playSound('success');
}

export function playCrudSound() {
  if (!soundIntegration) return;
  soundIntegration.playSound('crud');
}

export function playClickSound() {
  if (!soundIntegration) return;
  soundIntegration.playSound('click');
}
