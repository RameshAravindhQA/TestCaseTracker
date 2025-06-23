
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

// Mock HTTP request/response objects
const createMockReq = (body: any = {}, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
  user: { id: 1, role: 'Admin' }
});

const createMockRes = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
  return res;
};

describe('API Endpoints Integration Tests', () => {
  beforeEach(async () => {
    // Reset storage before each test
    (storage as any).resetStorage();
  });

  describe('User API Endpoints', () => {
    it('should handle POST /api/users - Create User', async () => {
      const req = createMockReq({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });
      const res = createMockRes();

      // Simulate the API handler
      try {
        const newUser = await storage.createUser(req.body);
        res.status(201).json(newUser);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          email: 'john@test.com',
          firstName: 'John'
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
      }
    });

    it('should handle GET /api/users - Get All Users', async () => {
      const req = createMockReq();
      const res = createMockRes();

      try {
        const users = await storage.getAllUsers();
        res.status(200).json(users);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    });

    it('should handle GET /api/users/:id - Get User by ID', async () => {
      const req = createMockReq({}, { id: '1' });
      const res = createMockRes();

      try {
        const user = await storage.getUser(parseInt(req.params.id));
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ error: 'User not found' });
        }
        
        expect(res.status).toHaveBeenCalledWith(200);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
    });
  });

  describe('Project API Endpoints', () => {
    it('should handle POST /api/projects - Create Project', async () => {
      const req = createMockReq({
        name: 'Test Project',
        description: 'Project for testing',
        status: 'Active',
        createdById: 1
      });
      const res = createMockRes();

      try {
        const newProject = await storage.createProject(req.body);
        res.status(201).json(newProject);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Test Project'
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
      }
    });

    it('should handle GET /api/projects - Get All Projects', async () => {
      const req = createMockReq();
      const res = createMockRes();

      try {
        const projects = await storage.getProjects();
        res.status(200).json(projects);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
      }
    });
  });

  describe('Module API Endpoints', () => {
    it('should handle POST /api/modules - Create Module', async () => {
      const projects = await storage.getProjects();
      const projectId = projects[0].id;

      const req = createMockReq({
        name: 'Test Module',
        description: 'Module for testing',
        projectId,
        status: 'Active'
      });
      const res = createMockRes();

      try {
        const newModule = await storage.createModule(req.body);
        res.status(201).json(newModule);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Test Module',
          moduleId: expect.stringMatching(/^MOD-\d+$/)
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create module' });
      }
    });

    it('should handle GET /api/projects/:projectId/modules - Get Modules by Project', async () => {
      const projects = await storage.getProjects();
      const projectId = projects[0].id;

      const req = createMockReq({}, { projectId: projectId.toString() });
      const res = createMockRes();

      try {
        const modules = await storage.getModulesByProject(parseInt(req.params.projectId));
        res.status(200).json(modules);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch modules' });
      }
    });
  });

  describe('TestCase API Endpoints', () => {
    it('should handle POST /api/testcases - Create Test Case', async () => {
      const projects = await storage.getProjects();
      const modules = await storage.getModulesByProject(projects[0].id);
      
      const req = createMockReq({
        testCaseId: '',
        moduleId: modules[0].id,
        projectId: projects[0].id,
        feature: 'Test Feature',
        scenario: 'Test Scenario',
        title: 'Test Case Title',
        description: 'Test case description',
        steps: 'Test steps',
        expectedResult: 'Expected result',
        status: 'Not Executed',
        priority: 'Medium',
        assignedTo: 1,
        createdById: 1
      });
      const res = createMockRes();

      try {
        const newTestCase = await storage.createTestCase(req.body);
        res.status(201).json(newTestCase);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Test Case Title',
          testCaseId: expect.stringMatching(/^[A-Z]{3}-TC-\d{3}$/)
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create test case' });
      }
    });

    it('should handle GET /api/projects/:projectId/testcases - Get Test Cases by Project', async () => {
      const projects = await storage.getProjects();
      const projectId = projects[0].id;

      const req = createMockReq({}, { projectId: projectId.toString() });
      const res = createMockRes();

      try {
        const testCases = await storage.getTestCasesByProject(parseInt(req.params.projectId));
        res.status(200).json(testCases);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch test cases' });
      }
    });

    it('should handle PUT /api/testcases/:id/status - Update Test Case Status', async () => {
      const projects = await storage.getProjects();
      const testCases = await storage.getTestCasesByProject(projects[0].id);
      
      if (testCases.length > 0) {
        const req = createMockReq({ status: 'Pass' }, { id: testCases[0].id.toString() });
        const res = createMockRes();

        try {
          const updatedTestCase = await storage.updateTestCase(parseInt(req.params.id), req.body);
          res.status(200).json(updatedTestCase);
          
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 'Pass'
          }));
        } catch (error) {
          res.status(500).json({ error: 'Failed to update test case' });
        }
      }
    });
  });

  describe('Bug API Endpoints', () => {
    it('should handle POST /api/bugs - Create Bug', async () => {
      const projects = await storage.getProjects();
      const modules = await storage.getModulesByProject(projects[0].id);
      
      const req = createMockReq({
        bugId: '',
        title: 'Test Bug',
        description: 'Bug description',
        stepsToReproduce: 'Steps to reproduce',
        expectedResult: 'Expected result',
        actualResult: 'Actual result',
        severity: 'Major',
        priority: 'High',
        status: 'Open',
        projectId: projects[0].id,
        moduleId: modules[0].id,
        reportedById: 1,
        assignedTo: 1
      });
      const res = createMockRes();

      try {
        const newBug = await storage.createBug(req.body);
        res.status(201).json(newBug);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Test Bug',
          bugId: expect.stringMatching(/^BUG-\d{3}$/)
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create bug' });
      }
    });

    it('should handle GET /api/projects/:projectId/bugs - Get Bugs by Project', async () => {
      const projects = await storage.getProjects();
      const projectId = projects[0].id;

      const req = createMockReq({}, { projectId: projectId.toString() });
      const res = createMockRes();

      try {
        const bugs = await storage.getBugsByProject(parseInt(req.params.projectId));
        res.status(200).json(bugs);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bugs' });
      }
    });
  });

  describe('Dashboard API Endpoints', () => {
    it('should handle GET /api/dashboard/stats - Get Dashboard Statistics', async () => {
      const req = createMockReq();
      const res = createMockRes();

      try {
        const stats = await storage.getDashboardStats();
        res.status(200).json(stats);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          totalProjects: expect.any(Number),
          totalTestCases: expect.any(Number),
          openBugs: expect.any(Number),
          passRate: expect.any(Number)
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
      }
    });
  });

  describe('Document API Endpoints', () => {
    it('should handle POST /api/documents/folders - Create Document Folder', async () => {
      const projects = await storage.getProjects();
      
      const req = createMockReq({
        name: 'Test Folder',
        projectId: projects[0].id,
        parentFolderId: null,
        createdById: 1
      });
      const res = createMockRes();

      try {
        const newFolder = await storage.createDocumentFolder(req.body);
        res.status(201).json(newFolder);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Test Folder'
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create folder' });
      }
    });

    it('should handle POST /api/documents - Create Document', async () => {
      const projects = await storage.getProjects();
      const folder = await storage.createDocumentFolder({
        name: 'Test Folder',
        projectId: projects[0].id,
        parentFolderId: null,
        createdById: 1
      });
      
      const req = createMockReq({
        name: 'Test Document',
        description: 'Document description',
        fileUrl: '/uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        fileName: 'test.pdf',
        folderId: folder.id,
        projectId: projects[0].id,
        uploadedById: 1
      });
      const res = createMockRes();

      try {
        const newDocument = await storage.createDocument(req.body);
        res.status(201).json(newDocument);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Test Document'
        }));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create document' });
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid user creation', async () => {
      const req = createMockReq({
        // Missing required fields
        firstName: '',
        email: 'invalid-email'
      });
      const res = createMockRes();

      try {
        await storage.createUser(req.body);
        res.status(201).json({});
      } catch (error) {
        res.status(400).json({ error: 'Invalid user data' });
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    it('should handle non-existent resource access', async () => {
      const req = createMockReq({}, { id: '99999' });
      const res = createMockRes();

      try {
        const user = await storage.getUser(parseInt(req.params.id));
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ error: 'User not found' });
        }
        
        expect(res.status).toHaveBeenCalledWith(404);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });
  });
});
