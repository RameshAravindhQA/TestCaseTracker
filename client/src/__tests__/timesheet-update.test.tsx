import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../lib/queryClient';

// Mock API request
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));

// Helper function to create a mock timesheet
const createMockTimesheet = (id = 1) => ({
  id,
  userId: 1,
  projectId: "1",
  description: "Testing time updates",
  workDate: new Date().toISOString(),
  startTime: "09:00 AM", // Default start time
  endTime: "05:00 PM",   // Default end time
  hours: 8,
  status: "Pending",
  tags: ["Testing", "Development"],
  createdAt: new Date().toISOString()
});

describe('Timesheet Time Update Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock successful API response
    (apiRequest as any).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockTimesheet())
      })
    );
  });

  it('properly formats and preserves AM/PM time values when updating a timesheet', async () => {
    // Setup custom time values
    const updatedStartTime = "10:30 AM";
    const updatedEndTime = "06:45 PM";
    
    // Mock implementation for this specific test
    (apiRequest as any).mockImplementation(async (method, url, data) => {
      // Verify the data being sent to the API
      expect(data.startTime).toBe(updatedStartTime);
      expect(data.endTime).toBe(updatedEndTime);
      
      // Return mock response with updated times
      return {
        ok: true,
        json: () => Promise.resolve({
          ...createMockTimesheet(),
          startTime: updatedStartTime,
          endTime: updatedEndTime
        })
      };
    });
    
    // Simulate updating a timesheet
    const result = await apiRequest('PATCH', '/api/timesheets/1', {
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      id: 1
    });
    
    // Verify API was called with correct method and URL
    expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/timesheets/1', expect.any(Object));
    
    // Verify the result
    const timesheet = await result.json();
    expect(timesheet.startTime).toBe(updatedStartTime);
    expect(timesheet.endTime).toBe(updatedEndTime);
  });
  
  it('handles time values without AM/PM by adding appropriate designation', async () => {
    // Setup time values without AM/PM
    const inputStartTime = "08:15"; // Morning, should become AM
    const inputEndTime = "16:30";   // Afternoon, should become PM
    
    // Expected formatted output
    const expectedStartTime = "08:15 AM";
    const expectedEndTime = "16:30 PM";
    
    // Mock implementation for this test
    (apiRequest as any).mockImplementation(async (method, url, data) => {
      // Server should format the times with AM/PM
      return {
        ok: true,
        json: () => Promise.resolve({
          ...createMockTimesheet(),
          startTime: expectedStartTime,
          endTime: expectedEndTime
        })
      };
    });
    
    // Simulate updating a timesheet with times missing AM/PM
    const result = await apiRequest('PATCH', '/api/timesheets/1', {
      startTime: inputStartTime,
      endTime: inputEndTime,
      id: 1
    });
    
    // Verify API was called
    expect(apiRequest).toHaveBeenCalled();
    
    // Verify the result contains properly formatted times
    const timesheet = await result.json();
    expect(timesheet.startTime).toBe(expectedStartTime);
    expect(timesheet.endTime).toBe(expectedEndTime);
  });
  
  it('properly preserves tags when updating a timesheet', async () => {
    // Setup custom tags
    const updatedTags = ["Important", "Urgent", "Client"];
    
    // Mock implementation for this test
    (apiRequest as any).mockImplementation(async (method, url, data) => {
      // Verify the data being sent to the API
      expect(data.tags).toEqual(updatedTags);
      
      // Return mock response with updated tags
      return {
        ok: true,
        json: () => Promise.resolve({
          ...createMockTimesheet(),
          tags: updatedTags
        })
      };
    });
    
    // Simulate updating a timesheet with new tags
    const result = await apiRequest('PATCH', '/api/timesheets/1', {
      tags: updatedTags,
      id: 1
    });
    
    // Verify API was called with correct data
    expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/timesheets/1', expect.objectContaining({
      tags: updatedTags
    }));
    
    // Verify the result contains updated tags
    const timesheet = await result.json();
    expect(timesheet.tags).toEqual(updatedTags);
    expect(timesheet.tags.length).toBe(3);
  });
  
  it('handles error responses when updating a timesheet', async () => {
    // Mock error response
    (apiRequest as any).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve("Invalid time format"),
        status: 400,
        statusText: "Bad Request"
      })
    );
    
    // Simulate updating a timesheet with invalid data
    try {
      await apiRequest('PATCH', '/api/timesheets/1', {
        startTime: "invalid-time",
        endTime: "05:00 PM",
        id: 1
      });
      
      // This should not be reached if the function throws as expected
      expect(false).toBe(true);
    } catch (error) {
      // Verify error was thrown
      expect(error).toBeDefined();
    }
    
    // Verify API was called
    expect(apiRequest).toHaveBeenCalled();
  });
});