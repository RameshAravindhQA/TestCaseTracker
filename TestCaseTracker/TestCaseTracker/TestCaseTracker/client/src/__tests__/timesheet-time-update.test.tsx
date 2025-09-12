import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditTimesheetForm from '../components/timesheets/edit-timesheet-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock modules
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'Admin' }
  })
}));

vi.mock('@/lib/queryClient', () => {
  const actualQueryClient = vi.importActual('@/lib/queryClient');
  return {
    ...actualQueryClient,
    apiRequest: vi.fn(),
    queryClient: {
      invalidateQueries: vi.fn()
    }
  };
});

// Mock useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/projects') {
        return { data: [{ id: 1, name: 'Test Project' }], isLoading: false };
      }
      if (queryKey[0] === '/api/tags') {
        return { data: [{ id: 1, name: 'Testing' }, { id: 2, name: 'Development' }], isLoading: false };
      }
      return { data: [], isLoading: false };
    }),
    useMutation: vi.fn().mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false
    }))
  };
});

// Create test timesheet
const createMockTimesheet = (startTime = '09:00 AM', endTime = '05:00 PM') => ({
  id: 1,
  userId: 1,
  projectId: 1,
  description: 'Testing timesheet updates',
  workDate: new Date().toISOString().split('T')[0],
  startTime,
  endTime,
  hours: 8,
  status: 'Pending',
  tags: ['Testing'],
  createdAt: new Date().toISOString()
});

describe('Timesheet Time Input Field Hotfix Tests', () => {
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
    vi.clearAllMocks();
    
    // Setup mock API request
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockTimesheet('10:30 AM', '06:45 PM'))
      })
    );
  });
  
  it('properly formats and submits time values with AM/PM designation', async () => {
    const onSuccessMock = vi.fn();
    const onCancelMock = vi.fn();
    
    // Render component with default timesheet
    render(
      <QueryClientProvider client={queryClient}>
        <EditTimesheetForm 
          timesheet={createMockTimesheet()}
          onSuccess={onSuccessMock}
          onCancel={onCancelMock}
        />
      </QueryClientProvider>
    );
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    });
    
    // Mock the form's setValue method to track calls
    const setValueSpy = vi.fn();
    const form = {
      setValue: setValueSpy,
      getValues: vi.fn().mockImplementation((field) => {
        if (field === 'startTime') return '09:00 AM';
        if (field === 'endTime') return '05:00 PM';
        return null;
      })
    };
    
    // Get the time inputs
    const startTimeInput = screen.getByLabelText(/start time/i);
    
    // Simulate changing time input value
    fireEvent.change(startTimeInput, { target: { value: '10:30' } });
    
    // Change AM/PM select for start time (find by role)
    const startTimeAmPmSelect = screen.getAllByRole('combobox')[0];
    fireEvent.click(startTimeAmPmSelect);
    
    // Find AM option and click it
    await waitFor(() => {
      const amOption = screen.getAllByRole('option', { name: 'AM' })[0];
      fireEvent.click(amOption);
    });
    
    // Find and click the submit/save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    // Verify API call was made with correct time format
    await waitFor(() => {
      const { apiRequest } = require('@/lib/queryClient');
      expect(apiRequest).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = apiRequest.mock.calls[0];
      
      // Verify method and URL
      expect(callArgs[0]).toBe('PATCH');
      expect(callArgs[1]).toBe('/api/timesheets/1');
      
      // Verify data contains properly formatted time values
      const data = callArgs[2];
      expect(data).toBeDefined();
      
      // Time values should include AM/PM designation
      const startTimePattern = /\d{1,2}:\d{2}\s*(AM|PM)/i;
      const endTimePattern = /\d{1,2}:\d{2}\s*(AM|PM)/i;
      
      expect(data.startTime).toMatch(startTimePattern);
      expect(data.endTime).toMatch(endTimePattern);
    });
  });
  
  it('preserves AM/PM designation when switching between them', async () => {
    const onSuccessMock = vi.fn();
    const onCancelMock = vi.fn();
    
    // Render with a timesheet that has AM times
    render(
      <QueryClientProvider client={queryClient}>
        <EditTimesheetForm 
          timesheet={createMockTimesheet('09:00 AM', '11:30 AM')}
          onSuccess={onSuccessMock}
          onCancel={onCancelMock}
        />
      </QueryClientProvider>
    );
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    });
    
    // Get the end time AM/PM select
    const endTimeAmPmSelect = screen.getAllByRole('combobox')[1];
    fireEvent.click(endTimeAmPmSelect);
    
    // Find PM option and select it to change from AM to PM
    await waitFor(() => {
      const pmOption = screen.getAllByRole('option', { name: 'PM' })[1];
      fireEvent.click(pmOption);
    });
    
    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    // Verify API call contains correct AM/PM designation
    await waitFor(() => {
      const { apiRequest } = require('@/lib/queryClient');
      expect(apiRequest).toHaveBeenCalled();
      
      const callArgs = apiRequest.mock.calls[0];
      const data = callArgs[2];
      
      // Start time should still be AM
      expect(data.startTime).toMatch(/AM/i);
      
      // End time should now be PM
      expect(data.endTime).toMatch(/PM/i);
    });
  });
  
  it('calculates hours correctly based on time values', async () => {
    const onSuccessMock = vi.fn();
    const onCancelMock = vi.fn();
    
    // Render component
    render(
      <QueryClientProvider client={queryClient}>
        <EditTimesheetForm 
          timesheet={createMockTimesheet('09:00 AM', '05:00 PM')}
          onSuccess={onSuccessMock}
          onCancel={onCancelMock}
        />
      </QueryClientProvider>
    );
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    });
    
    // Change start time to 8:00 AM
    const startTimeInput = screen.getByLabelText(/start time/i);
    fireEvent.change(startTimeInput, { target: { value: '08:00' } });
    
    // Change end time to 4:00 PM
    const endTimeInput = screen.getByLabelText(/end time/i);
    fireEvent.change(endTimeInput, { target: { value: '16:00' } });
    
    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    // Verify API call includes correct calculated hours (8 hours)
    await waitFor(() => {
      const { apiRequest } = require('@/lib/queryClient');
      expect(apiRequest).toHaveBeenCalled();
      
      const callArgs = apiRequest.mock.calls[0];
      const data = callArgs[2];
      
      // Should be approximately 8 hours
      expect(data.hours).toBeGreaterThanOrEqual(8);
      expect(data.hours).toBeLessThanOrEqual(8.5);
    });
  });
});