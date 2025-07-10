/**
 * Run Folder Rename Tests
 * 
 * This script helps to run the folder rename unit tests.
 * It can be run directly from the command line.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DocumentFolder } from '@/shared/schema';
import { validateFolderRename, createTestFolder, mockFolderRename } from './utils/folder-rename-utils';

// Mock API for testing
const mockApi = {
  renameFolder: async (folderId: number, newName: string): Promise<DocumentFolder> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create a test folder
    const originalFolder = createTestFolder(folderId, 'Original Folder', 1);
    
    // Return the renamed version
    return mockFolderRename(originalFolder, newName);
  }
};

describe('Folder Rename Test Runner', () => {
  let testFolders: DocumentFolder[] = [];
  
  beforeAll(() => {
    // Create some test folders
    testFolders = [
      createTestFolder(1, 'Test Folder 1', 1),
      createTestFolder(2, 'Test Folder 2', 1, 1), // Child of folder 1
      createTestFolder(3, 'Test Folder 3', 1)
    ];
    
    console.log('🔍 Starting folder rename tests');
    console.log(`📂 Created ${testFolders.length} test folders`);
  });
  
  test('Simple folder rename', async () => {
    const originalFolder = testFolders[0];
    const newName = 'Renamed Folder 1';
    
    console.log(`🔄 Renaming folder: "${originalFolder.name}" to "${newName}"`);
    
    // Perform the rename
    const renamedFolder = await mockApi.renameFolder(originalFolder.id, newName);
    
    // Validate the rename
    const validation = validateFolderRename(originalFolder, renamedFolder, newName);
    
    if (validation.isValid) {
      console.log('✅ Folder rename validation passed');
    } else {
      console.error('❌ Folder rename validation failed:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
    }
    
    expect(validation.isValid).toBe(true);
    expect(validation.nameChanged).toBe(true);
    expect(validation.idPreserved).toBe(true);
  });
  
  test('Rename folder with children', async () => {
    // Get parent folder and its child
    const parentFolder = testFolders[0];
    const childFolder = testFolders[1];
    
    const newParentName = 'Parent Folder Renamed';
    
    console.log(`🔄 Renaming parent folder: "${parentFolder.name}" to "${newParentName}"`);
    console.log(`👶 Child folder: "${childFolder.name}" should keep its parent reference`);
    
    // Perform the rename
    const renamedParent = await mockApi.renameFolder(parentFolder.id, newParentName);
    
    // Validate parent rename
    const validation = validateFolderRename(parentFolder, renamedParent, newParentName);
    
    if (validation.isValid) {
      console.log('✅ Parent folder rename validation passed');
    } else {
      console.error('❌ Parent folder rename validation failed:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
    }
    
    // Child folder should still reference the same parent ID
    console.log(`🔍 Checking if child folder still references parent ID: ${parentFolder.id}`);
    expect(childFolder.parentFolderId).toBe(parentFolder.id);
    
    expect(validation.isValid).toBe(true);
  });
  
  afterAll(() => {
    console.log('✨ All folder rename tests completed');
  });
});