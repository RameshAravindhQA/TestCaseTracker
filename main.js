#!/usr/bin/env node

console.log('🚀 Starting TestCaseTracker Application...');

// Change to the correct directory
process.chdir('TestCaseTracker/TestCaseTracker');

// Start the server
import('./server/index.js').catch(async () => {
  // If ES modules fail, try with tsx
  const { spawn } = await import('child_process');
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
});