// This file is created to work around the npm start issue
// It changes to TestCaseTracker directory and runs the dev script

import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting TestCaseTracker Application via index.js...');

// Change to TestCaseTracker directory and run npm run dev
const testCaseTrackerPath = path.join(process.cwd(), 'TestCaseTracker');
console.log('📂 Working directory:', testCaseTrackerPath);

// Start the application from TestCaseTracker directory using npm run dev
const app = spawn('npm', ['run', 'dev'], {
  cwd: testCaseTrackerPath,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

app.on('error', (error) => {
  console.error('❌ Failed to start application:', error);
  console.log('🔄 Trying alternative approach...');
  
  // Fallback: try running the dev.js file directly
  const fallback = spawn('node', ['dev.js'], {
    cwd: testCaseTrackerPath,
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      PORT: '5000'
    }
  });
  
  fallback.on('error', (fallbackError) => {
    console.error('❌ Fallback also failed:', fallbackError);
    process.exit(1);
  });
});

app.on('exit', (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  app.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  app.kill('SIGINT');
});