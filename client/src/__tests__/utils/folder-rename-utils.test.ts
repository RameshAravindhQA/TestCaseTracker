import { describe, test, expect } from 'vitest';
import { 
  validateFolderRename, 
  mockFolderRename, 
  createTestFolder 
} from './folder-rename-utils';
import { DocumentFolder } from '@/shared/schema';

describe('Folder Rename Utilities', () => {
  test('createTestFolder creates valid folder objects', () => {
    const folder = createTestFolder(1, 'Test Folder', 2);
    
    expect(folder).toHaveProperty('id', 1);
    expect(folder).toHaveProperty('name', 'Test Folder');
    expect(folder).toHaveProperty('projectId', 2);
    expect(folder).toHaveProperty('parentFolderId', null);
    expect(folder).toHaveProperty('isDeleted', false);
    expect(folder).toHaveProperty('createdAt');
    expect(folder).toHaveProperty('updatedAt');
  });
  
  test('mockFolderRename correctly modifies folder name and updatedAt', () => {
    const originalFolder = createTestFolder(1, 'Original Name', 2);
    const originalTimestamp = originalFolder.updatedAt;
    
    // Wait a small amount of time to ensure timestamp differs
    setTimeout(() => {
      const renamedFolder = mockFolderRename(originalFolder, 'New Name');
      
      expect(renamedFolder.id).toBe(originalFolder.id);
      expect(renamedFolder.name).toBe('New Name');
      expect(renamedFolder.projectId).toBe(originalFolder.projectId);
      expect(renamedFolder.parentFolderId).toBe(originalFolder.parentFolderId);
      expect(renamedFolder.createdAt).toBe(originalFolder.createdAt);
      expect(renamedFolder.updatedAt).not.toBe(originalTimestamp);
      expect(new Date(renamedFolder.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalTimestamp).getTime()
      );
    }, 10);
  });
  
  test('validateFolderRename detects valid rename operations', () => {
    const originalFolder = createTestFolder(1, 'Original Name', 2);
    const newName = 'New Folder Name';
    
    // Mock a valid rename operation (wait to ensure timestamp differs)
    setTimeout(() => {
      const renamedFolder = mockFolderRename(originalFolder, newName);
      
      const result = validateFolderRename(originalFolder, renamedFolder, newName);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.nameChanged).toBe(true);
      expect(result.idPreserved).toBe(true);
      expect(result.timestampUpdated).toBe(true);
    }, 10);
  });
  
  test('validateFolderRename detects invalid rename operations', () => {
    const originalFolder = createTestFolder(1, 'Original Name', 2);
    const newName = 'New Folder Name';
    
    // Create an invalid rename by changing ID
    const invalidRename: DocumentFolder = {
      ...originalFolder,
      id: 999, // Different ID
      name: newName,
      updatedAt: new Date().toISOString()
    };
    
    const result = validateFolderRename(originalFolder, invalidRename, newName);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('ID changed');
    expect(result.nameChanged).toBe(true);
    expect(result.idPreserved).toBe(false);
  });
  
  test('validateFolderRename detects wrong name in rename operations', () => {
    const originalFolder = createTestFolder(1, 'Original Name', 2);
    const expectedName = 'Expected Name';
    
    // Create a rename with wrong name
    const wrongNameRename = mockFolderRename(originalFolder, 'Wrong Name');
    
    const result = validateFolderRename(originalFolder, wrongNameRename, expectedName);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('not updated correctly');
    expect(result.nameChanged).toBe(false);
  });
  
  test('validateFolderRename detects unchanged timestamp', () => {
    const originalFolder = createTestFolder(1, 'Original Name', 2);
    const newName = 'New Folder Name';
    
    // Create a rename with unchanged timestamp
    const unchangedTimestampRename: DocumentFolder = {
      ...originalFolder,
      name: newName,
      // updatedAt left unchanged
    };
    
    const result = validateFolderRename(originalFolder, unchangedTimestampRename, newName);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('timestamp was not updated');
    expect(result.nameChanged).toBe(true);
    expect(result.idPreserved).toBe(true);
    expect(result.timestampUpdated).toBe(false);
  });
});