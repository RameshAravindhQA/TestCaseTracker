
import { Bug, User, Module, Project, Tag, FileAttachment, TestCase, Activity, DashboardStats } from '../../types';
import * as TypesIndex from '../../types/index';

describe('Type Exports Tests', () => {
  describe('Direct imports from types.ts', () => {
    test('should export Bug interface', () => {
      const bug: Bug = {
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

      expect(bug).toBeDefined();
      expect(typeof bug.id).toBe('number');
      expect(typeof bug.title).toBe('string');
    });

    test('should export User interface', () => {
      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'Tester',
        createdAt: '2024-01-01'
      };

      expect(user).toBeDefined();
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
    });

    test('should export Module interface', () => {
      const module: Module = {
        id: 1,
        name: 'Test Module',
        description: 'Test description',
        projectId: 1,
        status: 'Active',
        createdAt: '2024-01-01'
      };

      expect(module).toBeDefined();
      expect(typeof module.id).toBe('number');
      expect(typeof module.name).toBe('string');
    });

    test('should export Project interface', () => {
      const project: Project = {
        id: 1,
        name: 'Test Project',
        description: 'Test description',
        status: 'Active',
        createdById: 1,
        createdAt: '2024-01-01'
      };

      expect(project).toBeDefined();
      expect(typeof project.id).toBe('number');
      expect(typeof project.name).toBe('string');
    });
  });

  describe('Re-exports from types/index.ts', () => {
    test('should re-export Bug interface', () => {
      expect(TypesIndex.Bug).toBeDefined();
    });

    test('should re-export User interface', () => {
      expect(TypesIndex.User).toBeDefined();
    });

    test('should re-export Module interface', () => {
      expect(TypesIndex.Module).toBeDefined();
    });

    test('should re-export Project interface', () => {
      expect(TypesIndex.Project).toBeDefined();
    });

    test('should re-export all major interfaces', () => {
      // Test that all major interfaces are available through the index
      const interfaces = [
        'Bug', 'User', 'Module', 'Project', 'Tag', 'FileAttachment', 
        'TestCase', 'Activity', 'DashboardStats'
      ];

      interfaces.forEach(interfaceName => {
        expect(TypesIndex).toHaveProperty(interfaceName);
      });
    });
  });

  describe('Type compatibility tests', () => {
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

    test('should handle complex nested types', () => {
      const complexBug: Bug = {
        id: 1,
        bugId: 'BUG-001',
        title: 'Complex Bug',
        stepsToReproduce: 'Steps',
        severity: 'Critical',
        priority: 'High',
        status: 'Open',
        projectId: 1,
        testCaseId: 1,
        moduleId: 1,
        reportedById: 1,
        assignedToId: 1,
        createdAt: '2024-01-01',
        updatedAt: null,
        resolvedDate: null,
        environment: 'Production',
        browserInfo: 'Chrome',
        operatingSystem: 'Windows',
        deviceInfo: 'Desktop',
        preConditions: 'Prerequisites',
        expectedResult: 'Expected result',
        actualResult: 'Actual result',
        comments: 'Comments',
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
        }],
        module: {
          id: 1,
          name: 'Test Module',
          description: 'Description',
          projectId: 1,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        assignedTo: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Developer',
          createdAt: '2024-01-01'
        }
      };

      expect(complexBug.attachments).toHaveLength(1);
      expect(complexBug.tags).toHaveLength(1);
      expect(complexBug.module).toBeDefined();
      expect(complexBug.assignedTo).toBeDefined();
    });
  });
});
