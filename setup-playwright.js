
import { spawn } from 'child_process';
import path from 'path';

console.log('🎭 Setting up Playwright for Test Automation...');

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      stdio: 'inherit', 
      ...options 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupPlaywright() {
  try {
    console.log('📦 Installing Playwright...');
    await runCommand('npm', ['install', 'playwright', '--save-dev']);
    
    console.log('🌐 Installing Playwright browsers (Chromium only for space efficiency)...');
    await runCommand('npx', ['playwright', 'install', 'chromium']);
    
    console.log('✅ Playwright setup completed successfully!');
    console.log('🎬 You can now use the Test Automation module to record tests.');
    
    // Test Playwright installation
    console.log('🧪 Testing Playwright installation...');
    await runCommand('npx', ['playwright', '--version']);
    
  } catch (error) {
    console.error('❌ Playwright setup failed:', error.message);
    console.log('\n📋 Manual setup instructions:');
    console.log('1. Run: npm install playwright --save-dev');
    console.log('2. Run: npx playwright install chromium');
    console.log('3. Restart the server');
    process.exit(1);
  }
}

setupPlaywright();
