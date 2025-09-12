
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Bug Summary Functionality', () => {
  beforeEach(async () => {
    // Clear existing data and create test data
    await storage.createProject({
      name: 'Test Project',
      description: 'Test Description',
      status: 'Active',
      createdById: 1
    });
  });

  it('should generate correct bug ID sequence', async () => {
    const bug1 = await storage.createBug({
      projectId: 1,
      title: 'Test Bug 1',
      description: 'Description 1',
      severity: 'Critical',
      status: 'Open',
      reportedById: 1
    });

    const bug2 = await storage.createBug({
      projectId: 1,
      title: 'Test Bug 2', 
      description: 'Description 2',
      severity: 'Major',
      status: 'Open',
      reportedById: 1
    });

    expect(bug1.bugId).toBe('BUG-001');
    expect(bug2.bugId).toBe('BUG-002');
  });

  it('should provide accurate bug status counts', async () => {
    // Create bugs with different statuses
    await storage.createBug({
      projectId: 1,
      title: 'Open Bug',
      description: 'Description',
      severity: 'Critical',
      status: 'Open',
      reportedById: 1
    });

    await storage.createBug({
      projectId: 1,
      title: 'In Progress Bug',
      description: 'Description',
      severity: 'Major',
      status: 'In Progress',
      reportedById: 1
    });

    await storage.createBug({
      projectId: 1,
      title: 'Resolved Bug',
      description: 'Description',
      severity: 'Minor',
      status: 'Resolved',
      reportedById: 1
    });

    const stats = await storage.getDashboardStats();
    
    expect(stats.bugStatusCounts?.open).toBe(1);
    expect(stats.bugStatusCounts?.inProgress).toBe(1);
    expect(stats.bugStatusCounts?.resolved).toBe(1);
    expect(stats.bugStatusCounts?.critical).toBe(1);
    expect(stats.bugStatusCounts?.major).toBe(1);
    expect(stats.bugStatusCounts?.minor).toBe(1);
  });
});
