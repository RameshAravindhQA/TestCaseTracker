
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('CSV Export Functionality', () => {
  beforeEach(async () => {
    // Create test project with modules and test cases
    const project = await storage.createProject({
      name: 'Export Test Project',
      description: 'Project for CSV export testing',
      status: 'Active',
      createdById: 1
    });

    const module1 = await storage.createModule({
      name: 'Module 1',
      description: 'First module',
      projectId: project.id
    });

    await storage.createTestCase({
      projectId: project.id,
      moduleId: module1.id,
      title: 'Test Case 1',
      description: 'First test case',
      priority: 'High',
      status: 'Pass',
      createdById: 1
    });

    await storage.createBug({
      projectId: project.id,
      title: 'Test Bug',
      description: 'Test bug description',
      severity: 'Critical',
      status: 'Open',
      reportedById: 1
    });
  });

  it('should export projects with complete data', async () => {
    const exportData = await storage.exportProjectsCSV();
    
    expect(exportData).toHaveLength(1);
    expect(exportData[0]).toHaveProperty('projectName', 'Export Test Project');
    expect(exportData[0]).toHaveProperty('totalModules', 1);
    expect(exportData[0]).toHaveProperty('totalTestCases', 1);
    expect(exportData[0]).toHaveProperty('totalBugs', 1);
    expect(exportData[0].modules).toContain('Module 1');
    expect(exportData[0].testCases).toContain('TC-001:Test Case 1');
    expect(exportData[0].bugs).toContain('BUG-001:Test Bug');
  });

  it('should handle empty projects', async () => {
    await storage.createProject({
      name: 'Empty Project',
      description: 'Project with no data',
      status: 'Active',
      createdById: 1
    });

    const exportData = await storage.exportProjectsCSV();
    const emptyProject = exportData.find(p => p.projectName === 'Empty Project');
    
    expect(emptyProject?.totalModules).toBe(0);
    expect(emptyProject?.totalTestCases).toBe(0);
    expect(emptyProject?.totalBugs).toBe(0);
  });
});
