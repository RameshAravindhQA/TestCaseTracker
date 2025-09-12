
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseStorage } from '../db-storage';
import { db } from '../db';
import { users, projects, modules, testCases, bugs } from '../../shared/schema';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  let mockSelect: any;
  let mockInsert: any;
  let mockUpdate: any;
  let mockDelete: any;

  beforeEach(() => {
    storage = new DatabaseStorage();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock database methods
    mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue([]),
        orderBy: vi.fn().mockReturnValue([]),
        limit: vi.fn().mockReturnValue([])
      })
    });
    
    mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([])
      })
    });
    
    mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      })
    });
    
    mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    });

    (db as any).select = mockSelect;
    (db as any).insert = mockInsert;
    (db as any).update = mockUpdate;
    (db as any).delete = mockDelete;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('User Operations', () => {
    it('should get user by id', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser])
        })
      });

      const result = await storage.getUser(1);
      
      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should get user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser])
        })
      });

      const result = await storage.getUserByEmail('test@example.com');
      
      expect(result).toEqual(mockUser);
    });

    it('should create a new user', async () => {
      const newUser = { email: 'new@example.com', name: 'New User', password: 'hashedpassword' };
      const createdUser = { id: 1, ...newUser, createdAt: new Date() };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdUser])
        })
      });

      const result = await storage.createUser(newUser);
      
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('should update user', async () => {
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { id: 1, email: 'test@example.com', name: 'Updated Name' };
      
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser])
          })
        })
      });

      const result = await storage.updateUser(1, updatedData);
      
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should delete user', async () => {
      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      });

      const result = await storage.deleteUser(1);
      
      expect(mockDelete).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Project Operations', () => {
    it('should get all projects', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', description: 'Description 1' },
        { id: 2, name: 'Project 2', description: 'Description 2' }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockResolvedValue(mockProjects)
      });

      const result = await storage.getProjects();
      
      expect(result).toEqual(mockProjects);
    });

    it('should get project by id', async () => {
      const mockProject = { id: 1, name: 'Project 1', description: 'Description 1' };
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockProject])
        })
      });

      const result = await storage.getProject(1);
      
      expect(result).toEqual(mockProject);
    });

    it('should create a new project', async () => {
      const newProject = { name: 'New Project', description: 'New Description' };
      const createdProject = { id: 1, ...newProject, createdAt: new Date() };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdProject])
        })
      });

      const result = await storage.createProject(newProject);
      
      expect(result).toEqual(createdProject);
    });
  });

  describe('Module Operations', () => {
    it('should get modules by project id', async () => {
      const mockModules = [
        { id: 1, name: 'Module 1', projectId: 1 },
        { id: 2, name: 'Module 2', projectId: 1 }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockModules)
        })
      });

      const result = await storage.getModules(1);
      
      expect(result).toEqual(mockModules);
    });

    it('should create a new module', async () => {
      const newModule = { name: 'New Module', projectId: 1 };
      const createdModule = { id: 1, ...newModule, createdAt: new Date() };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdModule])
        })
      });

      const result = await storage.createModule(newModule);
      
      expect(result).toEqual(createdModule);
    });
  });

  describe('Test Case Operations', () => {
    it('should get test cases by project id', async () => {
      const mockTestCases = [
        { id: 1, title: 'Test Case 1', projectId: 1, moduleId: 1 },
        { id: 2, title: 'Test Case 2', projectId: 1, moduleId: 1 }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockTestCases)
        })
      });

      const result = await storage.getTestCases(1);
      
      expect(result).toEqual(mockTestCases);
    });

    it('should get test cases by project id and module id', async () => {
      const mockTestCases = [
        { id: 1, title: 'Test Case 1', projectId: 1, moduleId: 1 }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockTestCases)
        })
      });

      const result = await storage.getTestCases(1, 1);
      
      expect(result).toEqual(mockTestCases);
    });

    it('should create a new test case', async () => {
      const newTestCase = { 
        title: 'New Test Case', 
        projectId: 1, 
        moduleId: 1,
        description: 'Test description',
        preconditions: 'Test preconditions',
        steps: 'Test steps',
        expectedResult: 'Expected result',
        priority: 'Medium',
        status: 'Not Executed'
      };
      const createdTestCase = { 
        id: 1, 
        ...newTestCase, 
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdTestCase])
        })
      });

      const result = await storage.createTestCase(newTestCase);
      
      expect(result).toEqual(createdTestCase);
    });
  });

  describe('Bug Operations', () => {
    it('should get bugs by project id', async () => {
      const mockBugs = [
        { id: 1, title: 'Bug 1', projectId: 1, moduleId: 1 },
        { id: 2, title: 'Bug 2', projectId: 1, moduleId: 1 }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockBugs)
        })
      });

      const result = await storage.getBugs(1);
      
      expect(result).toEqual(mockBugs);
    });

    it('should create a new bug', async () => {
      const newBug = { 
        title: 'New Bug', 
        projectId: 1, 
        moduleId: 1,
        description: 'Bug description',
        severity: 'Medium',
        priority: 'High',
        status: 'Open',
        reportedById: 1
      };
      const createdBug = { 
        id: 1, 
        ...newBug, 
        dateReported: new Date(),
        updatedAt: new Date()
      };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdBug])
        })
      });

      const result = await storage.createBug(newBug);
      
      expect(result).toEqual(createdBug);
    });
  });

  describe('Matrix Cell Operations', () => {
    it('should get matrix cells by project id', async () => {
      const mockCells = [
        { id: 1, rowModuleId: 1, colModuleId: 2, projectId: 1, value: 'test' },
        { id: 2, rowModuleId: 2, colModuleId: 1, projectId: 1, value: 'another' }
      ];
      
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCells)
        })
      });

      const result = await storage.getMatrixCellsByProject(1);
      
      expect(result).toEqual(mockCells);
    });

    it('should upsert matrix cell - create new', async () => {
      const newCell = { 
        rowModuleId: 1, 
        colModuleId: 2, 
        projectId: 1, 
        value: 'test',
        createdById: 1
      };
      
      // Mock getMatrixCell to return undefined (no existing cell)
      const getMatrixCellSpy = vi.spyOn(storage, 'getMatrixCell').mockResolvedValue(undefined);
      
      const createdCell = { 
        id: 1, 
        ...newCell, 
        createdAt: new Date()
      };
      
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdCell])
        })
      });

      const result = await storage.upsertMatrixCell(newCell);
      
      expect(getMatrixCellSpy).toHaveBeenCalledWith(1, 2, 1);
      expect(result).toEqual(createdCell);
      
      getMatrixCellSpy.mockRestore();
    });

    it('should upsert matrix cell - update existing', async () => {
      const existingCell = { 
        id: 1, 
        rowModuleId: 1, 
        colModuleId: 2, 
        projectId: 1, 
        value: 'old',
        createdById: 1,
        createdAt: new Date()
      };
      
      const updateData = { 
        rowModuleId: 1, 
        colModuleId: 2, 
        projectId: 1, 
        value: 'updated',
        createdById: 1
      };
      
      // Mock getMatrixCell to return existing cell
      const getMatrixCellSpy = vi.spyOn(storage, 'getMatrixCell').mockResolvedValue(existingCell);
      
      const updatedCell = { 
        ...existingCell, 
        ...updateData, 
        updatedAt: new Date()
      };
      
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCell])
          })
        })
      });

      const result = await storage.upsertMatrixCell(updateData);
      
      expect(getMatrixCellSpy).toHaveBeenCalledWith(1, 2, 1);
      expect(result).toEqual(updatedCell);
      
      getMatrixCellSpy.mockRestore();
    });
  });

  describe('Dashboard Stats', () => {
    it('should calculate dashboard statistics', async () => {
      const mockProjects = [{ id: 1 }, { id: 2 }];
      const mockTestCases = [
        { id: 1, status: 'Pass' },
        { id: 2, status: 'Fail' },
        { id: 3, status: 'Pass' }
      ];
      const mockBugs = [
        { id: 1, status: 'Open' },
        { id: 2, status: 'Closed' },
        { id: 3, status: 'In Progress' }
      ];
      
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue(mockProjects)
        })
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue(mockTestCases)
        })
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue(mockBugs)
        });

      const result = await storage.getDashboardStats();
      
      expect(result).toEqual({
        totalProjects: 2,
        totalTestCases: 3,
        openBugs: 2, // Open and In Progress
        passRate: 67 // 2 out of 3 passed, rounded
      });
    });
  });
});
