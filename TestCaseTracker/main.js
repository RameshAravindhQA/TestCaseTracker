#!/usr/bin/env node

// Simple entry point for Replit
const { spawn } = require('child_process');

console.log('🚀 Starting TestCaseTracker Application...');

// Change to TestCaseTracker directory and start
process.chdir('./TestCaseTracker');

// Start the development server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));