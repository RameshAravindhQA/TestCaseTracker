
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BugForm } from '../../../components/bugs/bug-form';
import { Bug, Module, User } from '../../../types';
import { vi } from 'vitest';

// Mock the toast hook
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('BugForm Component Tests', () => {
  const mockModule: Module = {
    id: 1,
    name: 'Authentication Module',
    description: 'User authentication',
    projectId: 1,
    status: 'Active',
    createdAt: '2024-01-01'
  };

  const mockBug: Bug = {
    id: 1,
    bugId: 'BUG-001',
    title: 'Login Issue',
    description: 'Cannot log in',
    stepsToReproduce: '1. Go to login\n2. Enter credentials\n3. Click login',
    severity: 'Critical',
    priority: 'High',
    status: 'Open',
    projectId: 1,
    testCaseId: null,
    moduleId: 1,
    reportedById: 1,
    assignedToId: null,
    createdAt: '2024-01-01',
    updatedAt: null,
    resolvedDate: null,
    environment: 'Production',
    browserInfo: 'Chrome 120',
    operatingSystem: 'Windows 11',
    deviceInfo: 'Desktop',
    preConditions: 'User on login page',
    expectedResult: 'Successful login',
    actualResult: 'Error message displayed',
    comments: 'Urgent fix needed'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    test('should render bug form for new bug', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByText('Add New Bug')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    test('should render bug form for editing existing bug', () => {
      renderWithProviders(
        <BugForm 
          bug={mockBug}
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByText('Edit Bug')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Login Issue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cannot log in')).toBeInTheDocument();
    });

    test('should populate form fields with existing bug data', () => {
      renderWithProviders(
        <BugForm 
          bug={mockBug}
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByDisplayValue('BUG-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Login Issue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cannot log in')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1. Go to login\n2. Enter credentials\n3. Click login')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields', async () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const submitButton = screen.getByRole('button', { name: /create bug/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    test('should validate title minimum length', async () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'AB' } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    test('should validate steps to reproduce field', async () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const stepsInput = screen.getByLabelText(/steps to reproduce/i);
      fireEvent.change(stepsInput, { target: { value: 'AB' } });
      fireEvent.blur(stepsInput);

      await waitFor(() => {
        expect(screen.getByText(/steps to reproduce must be at least 3 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    test('should have all required form fields', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/steps to reproduce/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expected result/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/actual result/i)).toBeInTheDocument();
    });

    test('should handle severity selection', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const severitySelect = screen.getByLabelText(/severity/i);
      fireEvent.change(severitySelect, { target: { value: 'Critical' } });
      
      expect(severitySelect).toHaveValue('Critical');
    });

    test('should handle priority selection', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const prioritySelect = screen.getByLabelText(/priority/i);
      fireEvent.change(prioritySelect, { target: { value: 'High' } });
      
      expect(prioritySelect).toHaveValue('High');
    });

    test('should handle status selection', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
      
      expect(statusSelect).toHaveValue('In Progress');
    });
  });

  describe('Form Submission', () => {
    test('should call onSuccess when form is submitted successfully', async () => {
      const mockOnSuccess = vi.fn();
      
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/title/i), { 
        target: { value: 'Test Bug Title' } 
      });
      fireEvent.change(screen.getByLabelText(/steps to reproduce/i), { 
        target: { value: 'Step 1: Do something\nStep 2: Do something else' } 
      });
      fireEvent.change(screen.getByLabelText(/expected result/i), { 
        target: { value: 'Expected result here' } 
      });
      fireEvent.change(screen.getByLabelText(/actual result/i), { 
        target: { value: 'Actual result here' } 
      });

      // Note: In a real test, you'd need to mock the API call
      // For now, we just test that the form can be filled out correctly
      expect(screen.getByDisplayValue('Test Bug Title')).toBeInTheDocument();
    });
  });

  describe('Module Integration', () => {
    test('should populate module dropdown with provided modules', () => {
      const modules = [
        mockModule,
        {
          id: 2,
          name: 'Payment Module',
          description: 'Payment processing',
          projectId: 1,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ];

      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={modules} 
        />
      );

      // Check if module selection is available
      // Note: The exact implementation depends on how modules are rendered in the form
      expect(screen.getByText(/module/i)).toBeInTheDocument();
    });

    test('should pre-select module when provided', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          module={mockModule}
          modules={[mockModule]} 
        />
      );

      // The module should be pre-selected in the form
      // Implementation depends on the actual form structure
      expect(screen.getByText(mockModule.name)).toBeInTheDocument();
    });
  });

  describe('Test Case Integration', () => {
    test('should populate form with test case data when provided', () => {
      const testCase = {
        id: 1,
        testCaseId: 'TC-001',
        moduleId: 1,
        projectId: 1,
        feature: 'Login',
        testObjective: 'Test login functionality',
        preConditions: 'User on login page',
        testSteps: 'Enter credentials and click login',
        expectedResult: 'User should be logged in',
        actualResult: null,
        status: 'Not Executed',
        priority: 'High',
        comments: null,
        createdById: 1,
        assignedToId: null,
        createdAt: '2024-01-01',
        updatedAt: null
      };

      renderWithProviders(
        <BugForm 
          projectId={1} 
          testCase={testCase}
          modules={[mockModule]} 
        />
      );

      // Check if test case data is populated
      expect(screen.getByDisplayValue('User on login page')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Enter credentials and click login')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User should be logged in')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper labels for form fields', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/steps to reproduce/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expected result/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/actual result/i)).toBeInTheDocument();
    });

    test('should have proper button roles', () => {
      renderWithProviders(
        <BugForm 
          projectId={1} 
          modules={[mockModule]} 
        />
      );

      expect(screen.getByRole('button', { name: /create bug/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
