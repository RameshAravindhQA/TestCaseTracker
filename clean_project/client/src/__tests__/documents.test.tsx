/**
 * Document Management Integration Tests
 * 
 * These tests verify the correct functioning of document and folder deletion,
 * ensuring that UI updates immediately reflect deleted items.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import DocumentsPage from '../pages/documents';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  }
}));

// Mock the toast notifications
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the HTML5 drag and drop backend
vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {}
}));

// Sample test data
const mockDocuments = [
  { id: 1, name: 'Test Document 1', folderId: null, projectId: 1, type: 'pdf', size: 1024, createdById: 1, createdAt: new Date().toISOString() },
  { id: 2, name: 'Test Document 2', folderId: null, projectId: 1, type: 'docx', size: 2048, createdById: 1, createdAt: new Date().toISOString() }
];

const mockFolders = [
  { id: 1, name: 'Test Folder 1', parentFolderId: null, projectId: 1, createdById: 1, createdAt: new Date().toISOString() },
  { id: 2, name: 'Test Folder 2', parentFolderId: null, projectId: 1, createdById: 1, createdAt: new Date().toISOString() }
];

describe('Document Management', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock the useQuery hook to return our test data
    vi.mock('@tanstack/react-query', () => ({
      useQuery: ({ queryKey }: { queryKey: string[] }) => {
        if (queryKey.includes('documents')) {
          return { data: mockDocuments, isLoading: false, error: null };
        }
        if (queryKey.includes('document-folders')) {
          return { data: mockFolders, isLoading: false, error: null };
        }
        return { data: null, isLoading: false, error: null };
      },
      useMutation: () => ({
        mutate: vi.fn(),
        isPending: false
      })
    }));
  });

  test('Documents are immediately removed from UI after deletion', async () => {
    // Mock a successful API deletion response
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockResolvedValue({ ok: true });
    
    // Render the documents page
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsPage />
      </QueryClientProvider>
    );
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
    });
    
    // Get the delete button for the first document
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    
    // Click delete
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    // Check that the document is no longer in the DOM
    await waitFor(() => {
      expect(screen.queryByText('Test Document 1')).not.toBeInTheDocument();
    });
    
    // Verify API was called
    expect(apiRequest).toHaveBeenCalled();
  });

  test('Folders are immediately removed from UI after deletion', async () => {
    // Mock a successful API deletion response
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockResolvedValue({ ok: true });
    
    // Render the documents page
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsPage />
      </QueryClientProvider>
    );
    
    // Wait for folders to load
    await waitFor(() => {
      expect(screen.getByText('Test Folder 1')).toBeInTheDocument();
    });
    
    // Get the delete button for the first folder
    const folderElement = screen.getByText('Test Folder 1').closest('div');
    const deleteButton = folderElement?.querySelector('button[aria-label="Delete folder"]');
    
    // Click delete
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete folder/i });
    fireEvent.click(confirmButton);
    
    // Check that the folder is no longer in the DOM
    await waitFor(() => {
      expect(screen.queryByText('Test Folder 1')).not.toBeInTheDocument();
    });
    
    // Verify API was called
    expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/document-folders/1');
  });

  test('UI stays updated even if API deletion fails', async () => {
    // Mock a failed API deletion response
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockResolvedValue({ 
      ok: false, 
      status: 404,
      json: () => Promise.resolve({ message: 'Folder not found' })
    });
    
    // Render the documents page
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsPage />
      </QueryClientProvider>
    );
    
    // Wait for folders to load
    await waitFor(() => {
      expect(screen.getByText('Test Folder 1')).toBeInTheDocument();
    });
    
    // Get the delete button for the first folder
    const folderElement = screen.getByText('Test Folder 1').closest('div');
    const deleteButton = folderElement?.querySelector('button[aria-label="Delete folder"]');
    
    // Click delete
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete folder/i });
    fireEvent.click(confirmButton);
    
    // Check that the folder is no longer in the DOM despite API failure
    await waitFor(() => {
      expect(screen.queryByText('Test Folder 1')).not.toBeInTheDocument();
    });
    
    // Verify API was called
    expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/document-folders/1');
  });
});