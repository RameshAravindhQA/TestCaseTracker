
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Organizing project structure...\n');

// Define the target structure
const mainProjectPath = path.join(process.cwd(), 'TestCaseTracker');
const currentStructure = {
  client: 'client',
  server: 'server', 
  shared: 'shared',
  uploads: 'uploads'
};

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source directory ${src} does not exist, skipping...`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to move files
function moveFiles() {
  try {
    // Ensure main project directory exists
    if (!fs.existsSync(mainProjectPath)) {
      fs.mkdirSync(mainProjectPath, { recursive: true });
    }

    // Move each main directory
    Object.entries(currentStructure).forEach(([key, dirName]) => {
      const srcPath = path.join(process.cwd(), dirName);
      const destPath = path.join(mainProjectPath, dirName);
      
      if (fs.existsSync(srcPath) && srcPath !== destPath) {
        console.log(`📁 Moving ${dirName}/ to TestCaseTracker/${dirName}/`);
        
        // Remove destination if it exists
        if (fs.existsSync(destPath)) {
          fs.rmSync(destPath, { recursive: true, force: true });
        }
        
        // Copy the directory
        copyDir(srcPath, destPath);
        console.log(`✅ Successfully moved ${dirName}/`);
      } else if (srcPath === destPath) {
        console.log(`✅ ${dirName}/ already in correct location`);
      } else {
        console.log(`⚠️  ${dirName}/ not found, skipping...`);
      }
    });

    // Move important config files to the main project directory
    const configFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'components.json',
      'drizzle.config.ts',
      '.replit'
    ];

    configFiles.forEach(file => {
      const srcPath = path.join(process.cwd(), file);
      const destPath = path.join(mainProjectPath, file);
      
      if (fs.existsSync(srcPath) && srcPath !== destPath) {
        console.log(`📄 Moving ${file} to TestCaseTracker/`);
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Successfully moved ${file}`);
      } else if (srcPath === destPath) {
        console.log(`✅ ${file} already in correct location`);
      }
    });

    console.log('\n🎉 Project organization complete!');
    console.log('\n📋 Final structure:');
    console.log('TestCaseTracker/');
    console.log('├── client/');
    console.log('├── server/');
    console.log('├── shared/');
    console.log('├── uploads/');
    console.log('├── package.json');
    console.log('├── tsconfig.json');
    console.log('├── vite.config.ts');
    console.log('└── ... (other config files)');

  } catch (error) {
    console.error('❌ Error organizing project:', error);
  }
}

// Run the organization
moveFiles();
