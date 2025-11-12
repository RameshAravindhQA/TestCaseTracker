
// Complete Type Exports Test Suite
import { 
  Bug, 
  User, 
  Project, 
  ProjectMember,
  Module, 
  Tag, 
  FileAttachment, 
  TestCase,
  Activity,
  DashboardStats,
  PaginatedResponse,
  CSVTestCase,
  Document,
  DocumentFolder,
  FormattedActivity
} from '../../types';

import * as TypesIndex from '../../types/index';

describe('Complete Type Exports Test Suite', () => {
  
  describe('Bug Interface Tests', () => {
    test('should create valid Bug object with all required fields', () => {
      const bug: Bug = {
        id: 1,
        bugId: 'BUG-001',
        title: 'Test Bug',
        stepsToReproduce: 'Steps to reproduce',
        severity: 'Critical',
        priority: 'High',
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

      expect(bug).toBeDefined();
      expect(bug.id).toBe(1);
      expect(bug.bugId).toBe('BUG-001');
      expect(bug.severity).toBe('Critical');
      expect(bug.priority).toBe('High');
      expect(bug.status).toBe('Open');
    });

    test('should create Bug with optional fields', () => {
      const bugWithOptionals: Bug = {
        id: 2,
        bugId: 'BUG-002',
        title: 'Complex Bug',
        description: 'Detailed description',
        stepsToReproduce: 'Complex steps',
        severity: 'Major',
        priority: 'Medium',
        status: 'In Progress',
        projectId: 2,
        testCaseId: 1,
        moduleId: 1,
        reportedById: 2,
        assignedToId: 3,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T12:00:00Z',
        resolvedDate: null,
        environment: 'Production',
        browserInfo: 'Chrome 120',
        operatingSystem: 'Windows 11',
        deviceInfo: 'Desktop',
        preConditions: 'User logged in',
        expectedResult: 'Feature works correctly',
        actualResult: 'Feature fails',
        comments: 'Needs investigation',
        dateReported: '2024-01-02',
        attachments: [{
          id: 1,
          name: 'screenshot.png',
          type: 'image/png',
          size: 1024
        }],
        tags: [{
          id: 1,
          name: 'Critical',
          color: '#ff0000'
        }]
      };

      expect(bugWithOptionals.description).toBe('Detailed description');
      expect(bugWithOptionals.attachments).toHaveLength(1);
      expect(bugWithOptionals.tags).toHaveLength(1);
    });
  });

  describe('User Interface Tests', () => {
    test('should create valid User object', () => {
      const user: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Tester',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z'
      };

      expect(user).toBeDefined();
      expect(user.role).toBe('Tester');
      expect(user.verified).toBe(true);
    });

    test('should handle all user roles', () => {
      const roles: Array<User['role']> = ['Tester', 'Developer', 'Admin'];
      
      roles.forEach(role => {
        const user: User = {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: role,
          createdAt: '2024-01-01T00:00:00Z'
        };
        expect(user.role).toBe(role);
      });
    });
  });

  describe('TestCase Interface Tests', () => {
    test('should create valid TestCase object', () => {
      const testCase: TestCase = {
        id: 1,
        testCaseId: 'TC-001',
        moduleId: 1,
        projectId: 1,
        feature: 'Login',
        testObjective: 'Verify login functionality',
        preConditions: 'User exists',
        testSteps: '1. Enter credentials\n2. Click login',
        expectedResult: 'User logged in',
        actualResult: null,
        status: 'Not Executed',
        priority: 'High',
        comments: null,
        createdById: 1,
        assignedToId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      };

      expect(testCase).toBeDefined();
      expect(testCase.status).toBe('Not Executed');
      expect(testCase.priority).toBe('High');
    });

    test('should handle all test case statuses', () => {
      const statuses: Array<TestCase['status']> = ['Pass', 'Fail', 'Blocked', 'Not Executed'];
      
      statuses.forEach(status => {
        const testCase: Partial<TestCase> = {
          status: status
        };
        expect(testCase.status).toBe(status);
      });
    });
  });

  describe('Project Interface Tests', () => {
    test('should create valid Project object', () => {
      const project: Project = {
        id: 1,
        name: 'Test Project',
        description: 'Project description',
        status: 'Active',
        createdById: 1,
        createdAt: '2024-01-01T00:00:00Z',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      expect(project).toBeDefined();
      expect(project.status).toBe('Active');
    });
  });

  describe('Module Interface Tests', () => {
    test('should create valid Module object', () => {
      const module: Module = {
        id: 1,
        name: 'Authentication Module',
        description: 'User authentication',
        projectId: 1,
        status: 'Active',
        createdAt: '2024-01-01T00:00:00Z'
      };

      expect(module).toBeDefined();
      expect(module.projectId).toBe(1);
    });
  });

  describe('Activity Interface Tests', () => {
    test('should create valid Activity object', () => {
      const activity: Activity = {
        id: 1,
        projectId: 1,
        entityType: 'bug',
        entityId: 1,
        action: 'created',
        details: { bugId: 'BUG-001' },
        userId: 1,
        timestamp: '2024-01-01T00:00:00Z'
      };

      expect(activity).toBeDefined();
      expect(activity.entityType).toBe('bug');
      expect(activity.action).toBe('created');
    });
  });

  describe('FormattedActivity Interface Tests', () => {
    test('should create valid FormattedActivity object', () => {
      const formattedActivity: FormattedActivity = {
        id: 1,
        projectId: 1,
        entityType: 'bug',
        entityId: 1,
        action: 'created',
        details: { bugId: 'BUG-001' },
        userId: 1,
        timestamp: '2024-01-01T00:00:00Z',
        formattedMessage: 'Created bug BUG-001',
        iconColor: 'green',
        iconName: 'plus',
        timeAgo: '2 hours ago'
      };

      expect(formattedActivity).toBeDefined();
      expect(formattedActivity.formattedMessage).toBe('Created bug BUG-001');
      expect(formattedActivity.timeAgo).toBe('2 hours ago');
    });
  });

  describe('DashboardStats Interface Tests', () => {
    test('should create valid DashboardStats object', () => {
      const stats: DashboardStats = {
        totalProjects: 5,
        totalTestCases: 100,
        totalModules: 10,
        totalBugs: 25,
        openBugs: 10,
        passRate: 85.5,
        totalDocuments: 15,
        testCaseStatusCounts: {
          passed: 60,
          failed: 20,
          blocked: 5,
          notExecuted: 15
        },
        bugSeverityCounts: {
          low: 10,
          medium: 8,
          high: 5,
          critical: 2
        },
        bugStatusCounts: {
          open: 10,
          inProgress: 8,
          resolved: 5,
          closed: 2
        }
      };

      expect(stats).toBeDefined();
      expect(stats.totalProjects).toBe(5);
      expect(stats.passRate).toBe(85.5);
      expect(stats.testCaseStatusCounts?.passed).toBe(60);
    });
  });

  describe('Type Re-exports from Index', () => {
    test('should re-export Bug from index', () => {
      expect(TypesIndex.Bug).toBeDefined();
      
      const bug: TypesIndex.Bug = {
        id: 1,
        bugId: 'BUG-001',
        title: 'Test Bug',
        stepsToReproduce: 'Steps',
        severity: 'Critical',
        priority: 'High',
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
        expectedResult: 'Expected',
        actualResult: 'Actual',
        comments: null
      };

      expect(bug).toBeDefined();
    });

    test('should re-export all major interfaces from index', () => {
      const expectedExports = [
        'Bug', 'User', 'Project', 'ProjectMember', 'Module', 
        'Tag', 'FileAttachment', 'TestCase', 'Activity',
        'DashboardStats', 'PaginatedResponse', 'CSVTestCase',
        'Document', 'DocumentFolder', 'FormattedActivity'
      ];

      expectedExports.forEach(exportName => {
        expect(TypesIndex).toHaveProperty(exportName);
      });
    });
  });

  describe('Type Compatibility Tests', () => {
    test('Bug from direct import should be compatible with Bug from index', () => {
      const directBug: Bug = {
        id: 1,
        bugId: 'BUG-001',
        title: 'Test Bug',
        stepsToReproduce: 'Steps',
        severity: 'Minor',
        priority: 'Low',
        status: 'Open',
        projectId: 1,
        testCaseId: null,
        moduleId: null,
        reportedById: 1,
        assignedToId: null,
        createdAt: '2024-01-01',
        updatedAt: null,
        resolvedDate: null,
        environment: null,
        browserInfo: null,
        operatingSystem: null,
        deviceInfo: null,
        preConditions: null,
        expectedResult: 'Expected',
        actualResult: 'Actual',
        comments: null
      };

      const indexBug: TypesIndex.Bug = directBug;
      expect(indexBug).toEqual(directBug);
    });

    test('User from direct import should be compatible with User from index', () => {
      const directUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'Tester',
        createdAt: '2024-01-01'
      };

      const indexUser: TypesIndex.User = directUser;
      expect(indexUser).toEqual(directUser);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle nullable and optional fields correctly', () => {
      const minimalBug: Bug = {
        id: 1,
        bugId: 'BUG-MIN',
        title: 'Minimal Bug',
        stepsToReproduce: 'Step 1',
        severity: 'Trivial',
        priority: 'Low',
        status: 'Closed',
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
        expectedResult: 'Minimal expected',
        actualResult: 'Minimal actual',
        comments: null
      };

      expect(minimalBug.testCaseId).toBeNull();
      expect(minimalBug.moduleId).toBeNull();
      expect(minimalBug.assignedToId).toBeNull();
      expect(minimalBug.updatedAt).toBeNull();
    });

    test('should handle complex nested objects', () => {
      const complexBug: Bug = {
        id: 1,
        bugId: 'BUG-COMPLEX',
        title: 'Complex Bug',
        stepsToReproduce: 'Complex steps',
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
        browserInfo: 'Chrome',
        operatingSystem: 'Windows',
        deviceInfo: 'Desktop',
        preConditions: 'Prerequisites',
        expectedResult: 'Expected result',
        actualResult: 'Actual result',
        comments: 'Comments',
        attachments: [
          {
            id: 1,
            name: 'screenshot.png',
            type: 'image/png',
            size: 1024,
            data: 'base64data'
          },
          {
            id: 2,
            name: 'log.txt',
            type: 'text/plain',
            size: 512,
            data: 'log content'
          }
        ],
        tags: [
          {
            id: 1,
            name: 'Critical',
            color: '#ff0000',
            projectId: 1
          },
          {
            id: 2,
            name: 'UI',
            color: '#00ff00',
            projectId: 1
          }
        ],
        module: {
          id: 1,
          name: 'Test Module',
          description: 'Description',
          projectId: 1,
          status: 'Active',
          createdAt: '2024-01-01T00:00:00Z'
        },
        assignedTo: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z'
        }
      };

      expect(complexBug.attachments).toHaveLength(2);
      expect(complexBug.tags).toHaveLength(2);
      expect(complexBug.module?.name).toBe('Test Module');
      expect(complexBug.assignedTo?.name).toBe('John Doe');
    });
  });
});
