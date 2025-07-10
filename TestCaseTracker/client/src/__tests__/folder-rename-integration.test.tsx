import { apiRequest } from '../lib/queryClient';
import { DocumentFolder } from '@shared/schema';

// Mock fetch globally
global.fetch = jest.fn();

describe('Folder Rename API Integration', () => {
  // Reset mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
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
  
  test('successfully updates folder name', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockFolder, name: 'Updated Folder Name' }),
      text: async () => JSON.stringify({ ...mockFolder, name: 'Updated Folder Name' }),
      status: 200
    });
    
    // Call the API
    const result = await apiRequest(
      'PUT',
      `/api/document-folders/${mockFolder.id}`,
      { name: 'Updated Folder Name' }
    );
    
    // Get the data from the response
    const data = await result.json();
    
    // Verify API was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/document-folders/${mockFolder.id}`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ name: 'Updated Folder Name' })
      })
    );

    // Verify the response data
    expect(result.ok).toBe(true);
    expect(data.name).toBe('Updated Folder Name');
    expect(data.id).toBe(mockFolder.id);
  });

  test('handles API errors when updating folder name', async () => {
    const errorMessage = 'Failed to update folder';
    
    // Mock API error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
      text: async () => JSON.stringify({ message: errorMessage }),
      status: 400
    });

    // Call the API
    const result = await apiRequest(
      'PUT',
      `/api/document-folders/${mockFolder.id}`,
      { name: 'Updated Folder Name' }
    );

    // Verify API was called
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify the error response
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    
    // Check that we can parse the error message
    const errorResponse = await result.json();
    expect(errorResponse.message).toBe(errorMessage);
  });

  test('handles non-JSON error responses gracefully', async () => {
    // Mock HTML error response (like from server errors)
    const htmlErrorResponse = '<!DOCTYPE html><html><body>Server Error</body></html>';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => htmlErrorResponse,
      status: 500
    });

    // Call the API
    const result = await apiRequest(
      'PUT',
      `/api/document-folders/${mockFolder.id}`,
      { name: 'Updated Folder Name' }
    );

    // Verify API was called
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify the error response
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    
    // Check that we get the raw text response when JSON parsing fails
    const responseText = await result.text();
    expect(responseText).toBe(htmlErrorResponse);
  });

  test('handles empty successful responses', async () => {
    // Mock empty but successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => '',
      status: 200
    });

    // Call the API
    const result = await apiRequest(
      'PUT',
      `/api/document-folders/${mockFolder.id}`,
      { name: 'Updated Folder Name' }
    );

    // Verify API was called
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify the success response
    expect(result.ok).toBe(true);
    
    // Verify we can safely call text() to get the empty string
    const responseText = await result.text();
    expect(responseText).toBe('');
    
    // And it doesn't throw an error when trying to parse JSON
    await expect(result.json()).rejects.toThrow('Invalid JSON');
  });

  test('handles network errors gracefully', async () => {
    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Expect the API call to throw an error
    await expect(apiRequest(
      'PUT',
      `/api/document-folders/${mockFolder.id}`,
      { name: 'Updated Folder Name' }
    )).rejects.toThrow('Network error');
  });
});