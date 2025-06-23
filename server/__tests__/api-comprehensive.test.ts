
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';
import type { 
  User, Project, Module, TestCase, Bug, Document, DocumentFolder,
  Customer, Tag, KanbanColumn, KanbanCard, CustomMarker, MatrixCell
} from '../../shared/schema';

describe('Comprehensive API Tests with In-Memory Storage', () => {
  let testUserId: number;
  let testProjectId: number;
  let testModuleId: number;

  beforeEach(async () => {
    // Reset storage before each test
    (storage as any).resetStorage();

    // Get the default admin user for testing
    const users = await storage.getAllUsers();
    testUserId = users[0].id;

    // Get the default project for testing
    const projects = await storage.getProjects();
    testProjectId = projects[0].id;

    // Get a module for testing
    const modules = await storage.getModulesByProject(testProjectId);
    testModuleId = modules[0].id;
  });

  describe('User API Tests', () => {
    it('should create, read, update, and delete users', async () => {
      // Create
      const newUser = await storage.createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'hashedpassword',
        role: 'Tester',
        status: 'Active'
      });

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('john.doe@test.com');
      expect(newUser.id).toBeGreaterThan(0);

      // Read
      const fetchedUser = await storage.getUser(newUser.id);
      expect(fetchedUser).toBeDefined();
      expect(fetchedUser?.email).toBe('john.doe@test.com');

      const userByEmail = await storage.getUserByEmail('john.doe@test.com');
      expect(userByEmail).toBeDefined();
      expect(userByEmail?.id).toBe(newUser.id);

      // Update
      const updatedUser = await storage.updateUser(newUser.id, {
        firstName: 'Jane',
        status: 'Inactive'
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('Jane');
      expect(updatedUser?.status).toBe('Inactive');

      // Delete
      const deleted = await storage.deleteUser(newUser.id);
      expect(deleted).toBe(true);

      const deletedUser = await storage.getUser(newUser.id);
      expect(deletedUser).toBeUndefined();
    });

    it('should get all users', async () => {
      const users = await storage.getAllUsers();
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('Project API Tests', () => {
    it('should create, read, update, and delete projects', async () => {
      // Create
      const newProject = await storage.createProject({
        name: 'Test Project API',
        description: 'Test project for API testing',
        status: 'Active',
        createdById: testUserId
      });

      expect(newProject).toBeDefined();
      expect(newProject.name).toBe('Test Project API');

      // Read
      const fetchedProject = await storage.getProject(newProject.id);
      expect(fetchedProject).toBeDefined();
      expect(fetchedProject?.name).toBe('Test Project API');

      // Update
      const updatedProject = await storage.updateProject(newProject.id, {
        name: 'Updated Test Project',
        status: 'Inactive'
      });
      expect(updatedProject).toBeDefined();
      expect(updatedProject?.name).toBe('Updated Test Project');

      // Delete
      const deleted = await storage.deleteProject(newProject.id);
      expect(deleted).toBe(true);
    });

    it('should get all projects', async () => {
      const projects = await storage.getProjects();
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);
    });
  });

  describe('Module API Tests', () => {
    it('should create modules with auto-generated IDs', async () => {
      const newModule = await storage.createModule({
        name: 'API Test Module',
        description: 'Module for API testing',
        projectId: testProjectId,
        status: 'Active'
      });

      expect(newModule).toBeDefined();
      expect(newModule.name).toBe('API Test Module');
      expect(newModule.moduleId).toMatch(/^MOD-\d+$/);
    });

    it('should get modules by project', async () => {
      const modules = await storage.getModulesByProject(testProjectId);
      expect(modules).toBeInstanceOf(Array);
      expect(modules.length).toBeGreaterThan(0);
    });

    it('should update and delete modules', async () => {
      const newModule = await storage.createModule({
        name: 'Delete Test Module',
        projectId: testProjectId,
        status: 'Active'
      });

      // Update
      const updatedModule = await storage.updateModule(newModule.id, {
        name: 'Updated Module Name'
      });
      expect(updatedModule?.name).toBe('Updated Module Name');

      // Delete
      const deleted = await storage.deleteModule(newModule.id);
      expect(deleted).toBe(true);
    });
  });

  describe('TestCase API Tests', () => {
    it('should create test cases with auto-generated IDs', async () => {
      const newTestCase = await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'API Testing',
        scenario: 'Test scenario',
        title: 'API Test Case',
        description: 'Test case for API testing',
        steps: '1. Create test case\n2. Verify creation',
        expectedResult: 'Test case should be created',
        status: 'Not Executed',
        priority: 'Medium',
        assignedTo: testUserId,
        createdById: testUserId
      });

      expect(newTestCase).toBeDefined();
      expect(newTestCase.testCaseId).toMatch(/^[A-Z]{3}-TC-\d{3}$/);
      expect(newTestCase.title).toBe('API Test Case');
    });

    it('should get test cases by project and module', async () => {
      const testCases = await storage.getTestCasesByProject(testProjectId);
      expect(testCases).toBeInstanceOf(Array);

      const moduleTestCases = await storage.getTestCases(testProjectId, testModuleId);
      expect(moduleTestCases).toBeInstanceOf(Array);
    });

    it('should update test case status', async () => {
      const testCases = await storage.getTestCasesByProject(testProjectId);
      if (testCases.length > 0) {
        const updated = await storage.updateTestCase(testCases[0].id, {
          status: 'Pass'
        });
        expect(updated?.status).toBe('Pass');
      }
    });
  });

  describe('Bug API Tests', () => {
    it('should create bugs with auto-generated IDs', async () => {
      const newBug = await storage.createBug({
        bugId: '',
        title: 'API Test Bug',
        description: 'Bug for API testing',
        stepsToReproduce: '1. Reproduce bug\n2. Verify issue',
        expectedResult: 'Should work correctly',
        actualResult: 'Bug occurs',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: testProjectId,
        moduleId: testModuleId,
        reportedById: testUserId,
        assignedTo: testUserId
      });

      expect(newBug).toBeDefined();
      expect(newBug.bugId).toMatch(/^BUG-\d{3}$/);
      expect(newBug.title).toBe('API Test Bug');
    });

    it('should get bugs by project', async () => {
      const bugs = await storage.getBugsByProject(testProjectId);
      expect(bugs).toBeInstanceOf(Array);
    });

    it('should update bug status', async () => {
      const bugs = await storage.getBugsByProject(testProjectId);
      if (bugs.length > 0) {
        const updated = await storage.updateBug(bugs[0].id, {
          status: 'Resolved'
        });
        expect(updated?.status).toBe('Resolved');
      }
    });
  });

  describe('Document API Tests', () => {
    it('should create and manage document folders', async () => {
      const newFolder = await storage.createDocumentFolder({
        name: 'API Test Folder',
        projectId: testProjectId,
        parentFolderId: null,
        createdById: testUserId
      });

      expect(newFolder).toBeDefined();
      expect(newFolder.name).toBe('API Test Folder');

      const folders = await storage.getDocumentFolders(testProjectId);
      expect(folders.length).toBeGreaterThanOrEqual(1);
    });

    it('should create and manage documents', async () => {
      const folder = await storage.createDocumentFolder({
        name: 'Test Folder',
        projectId: testProjectId,
        parentFolderId: null,
        createdById: testUserId
      });

      const newDocument = await storage.createDocument({
        name: 'API Test Document',
        description: 'Document for API testing',
        fileUrl: '/uploads/test-doc.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        fileName: 'test-doc.pdf',
        folderId: folder.id,
        projectId: testProjectId,
        uploadedById: testUserId
      });

      expect(newDocument).toBeDefined();
      expect(newDocument.name).toBe('API Test Document');

      const documents = await storage.getDocuments(testProjectId, folder.id);
      expect(documents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Customer API Tests', () => {
    it('should create and manage customers', async () => {
      const newCustomer = await storage.createCustomer({
        name: 'API Test Customer',
        email: 'customer@test.com',
        contactPerson: 'John Customer',
        phone: '+1234567890',
        address: '123 Test Street',
        status: 'Active',
        createdById: testUserId
      });

      expect(newCustomer).toBeDefined();
      expect(newCustomer.name).toBe('API Test Customer');

      const customers = await storage.getCustomers();
      expect(customers).toBeInstanceOf(Array);
      expect(customers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tag API Tests', () => {
    it('should create and manage tags', async () => {
      const newTag = await storage.createTag({
        name: 'api-test',
        color: '#ff0000',
        projectId: testProjectId,
        createdById: testUserId
      });

      expect(newTag).toBeDefined();
      expect(newTag.name).toBe('api-test');

      const tags = await storage.getTags();
      expect(tags).toBeInstanceOf(Array);
    });
  });

  describe('Kanban API Tests', () => {
    it('should create and manage kanban columns and cards', async () => {
      // Create column
      const newColumn = await storage.createKanbanColumn({
        name: 'API Test Column',
        projectId: testProjectId,
        position: 1,
        color: '#0066cc'
      });

      expect(newColumn).toBeDefined();
      expect(newColumn.name).toBe('API Test Column');

      // Create card
      const newCard = await storage.createKanbanCard({
        title: 'API Test Card',
        description: 'Test card for API',
        columnId: newColumn.id,
        projectId: testProjectId,
        position: 1,
        assignedTo: testUserId,
        createdById: testUserId
      });

      expect(newCard).toBeDefined();
      expect(newCard.title).toBe('API Test Card');

      const cards = await storage.getKanbanCards(newColumn.id);
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TimeSheet API Tests', () => {
    it('should create and manage timesheets', async () => {
      const newTimeSheet = await storage.createTimeSheet({
        userId: testUserId,
        projectId: testProjectId,
        date: new Date(),
        hoursWorked: 8,
        description: 'API testing work',
        status: 'Draft'
      });

      expect(newTimeSheet).toBeDefined();
      expect(newTimeSheet.hoursWorked).toBe(8);

      const timeSheets = await storage.getTimeSheets(testProjectId, testUserId);
      expect(timeSheets).toBeInstanceOf(Array);
    });
  });

  describe('Matrix API Tests', () => {
    it('should create and manage matrix cells', async () => {
      const modules = await storage.getModulesByProject(testProjectId);
      if (modules.length >= 2) {
        const newCell = await storage.upsertMatrixCell({
          projectId: testProjectId,
          rowModuleId: modules[0].id,
          colModuleId: modules[1].id,
          value: 'Test dependency',
          cellType: 'dependency'
        });

        expect(newCell).toBeDefined();
        expect(newCell.value).toBe('Test dependency');
      }
    });
  });

  describe('Custom Marker API Tests', () => {
    it('should create and manage custom markers', async () => {
      const newMarker = await storage.createCustomMarker({
        markerId: 'TEST-001',
        name: 'API Test Marker',
        description: 'Marker for API testing',
        color: '#00ff00',
        projectId: testProjectId,
        createdById: testUserId
      });

      expect(newMarker).toBeDefined();
      expect(newMarker.name).toBe('API Test Marker');

      const markers = await storage.getCustomMarkers();
      expect(markers).toBeInstanceOf(Array);
    });
  });

  describe('Dashboard Stats API Tests', () => {
    it('should calculate dashboard statistics', async () => {
      const stats = await storage.getDashboardStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalProjects).toBe('number');
      expect(typeof stats.totalTestCases).toBe('number');
      expect(typeof stats.openBugs).toBe('number');
      expect(typeof stats.passRate).toBe('number');
      expect(stats.passRate).toBeGreaterThanOrEqual(0);
      expect(stats.passRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Test Sheets API Tests', () => {
    it('should create and manage test sheets', async () => {
      const newTestSheet = await storage.createTestSheet({
        name: 'API Test Sheet',
        projectId: testProjectId,
        data: {
          rows: [
            { testCaseId: 'TC-001', status: 'Pass', notes: 'Test passed' }
          ]
        },
        metadata: {
          version: 1,
          lastModifiedBy: testUserId
        },
        createdById: testUserId
      });

      expect(newTestSheet).toBeDefined();
      expect(newTestSheet.name).toBe('API Test Sheet');

      const testSheets = await storage.getTestSheets(testProjectId);
      expect(testSheets).toBeInstanceOf(Array);
    });
  });

  describe('GitHub Integration API Tests', () => {
    it('should manage GitHub configurations', async () => {
      const newConfig = await storage.createGitHubConfig({
        projectId: testProjectId,
        repositoryOwner: 'testowner',
        repositoryName: 'testrepo',
        accessToken: 'test-token',
        isActive: true,
        createdById: testUserId
      });

      expect(newConfig).toBeDefined();
      expect(newConfig.repositoryOwner).toBe('testowner');

      const config = await storage.getGitHubConfig(testProjectId);
      expect(config).toBeDefined();
    });

    it('should manage GitHub issues', async () => {
      const newIssue = await storage.createGitHubIssue({
        bugId: 1,
        githubIssueId: 123,
        issueNumber: 1,
        title: 'Test GitHub Issue',
        status: 'open',
        createdById: testUserId
      });

      expect(newIssue).toBeDefined();
      expect(newIssue.title).toBe('Test GitHub Issue');
    });
  });

  describe('Activity Tracking API Tests', () => {
    it('should track activities', async () => {
      const newActivity = await storage.createActivity({
        entityType: 'test_case',
        action: 'created',
        entityId: 1,
        userId: testUserId,
        details: {
          entityType: 'test_case',
          action: 'created',
          entityId: 1
        }
      });

      expect(newActivity).toBeDefined();
      expect(newActivity.action).toBe('created');

      const activities = await storage.getActivities(10);
      expect(activities).toBeInstanceOf(Array);
    });
  });

  describe('Data Export API Tests', () => {
    it('should export project data to CSV format', async () => {
      const csvData = await storage.exportProjectsCSV();
      expect(csvData).toBeInstanceOf(Array);
      expect(csvData.length).toBeGreaterThan(0);
      
      if (csvData.length > 0) {
        const firstProject = csvData[0];
        expect(firstProject).toHaveProperty('projectId');
        expect(firstProject).toHaveProperty('projectName');
        expect(firstProject).toHaveProperty('totalModules');
        expect(firstProject).toHaveProperty('totalTestCases');
        expect(firstProject).toHaveProperty('totalBugs');
      }
    });
  });

  describe('Sprint API Tests', () => {
    it('should create and manage sprints', async () => {
      const newSprint = await storage.createSprint({
        name: 'API Test Sprint',
        description: 'Sprint for API testing',
        projectId: testProjectId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        status: 'Active',
        createdById: testUserId
      });

      expect(newSprint).toBeDefined();
      expect(newSprint.name).toBe('API Test Sprint');

      const sprints = await storage.getSprints(testProjectId);
      expect(sprints).toBeInstanceOf(Array);
    });
  });
});
