import { DocumentFolder } from '@/shared/schema';

/**
 * Helper functions for testing folder rename operations
 */

/**
 * Validates a folder rename operation by comparing before and after states
 * @param originalFolder The original folder before the rename
 * @param updatedFolder The folder after the rename operation
 * @param newName The expected new folder name
 * @returns Object with validation results
 */
export function validateFolderRename(
  originalFolder: DocumentFolder,
  updatedFolder: DocumentFolder,
  newName: string
): { 
  isValid: boolean; 
  errors: string[];
  nameChanged: boolean;
  idPreserved: boolean;
  timestampUpdated: boolean;
} {
  const errors: string[] = [];
  
  // Check if name changed correctly
  const nameChanged = originalFolder.name !== updatedFolder.name && updatedFolder.name === newName;
  if (!nameChanged) {
    errors.push(`Folder name was not updated correctly. Expected: "${newName}", Received: "${updatedFolder.name}"`);
  }
  
  // Check if ID was preserved
  const idPreserved = originalFolder.id === updatedFolder.id;
  if (!idPreserved) {
    errors.push(`Folder ID changed during rename. Original: ${originalFolder.id}, New: ${updatedFolder.id}`);
  }
  
  // Check if timestamp was updated
  const timestampUpdated = new Date(updatedFolder.updatedAt).getTime() > new Date(originalFolder.updatedAt).getTime();
  if (!timestampUpdated) {
    errors.push('Folder updatedAt timestamp was not updated correctly');
  }
  
  // Verify other properties remained the same
  if (originalFolder.projectId !== updatedFolder.projectId) {
    errors.push(`Project ID changed unexpectedly. Original: ${originalFolder.projectId}, New: ${updatedFolder.projectId}`);
  }
  
  if (originalFolder.parentFolderId !== updatedFolder.parentFolderId) {
    errors.push(`Parent folder ID changed unexpectedly. Original: ${originalFolder.parentFolderId}, New: ${updatedFolder.parentFolderId}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    nameChanged,
    idPreserved,
    timestampUpdated
  };
}

/**
 * Mock helper to simulate a folder rename operation
 * @param folder The folder to rename
 * @param newName The new name for the folder
 * @returns The renamed folder object
 */
export function mockFolderRename(folder: DocumentFolder, newName: string): DocumentFolder {
  return {
    ...folder,
    name: newName,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Generates a test folder with specified properties
 * @param id Folder ID
 * @param name Folder name
 * @param projectId Project ID
 * @param parentFolderId Parent folder ID or null
 * @returns A folder object for testing
 */
export function createTestFolder(
  id: number, 
  name: string, 
  projectId: number, 
  parentFolderId: number | null = null
): DocumentFolder {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: `Test folder ${id} description`,
    projectId,
    parentFolderId,
    createdAt: now,
    updatedAt: now,
    isDeleted: false
  };
}