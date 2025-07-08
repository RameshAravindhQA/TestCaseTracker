
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Module ID Generation', () => {
  beforeEach(async () => {
    // Clear existing data
    await storage.createProject({
      name: 'Test Project',
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });
  });

  it('should generate sequential module IDs starting from 1', async () => {
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

  it('should generate different sequences for different projects', async () => {
    const project2 = await storage.createProject({
      name: 'Test Project 2',
      description: 'Second test project',
      status: 'Active',
      createdById: 1
    });

    const module1Project1 = await storage.createModule({
      name: 'Module 1 P1',
      description: 'First module project 1',
      projectId: 1,
      status: 'Active'
    });

    const module1Project2 = await storage.createModule({
      name: 'Module 1 P2',
      description: 'First module project 2',
      projectId: project2.id,
      status: 'Active'
    });

    const module2Project1 = await storage.createModule({
      name: 'Module 2 P1',
      description: 'Second module project 1',
      projectId: 1,
      status: 'Active'
    });

    expect(module1Project1.moduleId).toBe('MOD-1');
    expect(module1Project2.moduleId).toBe('MOD-1');
    expect(module2Project1.moduleId).toBe('MOD-2');
  });
});
