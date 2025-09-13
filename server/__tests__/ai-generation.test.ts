
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup';

describe('AI Test Case Generation', () => {
  let app: any;
  let testSession: any;
  let projectId: number;

  beforeAll(async () => {
    app = await createTestApp();
    
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

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    testSession = loginResponse.headers['set-cookie'];

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Cookie', testSession)
      .send({
        name: 'Test Project',
        description: 'Test project for AI generation',
        prefix: 'TEST'
      });

    projectId = projectResponse.body.id;
  });

  describe('AI Generation Endpoint', () => {
    it('should return JSON response for valid request', async () => {
      const formData = new FormData();
      formData.append('requirement', 'Registration test case with first last name phone number email id sign up button with both positive and negative test cases');
      formData.append('projectContext', 'User management system');
      formData.append('moduleContext', 'Registration');
      formData.append('testType', 'functional');
      formData.append('priority', 'Medium');
      formData.append('inputType', 'text');

      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .set('Cookie', testSession)
        .send({
          requirement: 'Registration test case with first last name phone number email id sign up button with both positive and negative test cases',
          projectContext: 'User management system',
          moduleContext: 'Registration',
          testType: 'functional',
          priority: 'Medium',
          inputType: 'text'
        });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('testCases');
      expect(Array.isArray(response.body.testCases)).toBe(true);
      expect(response.body.testCases.length).toBeGreaterThan(0);
    });

    it('should handle missing requirement gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .set('Cookie', testSession)
        .send({
          testType: 'functional',
          priority: 'Medium',
          inputType: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate registration-specific test cases', async () => {
      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .set('Cookie', testSession)
        .send({
          requirement: 'User registration with first name, last name, phone number, email, and sign up button',
          moduleContext: 'Registration',
          testType: 'functional',
          priority: 'High',
          inputType: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.testCases).toBeDefined();
      
      // Check for registration-specific test cases
      const testCases = response.body.testCases;
      expect(testCases.some((tc: any) => tc.feature.toLowerCase().includes('registration'))).toBe(true);
      expect(testCases.some((tc: any) => tc.testSteps.toLowerCase().includes('email'))).toBe(true);
      expect(testCases.some((tc: any) => tc.testSteps.toLowerCase().includes('password'))).toBe(true);
    });

    it('should include both positive and negative test cases', async () => {
      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .set('Cookie', testSession)
        .send({
          requirement: 'Registration form with positive and negative test cases',
          moduleContext: 'Registration',
          testType: 'functional',
          priority: 'High',
          inputType: 'text'
        });

      expect(response.status).toBe(200);
      const testCases = response.body.testCases;
      
      // Should have positive (valid data) test cases
      expect(testCases.some((tc: any) => 
        tc.testObjective.toLowerCase().includes('valid') || 
        tc.feature.toLowerCase().includes('valid')
      )).toBe(true);
      
      // Should have negative (invalid data) test cases
      expect(testCases.some((tc: any) => 
        tc.testObjective.toLowerCase().includes('invalid') || 
        tc.feature.toLowerCase().includes('validation') ||
        tc.testObjective.toLowerCase().includes('error')
      )).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .send({
          requirement: 'Test requirement',
          inputType: 'text'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Mock Service Fallback', () => {
    it('should generate mock test cases when Gemini is not available', async () => {
      const response = await request(app)
        .post('/api/ai/generate-enhanced-test-cases')
        .set('Cookie', testSession)
        .send({
          requirement: 'Registration test case',
          moduleContext: 'Registration',
          testType: 'functional',
          priority: 'Medium',
          inputType: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('mock-service');
      expect(response.body.testCases.length).toBeGreaterThan(0);
    });
  });
});
