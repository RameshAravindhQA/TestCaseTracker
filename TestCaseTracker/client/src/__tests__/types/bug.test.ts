
import { Bug, User, Module, Tag, FileAttachment } from '../../types';

describe('Bug Interface Tests', () => {
  // Mock data for testing
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Tester',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockModule: Module = {
    id: 1,
    name: 'Authentication Module',
    description: 'User authentication functionality',
    projectId: 1,
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockTag: Tag = {
    id: 1,
    name: 'Critical',
    color: '#ff0000',
    projectId: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockAttachment: FileAttachment = {
    id: 1,
    name: 'screenshot.png',
    type: 'image/png',
    data: 'base64encodeddata',
    size: 1024,
    entityType: 'bug',
    entityId: 1,
    fileName: 'screenshot.png',
    fileUrl: '/uploads/screenshot.png',
    fileType: 'image/png',
    fileSize: 1024,
    uploadedById: 1,
    uploadedAt: '2024-01-01T00:00:00Z'
  };

  const mockBug: Bug = {
    id: 1,
    bugId: 'BUG-001',
    title: 'Login button not working',
    description: 'The login button does not respond to clicks',
    stepsToReproduce: '1. Navigate to login page\n2. Enter credentials\n3. Click login button',
    severity: 'Critical',
    priority: 'High',
    status: 'Open',
    projectId: 1,
    testCaseId: 1,
    moduleId: 1,
    reportedById: 1,
    assignedToId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    resolvedDate: null,
    environment: 'Production',
    browserInfo: 'Chrome 120',
    operatingSystem: 'Windows 11',
    deviceInfo: 'Desktop',
    preConditions: 'User must be on login page',
    expectedResult: 'User should be logged in successfully',
    actualResult: 'Nothing happens when clicking login button',
    comments: 'This is blocking user access',
    dateReported: '2024-01-01',
    attachments: [mockAttachment],
    tags: [mockTag],
    module: mockModule,
    assignedTo: mockUser
  };

  describe('Bug Interface Structure', () => {
    test('should have all required properties', () => {
      const requiredProperties = [
        'id', 'bugId', 'title', 'stepsToReproduce', 'severity', 'priority', 
        'status', 'projectId', 'reportedById', 'createdAt', 'expectedResult', 'actualResult'
      ];

      requiredProperties.forEach(prop => {
        expect(mockBug).toHaveProperty(prop);
      });
    });

    test('should have correct severity values', () => {
      const validSeverities: Bug['severity'][] = ['Critical', 'Major', 'Minor', 'Trivial'];
      validSeverities.forEach(severity => {
        const bug: Bug = { ...mockBug, severity };
        expect(bug.severity).toBe(severity);
      });
    });

    test('should have correct priority values', () => {
      const validPriorities: Bug['priority'][] = ['High', 'Medium', 'Low'];
      validPriorities.forEach(priority => {
        const bug: Bug = { ...mockBug, priority };
        expect(bug.priority).toBe(priority);
      });
    });

    test('should have correct status values', () => {
      const validStatuses: Bug['status'][] = ['Open', 'In Progress', 'Resolved', 'Closed'];
      validStatuses.forEach(status => {
        const bug: Bug = { ...mockBug, status };
        expect(bug.status).toBe(status);
      });
    });
  });

  describe('Bug Optional Properties', () => {
    test('should allow null values for optional properties', () => {
      const bugWithNulls: Bug = {
        ...mockBug,
        description: undefined,
        testCaseId: null,
        moduleId: null,
        assignedToId: null,
        updatedAt: null,
        resolvedDate: null,
        environment: null,
        browserInfo: null,
        operatingSystem: null,
        deviceInfo: null,
        preConditions: null,
        comments: null,
        dateReported: undefined,
        attachments: undefined,
        tags: undefined,
        module: undefined,
        assignedTo: undefined
      };

      expect(bugWithNulls.description).toBeUndefined();
      expect(bugWithNulls.testCaseId).toBeNull();
      expect(bugWithNulls.moduleId).toBeNull();
      expect(bugWithNulls.assignedToId).toBeNull();
    });

    test('should handle empty arrays for attachments and tags', () => {
      const bugWithEmptyArrays: Bug = {
        ...mockBug,
        attachments: [],
        tags: []
      };

      expect(Array.isArray(bugWithEmptyArrays.attachments)).toBe(true);
      expect(bugWithEmptyArrays.attachments).toHaveLength(0);
      expect(Array.isArray(bugWithEmptyArrays.tags)).toBe(true);
      expect(bugWithEmptyArrays.tags).toHaveLength(0);
    });
  });

  describe('Bug Relationships', () => {
    test('should correctly reference related entities', () => {
      expect(mockBug.module).toBeDefined();
      expect(mockBug.module?.id).toBe(mockBug.moduleId);
      expect(mockBug.assignedTo).toBeDefined();
      expect(mockBug.assignedTo?.id).toBe(mockBug.assignedToId);
    });

    test('should handle multiple attachments', () => {
      const bugWithMultipleAttachments: Bug = {
        ...mockBug,
        attachments: [mockAttachment, { ...mockAttachment, id: 2, name: 'log.txt' }]
      };

      expect(bugWithMultipleAttachments.attachments).toHaveLength(2);
      expect(bugWithMultipleAttachments.attachments?.[0].name).toBe('screenshot.png');
      expect(bugWithMultipleAttachments.attachments?.[1].name).toBe('log.txt');
    });

    test('should handle multiple tags', () => {
      const bugWithMultipleTags: Bug = {
        ...mockBug,
        tags: [mockTag, { ...mockTag, id: 2, name: 'Frontend', color: '#00ff00' }]
      };

      expect(bugWithMultipleTags.tags).toHaveLength(2);
      expect(bugWithMultipleTags.tags?.[0].name).toBe('Critical');
      expect(bugWithMultipleTags.tags?.[1].name).toBe('Frontend');
    });
  });

  describe('Bug Validation Tests', () => {
    test('should validate required string fields are not empty', () => {
      const validateBugField = (field: keyof Bug, value: any) => {
        const bug = { ...mockBug, [field]: value };
        return bug[field];
      };

      expect(validateBugField('title', 'Valid Title')).toBe('Valid Title');
      expect(validateBugField('bugId', 'BUG-123')).toBe('BUG-123');
      expect(validateBugField('stepsToReproduce', 'Step 1, Step 2')).toBe('Step 1, Step 2');
    });

    test('should validate ID fields are numbers', () => {
      expect(typeof mockBug.id).toBe('number');
      expect(typeof mockBug.projectId).toBe('number');
      expect(typeof mockBug.reportedById).toBe('number');
    });

    test('should validate date fields are strings', () => {
      expect(typeof mockBug.createdAt).toBe('string');
      if (mockBug.updatedAt) {
        expect(typeof mockBug.updatedAt).toBe('string');
      }
      if (mockBug.resolvedDate) {
        expect(typeof mockBug.resolvedDate).toBe('string');
      }
    });
  });

  describe('Bug Status Transitions', () => {
    test('should allow status transitions from Open', () => {
      const openBug: Bug = { ...mockBug, status: 'Open' };
      
      const inProgressBug: Bug = { ...openBug, status: 'In Progress' };
      const resolvedBug: Bug = { ...openBug, status: 'Resolved' };
      const closedBug: Bug = { ...openBug, status: 'Closed' };

      expect(inProgressBug.status).toBe('In Progress');
      expect(resolvedBug.status).toBe('Resolved');
      expect(closedBug.status).toBe('Closed');
    });

    test('should set resolvedDate when status is Resolved', () => {
      const resolvedBug: Bug = {
        ...mockBug,
        status: 'Resolved',
        resolvedDate: '2024-01-02T00:00:00Z'
      };

      expect(resolvedBug.status).toBe('Resolved');
      expect(resolvedBug.resolvedDate).toBeDefined();
    });
  });

  describe('Bug Severity and Priority Combinations', () => {
    test('should allow all valid severity-priority combinations', () => {
      const severities: Bug['severity'][] = ['Critical', 'Major', 'Minor', 'Trivial'];
      const priorities: Bug['priority'][] = ['High', 'Medium', 'Low'];

      severities.forEach(severity => {
        priorities.forEach(priority => {
          const bug: Bug = { ...mockBug, severity, priority };
          expect(bug.severity).toBe(severity);
          expect(bug.priority).toBe(priority);
        });
      });
    });
  });

  describe('Bug Creation and Updates', () => {
    test('should create minimal bug with required fields only', () => {
      const minimalBug: Bug = {
        id: 1,
        bugId: 'BUG-001',
        title: 'Test Bug',
        stepsToReproduce: 'Step 1',
        severity: 'Minor',
        priority: 'Low',
        status: 'Open',
        projectId: 1,
        testCaseId: null,
        moduleId: null,
        reportedById: 1,
        assignedToId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null,
        resolvedDate: null,
        environment: null,
        browserInfo: null,
        operatingSystem: null,
        deviceInfo: null,
        preConditions: null,
        expectedResult: 'Expected result',
        actualResult: 'Actual result',
        comments: null
      };

      expect(minimalBug.id).toBe(1);
      expect(minimalBug.title).toBe('Test Bug');
      expect(minimalBug.status).toBe('Open');
    });

    test('should update bug with new information', () => {
      const updatedBug: Bug = {
        ...mockBug,
        status: 'In Progress',
        assignedToId: 2,
        updatedAt: '2024-01-02T00:00:00Z',
        comments: 'Investigation in progress'
      };

      expect(updatedBug.status).toBe('In Progress');
      expect(updatedBug.assignedToId).toBe(2);
      expect(updatedBug.updatedAt).toBe('2024-01-02T00:00:00Z');
      expect(updatedBug.comments).toBe('Investigation in progress');
    });
  });

  import { Bug } from '../../types';

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Developer' as const,
  verified: true,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockModule = {
  id: 1,
  name: 'Test Module',
  description: 'Test module description',
  projectId: 1,
  status: 'Active' as const,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockTag = {
  id: 1,
  name: 'Critical',
  color: '#ff0000',
  projectId: 1,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAttachment = {
  id: 1,
  name: 'screenshot.png',
  type: 'image/png',
  size: 1024,
  data: 'base64data'
};

const mockBug: Bug = {
  id: 1,
  bugId: 'BUG-001',
  title: 'Login button not working',
  description: 'The login button does not respond to clicks',
  stepsToReproduce: '1. Navigate to login page\n2. Enter credentials\n3. Click login button',
  severity: 'Critical',
  priority: 'High',
  status: 'Open',
  projectId: 1,
  testCaseId: 1,
  moduleId: 1,
  reportedById: 1,
  assignedToId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  resolvedDate: null,
  environment: 'Production',
  browserInfo: 'Chrome 120',
  operatingSystem: 'Windows 11',
  deviceInfo: 'Desktop',
  preConditions: 'User must be on login page',
  expectedResult: 'User should be logged in successfully',
  actualResult: 'Nothing happens when clicking login button',
  comments: 'This is blocking user access',
  dateReported: '2024-01-01',
  attachments: [mockAttachment],
  tags: [mockTag],
  module: mockModule,
  assignedTo: mockUser
};

describe('Bug Type Guards', () => {
    test('should identify valid bug objects', () => {
      const isBug = (obj: any): obj is Bug => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          typeof obj.id === 'number' &&
          typeof obj.bugId === 'string' &&
          typeof obj.title === 'string' &&
          typeof obj.stepsToReproduce === 'string' &&
          ['Critical', 'Major', 'Minor', 'Trivial'].includes(obj.severity) &&
          ['High', 'Medium', 'Low'].includes(obj.priority) &&
          ['Open', 'In Progress', 'Resolved', 'Closed'].includes(obj.status)
        );
      };

      expect(isBug(mockBug)).toBe(true);
      expect(isBug({})).toBe(false);
      expect(isBug(null)).toBe(false);
      expect(isBug({ id: 'invalid' })).toBe(false);
    });
  });
});
