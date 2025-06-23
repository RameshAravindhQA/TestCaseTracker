import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { storage } from '../storage';

describe('API Comprehensive Tests - In Memory Storage', () => {
  let authCookie: string;
  let testProjectId: number;
  let testUserId: number;

  beforeEach(async () => {
    // Clear in-memory storage
    await storage.clear();

    // Create test user and login
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Admin'
      });

    expect(registerResponse.status).toBe(200);
    testUserId = registerResponse.body.user.id;

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    authCookie = loginResponse.headers['set-cookie'][0];

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({
        name: 'Test Project',
        description: 'Test Description'
      });

    expect(projectResponse.status).toBe(201);
    testProjectId = projectResponse.body.id;
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'new@example.com',
          password: 'password123',
          role: 'Tester'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('new@example.com');
    });

    it('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
    });
  });

  describe('Project Endpoints', () => {
    it('should create a project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: 'New Project',
          description: 'New Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Project');
    });

    it('should get all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testProjectId);
    });

    it('should update project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Project',
          description: 'Updated Description'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Project');
    });

    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
    });
  });

  describe('Module Endpoints', () => {
    let testModuleId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/modules`)
        .set('Cookie', authCookie)
        .send({
          name: 'Test Module',
          description: 'Test Module Description'
        });
      testModuleId = response.body.id;
    });

    it('should create a module', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/modules`)
        .set('Cookie', authCookie)
        .send({
          name: 'New Module',
          description: 'New Module Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Module');
    });

    it('should get modules for project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/modules`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update module', async () => {
      const response = await request(app)
        .put(`/api/modules/${testModuleId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Module',
          description: 'Updated Description'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Module');
    });

    it('should delete module', async () => {
      const response = await request(app)
        .delete(`/api/modules/${testModuleId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
    });
  });

  describe('Test Case Endpoints', () => {
    let testCaseId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/test-cases`)
        .set('Cookie', authCookie)
        .send({
          title: 'Test Case',
          description: 'Test Description',
          preConditions: 'Pre conditions',
          testSteps: 'Test steps',
          expectedResult: 'Expected result',
          priority: 'High',
          status: 'Not Executed'
        });
      testCaseId = response.body.id;
    });

    it('should create a test case', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/test-cases`)
        .set('Cookie', authCookie)
        .send({
          title: 'New Test Case',
          description: 'New Description',
          preConditions: 'Pre conditions',
          testSteps: 'Test steps',
          expectedResult: 'Expected result',
          priority: 'Medium',
          status: 'Not Executed'
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Test Case');
    });

    it('should get test cases for project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/test-cases`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update test case', async () => {
      const response = await request(app)
        .put(`/api/test-cases/${testCaseId}`)
        .set('Cookie', authCookie)
        .send({
          title: 'Updated Test Case',
          status: 'Passed'
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Test Case');
    });

    it('should delete test case', async () => {
      const response = await request(app)
        .delete(`/api/test-cases/${testCaseId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
    });
  });

  describe('Bug Endpoints', () => {
    let testBugId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/bugs`)
        .set('Cookie', authCookie)
        .send({
          title: 'Test Bug',
          severity: 'Major',
          priority: 'High',
          status: 'Open',
          stepsToReproduce: 'Steps to reproduce',
          expectedResult: 'Expected result',
          actualResult: 'Actual result'
        });
      testBugId = response.body.id;
    });

    it('should create a bug', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/bugs`)
        .set('Cookie', authCookie)
        .send({
          title: 'New Bug',
          severity: 'Critical',
          priority: 'High',
          status: 'Open',
          stepsToReproduce: 'Steps to reproduce',
          expectedResult: 'Expected result',
          actualResult: 'Actual result'
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Bug');
    });

    it('should get bugs for project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/bugs`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update bug', async () => {
      const response = await request(app)
        .put(`/api/bugs/${testBugId}`)
        .set('Cookie', authCookie)
        .send({
          title: 'Updated Bug',
          status: 'Resolved'
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Bug');
    });

    it('should delete bug', async () => {
      const response = await request(app)
        .delete(`/api/bugs/${testBugId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
    });
  });

  describe('User Management Endpoints', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    it('should update user', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Cookie', authCookie)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Updated');
    });
  });

  describe('Document Endpoints', () => {
    let testFolderId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/documents/folders')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Folder',
          projectId: testProjectId
        });
      testFolderId = response.body.id;
    });

    it('should create folder', async () => {
      const response = await request(app)
        .post('/api/documents/folders')
        .set('Cookie', authCookie)
        .send({
          name: 'New Folder',
          projectId: testProjectId
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Folder');
    });

    it('should get folders for project', async () => {
      const response = await request(app)
        .get(`/api/documents/folders/${testProjectId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent resources', async () => {
      const response = await request(app)
        .get('/api/projects/99999')
        .set('Cookie', authCookie);

      expect(response.status).toBe(404);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: '' // Empty name should fail validation
        });

      expect(response.status).toBe(400);
    });
  });
});