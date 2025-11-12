
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting TestCaseTracker Application...');

// We're already in the TestCaseTracker directory
console.log('📂 Working directory:', process.cwd());

// Start the backend server using local tsx package
const npxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx.cmd');
const server = spawn(npxPath, ['server/index.ts'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  },
  shell: true
});

// Note: Frontend is served by the backend server in this configuration

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
