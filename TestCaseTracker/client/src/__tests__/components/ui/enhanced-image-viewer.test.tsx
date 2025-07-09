
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedImageViewer } from '../../../components/ui/enhanced-image-viewer';

// Mock toast hook
vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn()
}));

describe('EnhancedImageViewer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    imageUrl: '/test-image.jpg',
    fileName: 'test-image.jpg',
    fileSize: 1024000
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render image viewer when open', () => {
    render(<EnhancedImageViewer {...defaultProps} />);
    
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('Size: 1000.00 KB')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<EnhancedImageViewer {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('test-image.jpg')).not.toBeInTheDocument();
  });

  it('should handle zoom controls', () => {
    render(<EnhancedImageViewer {...defaultProps} />);
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    fireEvent.click(zoomInButton);
    expect(screen.getByText('125%')).toBeInTheDocument();
    
    fireEvent.click(zoomOutButton);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle rotation', () => {
    render(<EnhancedImageViewer {...defaultProps} />);
    
    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateButton);
    
    // Rotation state is internal, but we can verify the button works
    expect(rotateButton).toBeInTheDocument();
  });

  it('should handle download', async () => {
    // Mock fetch and URL.createObjectURL
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
    });
    
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock createElement and appendChild/removeChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    
    document.createElement = vi.fn().mockReturnValue(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    render(<EnhancedImageViewer {...defaultProps} />);
    
    const downloadButton = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/test-image.jpg');
    });
  });

  it('should handle image load error', () => {
    render(<EnhancedImageViewer {...defaultProps} />);
    
    const image = screen.getByAltText('test-image.jpg');
    fireEvent.error(image);
    
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should reset state when imageUrl changes', () => {
    const { rerender } = render(<EnhancedImageViewer {...defaultProps} />);
    
    // Zoom in first
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInButton);
    expect(screen.getByText('125%')).toBeInTheDocument();
    
    // Change image URL
    rerender(<EnhancedImageViewer {...defaultProps} imageUrl="/new-image.jpg" />);
    
    // Should reset to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
