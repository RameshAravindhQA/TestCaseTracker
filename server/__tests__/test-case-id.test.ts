
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Test Case ID Generation', () => {
  beforeEach(async () => {
    // Clear existing data and create test project
    await storage.createProject({
      name: 'Test Project',
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });

    await storage.createModule({
      name: 'Test Module',
      description: 'Test Module Description',
      projectId: 1
    });
  });

  it('should generate sequential test case IDs', async () => {
    const testCase1 = await storage.createTestCase({
      projectId: 1,
      moduleId: 1,
      title: 'Test Case 1',
      description: 'Description 1',
      priority: 'High',
      status: 'Not Executed',
      createdById: 1
    });

    const testCase2 = await storage.createTestCase({
      projectId: 1,
      moduleId: 1,
      title: 'Test Case 2',
      description: 'Description 2',
      priority: 'Medium',
      status: 'Not Executed',
      createdById: 1
    });

    expect(testCase1.testCaseId).toBe('TC-001');
    expect(testCase2.testCaseId).toBe('TC-002');
  });

  it('should handle custom test case IDs', async () => {
    const testCase = await storage.createTestCase({
      projectId: 1,
      moduleId: 1,
      testCaseId: 'CUSTOM-TC-001',
      title: 'Custom Test Case',
      description: 'Description',
      priority: 'High',
      status: 'Not Executed',
      createdById: 1
    });

    expect(testCase.testCaseId).toBe('CUSTOM-TC-001');
  });

  it('should continue sequence after existing test cases', async () => {
    // Create test case with ID TC-005
    await storage.createTestCase({
      projectId: 1,
      moduleId: 1,
      testCaseId: 'TC-005',
      title: 'Test Case 5',
      description: 'Description',
      priority: 'High',
      status: 'Not Executed',
      createdById: 1
    });

    // Next auto-generated should be TC-006
    const nextTestCase = await storage.createTestCase({
      projectId: 1,
      moduleId: 1,
      title: 'Next Test Case',
      description: 'Description',
      priority: 'Medium',
      status: 'Not Executed',
      createdById: 1
    });

    expect(nextTestCase.testCaseId).toBe('TC-006');
  });
});
