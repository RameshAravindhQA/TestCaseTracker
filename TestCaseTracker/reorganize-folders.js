
const fs = require('fs');
const path = require('path');

// Function to move directories recursively
function moveDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist`);
    return;
  }
  
  if (fs.existsSync(destination)) {
    console.log(`Destination ${destination} already exists, skipping...`);
    return;
  }
  
  try {
    fs.renameSync(source, destination);
    console.log(`Moved ${source} to ${destination}`);
  } catch (error) {
    console.error(`Error moving ${source} to ${destination}:`, error.message);
  }
}

// Function to copy files recursively
function copyRecursive(source, destination) {
  if (!fs.existsSync(source)) return;
  
  const stats = fs.statSync(source);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    files.forEach(file => {
      copyRecursive(
        path.join(source, file),
        path.join(destination, file)
      );
    });
  } else {
    fs.copyFileSync(source, destination);
  }
}

// Function to remove directory recursively
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      removeDirectory(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  
  fs.rmdirSync(dirPath);
}

console.log('Starting folder reorganization...');

// Define the nested structure to clean up
const nestedPath = 'TestCaseTracker-july-08-update/TestCaseTracker-july-08-update/LocalFileImporter/TestCaseTracker-master';

// Check if nested structure exists
if (fs.existsSync(nestedPath)) {
  console.log('Found nested structure, reorganizing...');
  
  // Get list of items in the nested folder
  const items = fs.readdirSync(nestedPath);
  
  items.forEach(item => {
    const sourcePath = path.join(nestedPath, item);
    const stats = fs.statSync(sourcePath);
    
    // Skip if item already exists at root level
    if (fs.existsSync(item)) {
      console.log(`${item} already exists at root level, skipping...`);
      return;
    }
    
    if (stats.isDirectory()) {
      console.log(`Moving directory: ${item}`);
      copyRecursive(sourcePath, item);
    } else {
      console.log(`Moving file: ${item}`);
      fs.copyFileSync(sourcePath, item);
    }
  });
  
  // Remove the nested structure after copying
  console.log('Removing nested folder structure...');
  try {
    removeDirectory('TestCaseTracker-july-08-update');
    console.log('Successfully removed nested folder structure');
  } catch (error) {
    console.error('Error removing nested structure:', error.message);
  }
  
} else {
  console.log('Nested structure not found, checking for other nested folders...');
  
  // Check for other nested folders that might need reorganization
  const folders = fs.readdirSync('.').filter(item => {
    return fs.statSync(item).isDirectory() && 
           !['node_modules', '.git', '.replit', 'uploads'].includes(item);
  });
  
  console.log('Current folders at root level:', folders);
}

console.log('Folder reorganization complete!');
