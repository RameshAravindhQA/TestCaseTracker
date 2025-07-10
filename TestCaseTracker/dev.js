
#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting TestCaseTracker Application...');

// We're already in the TestCaseTracker directory
console.log('📂 Working directory:', process.cwd());

// Start the backend server using tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '3001'
  }
});

// Start the frontend Vite dev server
const frontend = spawn('npx', ['vite', '--config', 'config/vite.config.ts', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  shell: true,
  cwd: 'client',
  env: { 
    ...process.env, 
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

frontend.on('error', (error) => {
  console.error('❌ Failed to start frontend:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  frontend.kill('SIGTERM');
  process.exit(code);
});

frontend.on('exit', (code) => {
  console.log(`Frontend exited with code ${code}`);
  server.kill('SIGTERM');
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
  frontend.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
  frontend.kill('SIGINT');
});
