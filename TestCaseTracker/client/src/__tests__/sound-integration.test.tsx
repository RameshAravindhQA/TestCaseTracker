
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SoundProvider, useSoundContext } from '../hooks/use-sound-provider';
import { useSound } from '../hooks/use-sound';
import SoundEnhancedButton from '../components/ui/sound-enhanced-button';
import React from 'react';

// Mock HTML Audio API
class MockAudio {
  src = '';
  volume = 0.5;
  currentTime = 0;
  preload = 'auto';
  
  constructor(src?: string) {
    if (src) this.src = src;
  }

  play = vi.fn().mockResolvedValue(undefined);
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// Mock global Audio
(global as any).Audio = MockAudio;

// Test component that uses sound context
const TestSoundComponent: React.FC = () => {
  const { isEnabled, volume, playSound, toggleSound, setVolume } = useSoundContext();

  return (
    <div>
      <div data-testid="sound-status">{isEnabled ? 'enabled' : 'disabled'}</div>
      <div data-testid="volume-level">{volume}</div>
      <button 
        data-testid="toggle-sound" 
        onClick={toggleSound}
      >
        Toggle Sound
      </button>
      <button 
        data-testid="set-volume" 
        onClick={() => setVolume(0.8)}
      >
        Set Volume
      </button>
      <button 
        data-testid="play-click" 
        onClick={() => playSound('click')}
      >
        Play Click
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SoundProvider>
    {children}
  </SoundProvider>
);

describe('Sound Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useSound hook', () => {
    it('should initialize sound manager correctly', () => {
      const TestComponent = () => {
        const { playSound, isEnabled } = useSound();
        
        return (
          <div>
            <div data-testid="enabled">{isEnabled() ? 'true' : 'false'}</div>
            <button onClick={() => playSound('click')}>Play</button>
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    });

    it('should handle sound playing gracefully', async () => {
      const TestComponent = () => {
        const { playSound } = useSound();
        
        return (
          <button onClick={() => playSound('navigation')}>Play Navigation</button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      // Should not throw error even if audio fails
      expect(button).toBeInTheDocument();
    });
  });

  describe('SoundProvider', () => {
    it('should provide sound context correctly', () => {
      render(
        <TestWrapper>
          <TestSoundComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('sound-status')).toHaveTextContent('enabled');
      expect(screen.getByTestId('volume-level')).toHaveTextContent('0.5');
    });

    it('should toggle sound state', async () => {
      render(
        <TestWrapper>
          <TestSoundComponent />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('toggle-sound');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('sound-status')).toHaveTextContent('disabled');
      });
    });

    it('should update volume', async () => {
      render(
        <TestWrapper>
          <TestSoundComponent />
        </TestWrapper>
      );

      const volumeButton = screen.getByTestId('set-volume');
      fireEvent.click(volumeButton);

      await waitFor(() => {
        expect(screen.getByTestId('volume-level')).toHaveTextContent('0.8');
      });
    });

    it('should save settings to localStorage', async () => {
      render(
        <TestWrapper>
          <TestSoundComponent />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('toggle-sound');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(localStorage.getItem('sound-enabled')).toBe('false');
      });
    });
  });

  describe('SoundEnhancedButton', () => {
    it('should render and handle clicks with sound', () => {
      render(
        <TestWrapper>
          <SoundEnhancedButton soundType="click">
            Test Button
          </SoundEnhancedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Test Button');
      
      fireEvent.click(button);
      // Should not throw error
      expect(button).toBeInTheDocument();
    });

    it('should call custom onClick handler', () => {
      const mockClick = vi.fn();
      
      render(
        <TestWrapper>
          <SoundEnhancedButton onClick={mockClick}>
            Test Button
          </SoundEnhancedButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle audio creation errors gracefully', () => {
      // Mock Audio constructor to throw error
      const originalAudio = (global as any).Audio;
      (global as any).Audio = vi.fn().mockImplementation(() => {
        throw new Error('Audio creation failed');
      });

      const TestComponent = () => {
        const { playSound } = useSound();
        return <button onClick={() => playSound('click')}>Play</button>;
      };

      expect(() => render(<TestComponent />)).not.toThrow();

      // Restore original Audio
      (global as any).Audio = originalAudio;
    });

    it('should handle play errors gracefully', async () => {
      const mockPlay = vi.fn().mockRejectedValue(new Error('Play failed'));
      (global as any).Audio = vi.fn().mockImplementation(() => ({
        src: '',
        volume: 0.5,
        currentTime: 0,
        preload: 'auto',
        play: mockPlay,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const TestComponent = () => {
        const { playSound } = useSound();
        return (
          <button 
            data-testid="play-button" 
            onClick={() => playSound('click')}
          >
            Play
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByTestId('play-button');
      
      // Should not throw error even if play fails
      fireEvent.click(button);
      expect(button).toBeInTheDocument();
    });
  });
});
