
import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    (storage as any).initializeDefaultData();
  });

  describe('Test Case ID Generation', () => {
    it('should auto-generate test case ID when not provided', async () => {
      const testCaseData = {
        testCaseId: '',
        moduleId: 1,
        projectId: 1,
        feature: 'Login',
        testObjective: 'Test login functionality',
        testSteps: 'Enter credentials and click login',
        expectedResult: 'User should be logged in',
        status: 'Not Executed' as const,
        priority: 'Medium' as const,
        createdById: 1,
      };

      const createdTestCase = await storage.createTestCase(testCaseData);
      expect(createdTestCase.testCaseId).toBe('TC-001');
    });

    it('should generate sequential test case IDs', async () => {
      const testCaseData = {
        testCaseId: '',
        moduleId: 1,
        projectId: 1,
        feature: 'Login',
        testObjective: 'Test login functionality',
        testSteps: 'Enter credentials and click login',
        expectedResult: 'User should be logged in',
        status: 'Not Executed' as const,
        priority: 'Medium' as const,
        createdById: 1,
      };

      const testCase1 = await storage.createTestCase(testCaseData);
      const testCase2 = await storage.createTestCase(testCaseData);
      const testCase3 = await storage.createTestCase(testCaseData);

      expect(testCase1.testCaseId).toBe('TC-001');
      expect(testCase2.testCaseId).toBe('TC-002');
      expect(testCase3.testCaseId).toBe('TC-003');
    });

    it('should use provided test case ID when given', async () => {
      const testCaseData = {
        testCaseId: 'TC-CUSTOM-001',
        moduleId: 1,
        projectId: 1,
        feature: 'Login',
        testObjective: 'Test login functionality',
        testSteps: 'Enter credentials and click login',
        expectedResult: 'User should be logged in',
        status: 'Not Executed' as const,
        priority: 'Medium' as const,
        createdById: 1,
      };

      const createdTestCase = await storage.createTestCase(testCaseData);
      expect(createdTestCase.testCaseId).toBe('TC-CUSTOM-001');
    });
  });

  describe('Bug ID Generation', () => {
    it('should auto-generate bug ID when not provided', async () => {
      const bugData = {
        bugId: '',
        title: 'Login button not working',
        stepsToReproduce: '1. Click login button',
        expectedResult: 'Should login',
        actualResult: 'Nothing happens',
        severity: 'Major' as const,
        priority: 'High' as const,
        status: 'Open' as const,
        projectId: 1,
        reportedById: 1,
      };

      const createdBug = await storage.createBug(bugData);
      expect(createdBug.bugId).toBe('BUG-001');
    });

    it('should generate sequential bug IDs', async () => {
      const bugData = {
        bugId: '',
        title: 'Login button not working',
        stepsToReproduce: '1. Click login button',
        expectedResult: 'Should login',
        actualResult: 'Nothing happens',
        severity: 'Major' as const,
        priority: 'High' as const,
        status: 'Open' as const,
        projectId: 1,
        reportedById: 1,
      };

      const bug1 = await storage.createBug(bugData);
      const bug2 = await storage.createBug(bugData);
      const bug3 = await storage.createBug(bugData);

      expect(bug1.bugId).toBe('BUG-001');
      expect(bug2.bugId).toBe('BUG-002');
      expect(bug3.bugId).toBe('BUG-003');
    });
  });

  describe('Module Operations', () => {
    it('should create modules with sequential IDs', async () => {
      const moduleData1 = {
        name: 'Authentication Module',
        description: 'Handles authentication',
        projectId: 1,
        status: 'Active' as const,
      };

      const moduleData2 = {
        name: 'Dashboard Module',
        description: 'Handles dashboard',
        projectId: 1,
        status: 'Active' as const,
      };

      const module1 = await storage.createModule(moduleData1);
      const module2 = await storage.createModule(moduleData2);

      expect(module1.id).toBe(2); // First user takes ID 1
      expect(module2.id).toBe(3);
    });
  });

  describe('Dashboard Stats', () => {
    it('should calculate correct dashboard statistics', async () => {
      // Create test data
      const project = await storage.createProject({
        name: 'Test Project',
        description: 'Test project description',
        status: 'Active',
        createdById: 1,
      });

      const module = await storage.createModule({
        name: 'Test Module',
        projectId: project.id,
        status: 'Active',
      });

      // Create test cases
      await storage.createTestCase({
        testCaseId: '',
        moduleId: module.id,
        projectId: project.id,
        feature: 'Feature 1',
        testObjective: 'Test objective',
        testSteps: 'Test steps',
        expectedResult: 'Expected result',
        status: 'Pass',
        priority: 'High',
        createdById: 1,
      });

      await storage.createTestCase({
        testCaseId: '',
        moduleId: module.id,
        projectId: project.id,
        feature: 'Feature 2',
        testObjective: 'Test objective',
        testSteps: 'Test steps',
        expectedResult: 'Expected result',
        status: 'Fail',
        priority: 'Medium',
        createdById: 1,
      });

      // Create bugs
      await storage.createBug({
        bugId: '',
        title: 'Open Bug',
        stepsToReproduce: 'Steps',
        expectedResult: 'Expected',
        actualResult: 'Actual',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: project.id,
        reportedById: 1,
      });

      const stats = await storage.getDashboardStats();
      
      expect(stats.totalProjects).toBe(1);
      expect(stats.totalTestCases).toBe(2);
      expect(stats.openBugs).toBe(1);
      expect(stats.passRate).toBe(50); // 1 pass out of 2 test cases
    });
  });

  describe('User Management', () => {
    it('should get all users correctly', async () => {
      const users = await storage.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(1); // At least the default admin
    });

    it('should create and retrieve user by email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Tester' as const,
        status: 'Active' as const,
      };

      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserByEmail('john@example.com');

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.firstName).toBe('John');
      expect(retrievedUser?.email).toBe('john@example.com');
    });
  });

  describe('Document Management', () => {
    it('should create and retrieve documents', async () => {
      const docData = {
        name: 'Test Document',
        description: 'Test description',
        fileUrl: '/uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        fileName: 'test.pdf',
        folderId: null,
        projectId: 1,
        uploadedById: 1,
      };

      const createdDoc = await storage.createDocument(docData);
      const retrievedDoc = await storage.getDocument(createdDoc.id);

      expect(retrievedDoc).toBeDefined();
      expect(retrievedDoc?.name).toBe('Test Document');
    });

    it('should create and manage document folders', async () => {
      const folderData = {
        name: 'Test Folder',
        projectId: 1,
        parentFolderId: null,
        createdById: 1,
      };

      const createdFolder = await storage.createDocumentFolder(folderData);
      const folders = await storage.getDocumentFolders(1);

      expect(folders.length).toBeGreaterThanOrEqual(1);
      expect(createdFolder.name).toBe('Test Folder');
    });
  });
});

