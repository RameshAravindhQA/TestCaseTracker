
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSound } from '../hooks/use-sound';

// Mock Audio API
const mockPlay = vi.fn();
const mockAudio = {
  play: mockPlay,
  addEventListener: vi.fn(),
  volume: 0.5,
  preload: 'auto',
  src: ''
};

// Mock Audio constructor
global.Audio = vi.fn(() => mockAudio) as any;

describe('Sound Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockPlay.mockResolvedValue(undefined);
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSound());
    const settings = result.current.getSoundSettings();
    
    expect(settings.enabled).toBe(true);
    expect(settings.volume).toBe(0.5);
    expect(settings.sounds.click).toBe('/sounds/click.mp3');
    expect(settings.sounds.error).toBe('/sounds/error.mp3');
    expect(settings.sounds.success).toBe('/sounds/success.mp3');
  });

  it('should play click sound when enabled', () => {
    const { result } = renderHook(() => useSound());
    
    act(() => {
      result.current.playSound('click');
    });
    
    expect(global.Audio).toHaveBeenCalled();
    expect(mockAudio.src).toBe('/sounds/click.mp3');
    expect(mockPlay).toHaveBeenCalled();
  });

  it('should not play sound when disabled', () => {
    const { result } = renderHook(() => useSound());
    
    act(() => {
      result.current.setSoundSettings({ enabled: false });
      result.current.playSound('click');
    });
    
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('should handle different sound types', () => {
    const { result } = renderHook(() => useSound());
    
    const soundTypes = ['click', 'error', 'success', 'create', 'update', 'delete'] as const;
    
    soundTypes.forEach(soundType => {
      act(() => {
        result.current.playSound(soundType);
      });
      
      expect(mockAudio.src).toBe(`/sounds/${soundType}.mp3`);
    });
  });

  it('should handle audio play errors gracefully', () => {
    const { result } = renderHook(() => useSound());
    mockPlay.mockRejectedValue(new Error('Audio play failed'));
    
    act(() => {
      result.current.playSound('click');
    });
    
    expect(mockPlay).toHaveBeenCalled();
    // Should not throw error
  });

  it('should respect volume settings', () => {
    const { result } = renderHook(() => useSound());
    
    act(() => {
      result.current.setSoundSettings({ volume: 0.8 });
      result.current.playSound('click');
    });
    
    expect(mockAudio.volume).toBe(0.8);
  });

  it('should store and retrieve settings from localStorage', () => {
    const { result } = renderHook(() => useSound());
    
    const customSettings = {
      enabled: false,
      volume: 0.3,
      sounds: {
        click: '/custom/click.mp3'
      }
    };
    
    act(() => {
      result.current.setSoundSettings(customSettings);
    });
    
    const settings = result.current.getSoundSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.volume).toBe(0.3);
    expect(settings.sounds.click).toBe('/custom/click.mp3');
  });
});
