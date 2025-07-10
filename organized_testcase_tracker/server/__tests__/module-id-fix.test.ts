
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Fixed Module ID Generation', () => {
  beforeEach(async () => {
    // Clear existing data
    storage.modules = [];
    storage.projects = [];
    
    await storage.createProject({
      name: 'Test Project 1',
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });
    
    await storage.createProject({
      name: 'Test Project 2', 
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });
  });

  it('should generate module IDs starting from 1', async () => {
    const module1 = await storage.createModule({
      name: 'First Module',
      description: 'First module',
      projectId: 1,
      status: 'Active'
    });

    expect(module1.moduleId).toBe('MOD-1');
  });

  it('should generate sequential module IDs within same project', async () => {
    const module1 = await storage.createModule({
      name: 'Module 1',
      description: 'First module',
      projectId: 1,
      status: 'Active'
    });

    const module2 = await storage.createModule({
      name: 'Module 2',
      description: 'Second module',
      projectId: 1,
      status: 'Active'
    });

    const module3 = await storage.createModule({
      name: 'Module 3',
      description: 'Third module',
      projectId: 1,
      status: 'Active'
    });

    expect(module1.moduleId).toBe('MOD-1');
    expect(module2.moduleId).toBe('MOD-2');
    expect(module3.moduleId).toBe('MOD-3');
  });

  it('should start from 1 for each project independently', async () => {
    const module1Project1 = await storage.createModule({
      name: 'Module 1 Project 1',
      description: 'First module in project 1',
      projectId: 1,
      status: 'Active'
    });

    const module1Project2 = await storage.createModule({
      name: 'Module 1 Project 2',
      description: 'First module in project 2',
      projectId: 2,
      status: 'Active'
    });

    const module2Project1 = await storage.createModule({
      name: 'Module 2 Project 1',
      description: 'Second module in project 1',
      projectId: 1,
      status: 'Active'
    });

    expect(module1Project1.moduleId).toBe('MOD-1');
    expect(module1Project2.moduleId).toBe('MOD-1');
    expect(module2Project1.moduleId).toBe('MOD-2');
  });

  it('should handle non-sequential creation correctly', async () => {
    // Create some modules to establish a sequence
    await storage.createModule({
      name: 'Module 1',
      projectId: 1,
      status: 'Active'
    });

    await storage.createModule({
      name: 'Module 2',
      projectId: 1,
      status: 'Active'
    });

    // Delete one (simulating gaps)
    storage.modules = storage.modules.filter(m => m.moduleId !== 'MOD-2');

    // Create new module - should continue from highest number
    const newModule = await storage.createModule({
      name: 'Module 3',
      projectId: 1,
      status: 'Active'
    });

    expect(newModule.moduleId).toBe('MOD-2');
  });
});
