#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// __dirname is already available in CommonJS

console.log('🚀 Starting TestCaseTracker Application...');

// Change to the TestCaseTracker subdirectory
const appPath = path.join(__dirname, 'TestCaseTracker');

process.chdir(appPath);
console.log('📂 Working directory:', process.cwd());

// Start the server using npm run dev (which uses tsx)
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});