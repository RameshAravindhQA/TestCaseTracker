import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { DocumentFolder } from '@shared/schema';
import { FolderRenameDialog } from '../components/documents/folder-rename-dialog';

// Mock API request function
jest.mock('../lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: {
    invalidateQueries: jest.fn()
  }
}));

import { apiRequest } from '../lib/queryClient';

describe('Folder Rename Component', () => {
  const mockFolder: DocumentFolder = {
    id: 1,
    name: 'Test Folder',
    description: 'Test folder description',
    projectId: 1,
    createdById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    parentFolderId: null
  };
  
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  
  // Create fresh QueryClient for each test
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful API response
    (apiRequest as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockFolder, name: 'Updated Folder Name' })
    });
  });
  
  test('renders folder rename dialog properly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Check if dialog shows proper title
    expect(screen.getByText(/Rename Folder/i)).toBeInTheDocument();
    
    // Check if input field has current name
    const inputField = screen.getByLabelText(/Folder Name/i) as HTMLInputElement;
    expect(inputField.value).toBe('Test Folder');
  });
  
  test('submits form with valid data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Type in the new name
    const inputField = screen.getByLabelText(/Folder Name/i);
    await userEvent.clear(inputField);
    await userEvent.type(inputField, 'Updated Folder Name');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(submitButton);
    
    // Wait for API call 
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        'PUT',
        '/api/document-folders/1',
        { name: 'Updated Folder Name' }
      );
    });
    
    // Callback should be called on success
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('prevents empty folder name submission', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Clear the input field
    const inputField = screen.getByLabelText(/Folder Name/i);
    await userEvent.clear(inputField);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText(/Folder name cannot be empty/i)).toBeInTheDocument();
    
    // API should not be called
    expect(apiRequest).not.toHaveBeenCalled();
  });
  
  test('prevents unnecessary API calls if name is unchanged', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Don't change the input value
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(submitButton);
    
    // Should show notice message that no changes were made
    expect(screen.getByText(/No changes to save/i)).toBeInTheDocument();
    
    // API should not be called
    expect(apiRequest).not.toHaveBeenCalled();
  });
  
  test('handles API errors when renaming folder', async () => {
    // Mock API failure
    (apiRequest as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to update folder' }),
      status: 400
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Type in the new name
    const inputField = screen.getByLabelText(/Folder Name/i);
    await userEvent.clear(inputField);
    await userEvent.type(inputField, 'Updated Folder Name');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to update folder/i)).toBeInTheDocument();
    });
    
    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  test('handles network errors gracefully', async () => {
    // Mock network failure
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <QueryClientProvider client={queryClient}>
        <FolderRenameDialog 
          folder={mockFolder} 
          open={true} 
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    );
    
    // Type in the new name
    const inputField = screen.getByLabelText(/Folder Name/i);
    await userEvent.clear(inputField);
    await userEvent.type(inputField, 'Updated Folder Name');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
    
    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});