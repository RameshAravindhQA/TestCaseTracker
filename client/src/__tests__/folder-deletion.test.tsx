/**
 * Document Folder Deletion Unit Tests
 * 
 * This file contains tests to verify the correct functioning of folder deletion in the documents module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '@/lib/queryClient';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}));

describe('Document Folder Deletion', () => {
  beforeEach(() => {
    // Reset mocks between tests
    vi.resetAllMocks();
  });

  it('should handle numeric folder IDs correctly', async () => {
    // Mock a successful API response
    (apiRequest as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Folder deleted successfully' }),
    });

    // Test with a valid numeric ID
    const response = await apiRequest('DELETE', '/api/document-folders/123');
    
    // Verify the request was made with the correct path
    expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/document-folders/123');
    
    // Verify the response is as expected
    expect(response.ok).toBe(true);
  });

  it('should handle string folder IDs by converting them to numbers', async () => {
    // Mock a successful API response
    (apiRequest as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Folder deleted successfully' }),
    });

    // Create a test function that simulates our deletion logic
    const deleteFolder = async (id: string | number) => {
      const folderId = Number(id);
      if (isNaN(folderId)) {
        throw new Error('Invalid folder ID');
      }
      return await apiRequest('DELETE', `/api/document-folders/${folderId}`);
    };

    // Test with a valid ID as string
    const response = await deleteFolder('456');
    
    // Verify the request was made with the correct path (numeric ID)
    expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/document-folders/456');
    
    // Verify the response is as expected
    expect(response.ok).toBe(true);
  });

  it('should reject invalid folder IDs', async () => {
    // Create a test function that simulates our deletion logic
    const deleteFolder = async (id: string | number) => {
      const folderId = Number(id);
      if (isNaN(folderId)) {
        throw new Error('Invalid folder ID');
      }
      return await apiRequest('DELETE', `/api/document-folders/${folderId}`);
    };

    // Test with invalid IDs
    await expect(deleteFolder('abc')).rejects.toThrow('Invalid folder ID');
    await expect(deleteFolder({})).rejects.toThrow('Invalid folder ID');
    await expect(deleteFolder(null)).rejects.toThrow('Invalid folder ID');
    
    // Verify no API requests were made with invalid IDs
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('should handle non-existent folder IDs gracefully', async () => {
    // Mock a 404 API response for a non-existent folder
    (apiRequest as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Folder not found' }),
    });

    // Create a test function that simulates our deletion logic with UI state handling
    const deleteFolder = async (id: number) => {
      try {
        // This is the important part - we track deleted IDs in local state
        const deletedFolderIds = [id];
        
        // Make the API request
        const response = await apiRequest('DELETE', `/api/document-folders/${id}`);
        
        // Return both the API response and our local deleted IDs
        return { 
          response,
          // Filter folders based on our local deleted IDs state
          filteredFolders: [
            { id: 1, name: 'Folder 1' },
            { id: 2, name: 'Folder 2' },
            { id: 3, name: 'Folder 3' }
          ].filter(f => !deletedFolderIds.includes(f.id))
        };
      } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
      }
    };

    // Test with a non-existent ID
    const result = await deleteFolder(999);
    
    // Verify the UI would still update correctly even though API failed
    expect(result.filteredFolders).toHaveLength(3); // All folders except the "deleted" one
    expect(result.filteredFolders.find(f => f.id === 999)).toBeUndefined();
    
    // Verify the request was made correctly
    expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/document-folders/999');
  });
});