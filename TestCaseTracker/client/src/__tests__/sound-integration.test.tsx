
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SoundProvider } from '@/hooks/use-sound-provider';
import { SoundTest } from '@/components/sound-test';

// Mock Audio API
const mockPlay = jest.fn();
const mockAudio = {
  play: mockPlay,
  volume: 0.5,
  preload: 'auto'
};

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio)
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <SoundProvider>
      {children}
    </SoundProvider>
  </QueryClientProvider>
);

describe('Sound Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const mockStorage = {
      getItem: jest.fn(() => JSON.stringify({
        enabled: true,
        volume: 0.5,
        sounds: {
          click: '/sounds/click.mp3',
          crud: '/sounds/crud.mp3',
          error: '/sounds/error.mp3',
          success: '/sounds/success.mp3',
          message: '/sounds/success.mp3'
        }
      })),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    });
  });

  it('should render sound test component', () => {
    render(<SoundTest />, { wrapper: TestWrapper });
    
    expect(screen.getByText('Sound Test Panel')).toBeInTheDocument();
    expect(screen.getByText('Test Click Sound')).toBeInTheDocument();
    expect(screen.getByText('Test CRUD Sound')).toBeInTheDocument();
    expect(screen.getByText('Test Error Sound')).toBeInTheDocument();
    expect(screen.getByText('Test Success Sound')).toBeInTheDocument();
    expect(screen.getByText('Test Message Sound')).toBeInTheDocument();
  });

  it('should play click sound when click button is pressed', () => {
    render(<SoundTest />, { wrapper: TestWrapper });
    
    const clickButton = screen.getByText('Test Click Sound');
    fireEvent.click(clickButton);
    
    expect(window.Audio).toHaveBeenCalledWith('/sounds/click.mp3');
    expect(mockPlay).toHaveBeenCalled();
  });

  it('should play CRUD sound when CRUD button is pressed', () => {
    render(<SoundTest />, { wrapper: TestWrapper });
    
    const crudButton = screen.getByText('Test CRUD Sound');
    fireEvent.click(crudButton);
    
    expect(window.Audio).toHaveBeenCalledWith('/sounds/crud.mp3');
    expect(mockPlay).toHaveBeenCalled();
  });

  it('should play error sound when error button is pressed', () => {
    render(<SoundTest />, { wrapper: TestWrapper });
    
    const errorButton = screen.getByText('Test Error Sound');
    fireEvent.click(errorButton);
    
    expect(window.Audio).toHaveBeenCalledWith('/sounds/error.mp3');
    expect(mockPlay).toHaveBeenCalled();
  });
});
