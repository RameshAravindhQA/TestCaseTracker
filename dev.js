import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting TestCaseTracker Application from root...');

// Change to TestCaseTracker directory and run the dev script
const testCaseTrackerPath = path.join(process.cwd(), 'TestCaseTracker');
console.log('📂 Changing to directory:', testCaseTrackerPath);

// Start the application from TestCaseTracker directory
const app = spawn('node', ['dev.js'], {
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
  process.exit(1);
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