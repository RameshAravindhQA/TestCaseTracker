
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Module ID Generation', () => {
  beforeEach(async () => {
    // Clear existing data and create test project
    const project = await storage.createProject({
      name: 'Test Project',
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });
  });

  it('should generate module IDs starting from 1', async () => {
    const module1 = await storage.createModule({
      name: 'First Module',
      description: 'First module description',
      projectId: 1,
      status: 'Active'
    });

    const module2 = await storage.createModule({
      name: 'Second Module', 
      description: 'Second module description',
      projectId: 1,
      status: 'Active'
    });

    const module3 = await storage.createModule({
      name: 'Third Module',
      description: 'Third module description', 
      projectId: 1,
      status: 'Active'
    });

    expect(module1.moduleId).toBe('MOD-1');
    expect(module2.moduleId).toBe('MOD-2');
    expect(module3.moduleId).toBe('MOD-3');
  });

  it('should handle multiple projects independently', async () => {
    const project2 = await storage.createProject({
      name: 'Second Project',
      description: 'Second Project Description',
      status: 'Active',
      createdById: 1
    });

    const module1Project1 = await storage.createModule({
      name: 'Module 1 Project 1',
      description: 'Description',
      projectId: 1,
      status: 'Active'
    });

    const module1Project2 = await storage.createModule({
      name: 'Module 1 Project 2',
      description: 'Description',
      projectId: project2.id,
      status: 'Active'
    });

    const module2Project1 = await storage.createModule({
      name: 'Module 2 Project 1',
      description: 'Description',
      projectId: 1,
      status: 'Active'
    });

    expect(module1Project1.moduleId).toBe('MOD-1');
    expect(module1Project2.moduleId).toBe('MOD-1');
    expect(module2Project1.moduleId).toBe('MOD-2');
  });
});
