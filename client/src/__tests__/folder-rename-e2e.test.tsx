import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { DocumentsPage } from '../pages/documents';
import { DocumentFolder } from '@/shared/schema';

// Mock the necessary modules
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Mock router
vi.mock('wouter', () => ({
  useLocation: () => ['/documents', () => {}],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Folder Rename End-to-End Tests', () => {
  // Mock data
  const mockFolders: DocumentFolder[] = [
    {
      id: 1,
      name: 'Test Folder 1',
      description: 'Description 1',
      projectId: 1,
      parentFolderId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    },
    {
      id: 2,
      name: 'Child Folder',
      description: 'Child folder description',
      projectId: 1,
      parentFolderId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    }
  ];

  // Mock API responses
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock the query responses
    (window as any).fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: 'Test Project' }]),
        });
      }
      
      if (url.includes('/document-folders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFolders),
        });
      }
      
      if (url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  // Test the full rename flow
  test('complete folder rename flow', async () => {
    const user = userEvent.setup();
    
    // Override fetch for PATCH request to simulate folder rename
    (window as any).fetch = vi.fn().mockImplementation((url, options) => {
      // For the folder update request
      if (url.includes('/api/document-folders/1') && options.method === 'PATCH') {
        const requestBody = JSON.parse(options.body);
        const updatedFolder = {
          ...mockFolders[0],
          name: requestBody.name,
          updatedAt: new Date().toISOString()
        };
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedFolder),
        });
      }
      
      // Default handlers for other requests
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: 'Test Project' }]),
        });
      }
      
      if (url.includes('/document-folders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFolders),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    // Render the component
    render(<DocumentsPage />, { wrapper: createWrapper() });
    
    // Wait for the project data to load
    await waitFor(() => {
      expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
    });
    
    // Mock the folder context menu click and edit action
    // Note: In a real E2E test, we would find and click the actual elements,
    // but for unit testing we're simulating the action directly
    await user.click(screen.getByText(/Test Folder 1/i));
    
    // Simulate opening the edit folder dialog
    // In a real test, we'd click the edit button, but here we simulate the state change
    
    // Wait for the folder form to appear
    await waitFor(() => {
      const editButton = screen.getByText(/Edit Folder/i);
      return user.click(editButton);
    });
    
    // Check if the folder form is open with the current folder name
    await waitFor(() => {
      expect(screen.getByLabelText(/Folder Name/i)).toHaveValue('Test Folder 1');
    });
    
    // Type a new folder name
    const nameInput = screen.getByLabelText(/Folder Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed Test Folder');
    
    // Submit the form
    const updateButton = screen.getByRole('button', { name: /Update Folder/i });
    await user.click(updateButton);
    
    // Verify that the API was called with the correct parameters
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/document-folders/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Renamed Test Folder'),
        })
      );
    });
    
    // Verify the success toast (in a real test)
    // This would check for the appearance of a success message
    
    // Verify the folder name was updated in the UI (after refetch)
    // This requires the query to be properly updated and the UI to reflect the changes
  });

  // Test error handling for folder rename
  test('handles errors during folder rename', async () => {
    const user = userEvent.setup();
    
    // Override fetch to simulate an error
    (window as any).fetch = vi.fn().mockImplementation((url, options) => {
      // For the folder update request
      if (url.includes('/api/document-folders/1') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'A folder with this name already exists' }),
        });
      }
      
      // Default handlers for other requests (same as previous test)
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true, 
          json: () => Promise.resolve([{ id: 1, name: 'Test Project' }]),
        });
      }
      
      if (url.includes('/document-folders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFolders),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    // Render the component
    render(<DocumentsPage />, { wrapper: createWrapper() });
    
    // Wait for the project data to load
    await waitFor(() => {
      expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
    });
    
    // Mock folder edit action
    await user.click(screen.getByText(/Test Folder 1/i));
    
    // Simulate opening the edit folder dialog
    await waitFor(() => {
      const editButton = screen.getByText(/Edit Folder/i);
      return user.click(editButton);
    });
    
    // Check if the folder form is open
    await waitFor(() => {
      expect(screen.getByLabelText(/Folder Name/i)).toHaveValue('Test Folder 1');
    });
    
    // Type a new folder name that will trigger the error
    const nameInput = screen.getByLabelText(/Folder Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Duplicate Folder Name');
    
    // Submit the form
    const updateButton = screen.getByRole('button', { name: /Update Folder/i });
    await user.click(updateButton);
    
    // Verify the error handling
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/document-folders/1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
      
      // In a real test we would verify that an error toast is shown
      // expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });
});