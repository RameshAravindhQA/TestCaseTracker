#!/usr/bin/env node

// Simple server starter to prevent duplicate processes
import { spawn } from 'child_process';
import { execSync } from 'child_process';

// Kill any existing processes
try {
  execSync('pkill -f "tsx server/index.ts" 2>/dev/null || true');
  execSync('pkill -f "node.*5000" 2>/dev/null || true');
  execSync('fuser -k 5000/tcp 2>/dev/null || true');
} catch (e) {
  // Ignore errors
}

// Wait a moment
setTimeout(() => {
  console.log('🚀 Starting Test Case Management System...');
  console.log('   Server will be available at http://localhost:5000');
  console.log('   Features: Enhanced messaging, WebSocket support, GitHub issue reporter');
  console.log('');
  
  // Start the server
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit'
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
  });
}, 1000);