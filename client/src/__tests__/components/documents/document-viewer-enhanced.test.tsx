
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentViewer } from '@/components/documents/document-viewer';

const mockDocument = {
  id: 1,
  name: 'Test Document',
  fileName: 'test.pdf',
  fileUrl: '/uploads/documents/test.pdf',
  fileType: 'application/pdf',
  fileSize: 1024 * 1024,
  projectId: 1,
  uploadedById: 1,
  createdAt: '2023-01-01T00:00:00Z'
};

const mockVideoDocument = {
  ...mockDocument,
  fileName: 'test.mp4',
  fileUrl: '/uploads/documents/test.mp4',
  fileType: 'video/mp4'
};

const mockImageDocument = {
  ...mockDocument,
  fileName: 'test.jpg',
  fileUrl: '/uploads/documents/test.jpg',
  fileType: 'image/jpeg'
};

describe('Enhanced DocumentViewer', () => {
  const mockOnClose = vi.fn();
  const mockOnDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render PDF document with enhanced controls', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('test.pdf • application/pdf • 1.00 MB')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should render video document with video controls', () => {
    render(
      <DocumentViewer
        document={mockVideoDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should render image document with zoom controls', () => {
    render(
      <DocumentViewer
        document={mockImageDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle zoom controls for images', () => {
    render(
      <DocumentViewer
        document={mockImageDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInButton);
    
    expect(screen.getByText('125%')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle video playback controls', () => {
    render(
      <DocumentViewer
        document={mockVideoDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        onClose={mockOnClose}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });
});
