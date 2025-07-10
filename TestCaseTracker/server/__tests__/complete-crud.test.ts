
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Complete CRUD Operations Test Suite', () => {
  let testProjectId: number;
  let testUserId: number;
  let testModuleId: number;

  beforeEach(async () => {
    // Setup test data
    const testUser = await storage.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'Tester',
      status: 'Active'
    });
    testUserId = testUser.id;

    const testProject = await storage.createProject({
      name: 'Test Project',
      description: 'Test Description',
      status: 'Active',
      createdById: testUserId
    });
    testProjectId = testProject.id;

    const testModule = await storage.createModule({
      name: 'Test Module',
      description: 'Test Module Description',
      projectId: testProjectId,
      status: 'Active'
    });
    testModuleId = testModule.id;
  });

  describe('User CRUD Operations', () => {
    it('should create, read, update, and delete user', async () => {
      // Create
      const newUser = await storage.createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword',
        role: 'Tester',
        status: 'Active'
      });
      expect(newUser).toBeDefined();
      expect(newUser.firstName).toBe('John');

      // Read
      const retrievedUser = await storage.getUser(newUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.email).toBe('john.doe@example.com');

      const userByEmail = await storage.getUserByEmail('john.doe@example.com');
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

  describe('Project CRUD Operations', () => {
    it('should create, read, update, and delete project', async () => {
      // Create
      const newProject = await storage.createProject({
        name: 'New Project',
        description: 'New Project Description',
        status: 'Active',
        createdById: testUserId
      });
      expect(newProject).toBeDefined();
      expect(newProject.name).toBe('New Project');

      // Read
      const retrievedProject = await storage.getProject(newProject.id);
      expect(retrievedProject).toBeDefined();
      expect(retrievedProject?.name).toBe('New Project');

      // Update
      const updatedProject = await storage.updateProject(newProject.id, {
        name: 'Updated Project',
        status: 'Inactive'
      });
      expect(updatedProject).toBeDefined();
      expect(updatedProject?.name).toBe('Updated Project');
      expect(updatedProject?.status).toBe('Inactive');

      // Delete
      const deleted = await storage.deleteProject(newProject.id);
      expect(deleted).toBe(true);
      
      const deletedProject = await storage.getProject(newProject.id);
      expect(deletedProject).toBeUndefined();
    });

    it('should get all projects', async () => {
      const projects = await storage.getProjects();
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);
    });
  });

  describe('Module CRUD Operations', () => {
    it('should create modules with sequential IDs starting from 1', async () => {
      const module1 = await storage.createModule({
        name: 'Module 1',
        description: 'First module',
        projectId: testProjectId,
        status: 'Active'
      });

      const module2 = await storage.createModule({
        name: 'Module 2',
        description: 'Second module',
        projectId: testProjectId,
        status: 'Active'
      });

      expect(module1.moduleId).toBe('MOD-1');
      expect(module2.moduleId).toBe('MOD-2');
    });

    it('should create, read, update, and delete module', async () => {
      // Create
      const newModule = await storage.createModule({
        name: 'New Module',
        description: 'New Module Description',
        projectId: testProjectId,
        status: 'Active'
      });
      expect(newModule).toBeDefined();
      expect(newModule.name).toBe('New Module');

      // Read
      const retrievedModule = await storage.getModule(newModule.id);
      expect(retrievedModule).toBeDefined();
      expect(retrievedModule?.name).toBe('New Module');

      // Update
      const updatedModule = await storage.updateModule(newModule.id, {
        name: 'Updated Module',
        status: 'Inactive'
      });
      expect(updatedModule).toBeDefined();
      expect(updatedModule?.name).toBe('Updated Module');
      expect(updatedModule?.status).toBe('Inactive');

      // Delete
      const deleted = await storage.deleteModule(newModule.id);
      expect(deleted).toBe(true);
      
      const deletedModule = await storage.getModule(newModule.id);
      expect(deletedModule).toBeUndefined();
    });

    it('should get modules by project', async () => {
      const modules = await storage.getModulesByProject(testProjectId);
      expect(modules).toBeInstanceOf(Array);
      expect(modules.length).toBeGreaterThan(0);
    });
  });

  describe('Test Case CRUD Operations', () => {
    it('should create test cases with auto-generated IDs', async () => {
      const testCase1 = await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'Login',
        testObjective: 'Test login functionality',
        testSteps: 'Enter credentials and click login',
        expectedResult: 'User should be logged in',
        status: 'Not Executed',
        priority: 'Medium',
        createdById: testUserId
      });

      const testCase2 = await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'Logout',
        testObjective: 'Test logout functionality',
        testSteps: 'Click logout button',
        expectedResult: 'User should be logged out',
        status: 'Not Executed',
        priority: 'Medium',
        createdById: testUserId
      });

      expect(testCase1.testCaseId).toBe('TC-001');
      expect(testCase2.testCaseId).toBe('TC-002');
    });

    it('should create, read, update, and delete test case', async () => {
      // Create
      const newTestCase = await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'Registration',
        testObjective: 'Test user registration',
        testSteps: 'Fill form and submit',
        expectedResult: 'User should be registered',
        status: 'Not Executed',
        priority: 'High',
        createdById: testUserId
      });
      expect(newTestCase).toBeDefined();
      expect(newTestCase.feature).toBe('Registration');

      // Read
      const retrievedTestCase = await storage.getTestCase(newTestCase.id);
      expect(retrievedTestCase).toBeDefined();
      expect(retrievedTestCase?.feature).toBe('Registration');

      // Update
      const updatedTestCase = await storage.updateTestCase(newTestCase.id, {
        status: 'Pass',
        priority: 'Low'
      });
      expect(updatedTestCase).toBeDefined();
      expect(updatedTestCase?.status).toBe('Pass');
      expect(updatedTestCase?.priority).toBe('Low');

      // Delete
      const deleted = await storage.deleteTestCase(newTestCase.id);
      expect(deleted).toBe(true);
      
      const deletedTestCase = await storage.getTestCase(newTestCase.id);
      expect(deletedTestCase).toBeUndefined();
    });

    it('should get test cases by project', async () => {
      const testCases = await storage.getTestCasesByProject(testProjectId);
      expect(testCases).toBeInstanceOf(Array);
    });
  });

  describe('Bug CRUD Operations', () => {
    it('should create bugs with auto-generated IDs', async () => {
      const bug1 = await storage.createBug({
        bugId: '',
        title: 'Login button not working',
        stepsToReproduce: '1. Click login button',
        expectedResult: 'Should login',
        actualResult: 'Nothing happens',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: testProjectId,
        reportedById: testUserId
      });

      const bug2 = await storage.createBug({
        bugId: '',
        title: 'Page loading slowly',
        stepsToReproduce: '1. Navigate to page',
        expectedResult: 'Should load quickly',
        actualResult: 'Takes too long',
        severity: 'Minor',
        priority: 'Low',
        status: 'Open',
        projectId: testProjectId,
        reportedById: testUserId
      });

      expect(bug1.bugId).toBe('BUG-001');
      expect(bug2.bugId).toBe('BUG-002');
    });

    it('should create, read, update, and delete bug', async () => {
      // Create
      const newBug = await storage.createBug({
        bugId: '',
        title: 'Form validation error',
        stepsToReproduce: '1. Submit empty form',
        expectedResult: 'Should show validation message',
        actualResult: 'Form submits with empty data',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: testProjectId,
        reportedById: testUserId
      });
      expect(newBug).toBeDefined();
      expect(newBug.title).toBe('Form validation error');

      // Read
      const retrievedBug = await storage.getBug(newBug.id);
      expect(retrievedBug).toBeDefined();
      expect(retrievedBug?.title).toBe('Form validation error');

      // Update
      const updatedBug = await storage.updateBug(newBug.id, {
        status: 'Resolved',
        severity: 'Minor'
      });
      expect(updatedBug).toBeDefined();
      expect(updatedBug?.status).toBe('Resolved');
      expect(updatedBug?.severity).toBe('Minor');

      // Delete
      const deleted = await storage.deleteBug(newBug.id);
      expect(deleted).toBe(true);
      
      const deletedBug = await storage.getBug(newBug.id);
      expect(deletedBug).toBeUndefined();
    });

    it('should get bugs by project', async () => {
      const bugs = await storage.getBugsByProject(testProjectId);
      expect(bugs).toBeInstanceOf(Array);
    });
  });

  describe('Document CRUD Operations', () => {
    it('should create, read, update, and delete document', async () => {
      // Create
      const newDocument = await storage.createDocument({
        name: 'Test Document',
        description: 'Test document description',
        fileUrl: '/uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        fileName: 'test.pdf',
        folderId: null,
        projectId: testProjectId,
        uploadedById: testUserId
      });
      expect(newDocument).toBeDefined();
      expect(newDocument.name).toBe('Test Document');

      // Read
      const retrievedDocument = await storage.getDocument(newDocument.id);
      expect(retrievedDocument).toBeDefined();
      expect(retrievedDocument?.name).toBe('Test Document');

      // Update
      const updatedDocument = await storage.updateDocument(newDocument.id, {
        name: 'Updated Document',
        description: 'Updated description'
      });
      expect(updatedDocument).toBeDefined();
      expect(updatedDocument?.name).toBe('Updated Document');

      // Delete
      const deleted = await storage.deleteDocument(newDocument.id);
      expect(deleted).toBe(true);
      
      const deletedDocument = await storage.getDocument(newDocument.id);
      expect(deletedDocument).toBeUndefined();
    });
  });

  describe('Customer CRUD Operations', () => {
    it('should create, read, update, and delete customer', async () => {
      // Create
      const newCustomer = await storage.createCustomer({
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '1234567890',
        company: 'Test Company',
        status: 'Active'
      });
      expect(newCustomer).toBeDefined();
      expect(newCustomer.name).toBe('Test Customer');

      // Read
      const retrievedCustomer = await storage.getCustomer(newCustomer.id);
      expect(retrievedCustomer).toBeDefined();
      expect(retrievedCustomer?.name).toBe('Test Customer');

      // Update
      const updatedCustomer = await storage.updateCustomer(newCustomer.id, {
        name: 'Updated Customer',
        status: 'Inactive'
      });
      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer?.name).toBe('Updated Customer');

      // Delete
      const deleted = await storage.deleteCustomer(newCustomer.id);
      expect(deleted).toBe(true);
      
      const deletedCustomer = await storage.getCustomer(newCustomer.id);
      expect(deletedCustomer).toBeUndefined();
    });

    it('should get all customers', async () => {
      const customers = await storage.getCustomers();
      expect(customers).toBeInstanceOf(Array);
    });
  });

  describe('Dashboard Stats', () => {
    it('should calculate correct dashboard statistics', async () => {
      // Create test data
      await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'Feature 1',
        testObjective: 'Test objective',
        testSteps: 'Test steps',
        expectedResult: 'Expected result',
        status: 'Pass',
        priority: 'High',
        createdById: testUserId
      });

      await storage.createTestCase({
        testCaseId: '',
        moduleId: testModuleId,
        projectId: testProjectId,
        feature: 'Feature 2',
        testObjective: 'Test objective',
        testSteps: 'Test steps',
        expectedResult: 'Expected result',
        status: 'Fail',
        priority: 'Medium',
        createdById: testUserId
      });

      await storage.createBug({
        bugId: '',
        title: 'Open Bug',
        stepsToReproduce: 'Steps',
        expectedResult: 'Expected',
        actualResult: 'Actual',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: testProjectId,
        reportedById: testUserId
      });

      const stats = await storage.getDashboardStats();
      
      expect(stats.totalProjects).toBeGreaterThanOrEqual(1);
      expect(stats.totalTestCases).toBeGreaterThanOrEqual(2);
      expect(stats.openBugs).toBeGreaterThanOrEqual(1);
      expect(typeof stats.passRate).toBe('number');
      expect(stats.passRate).toBeGreaterThanOrEqual(0);
      expect(stats.passRate).toBeLessThanOrEqual(100);
    });
  });
});
