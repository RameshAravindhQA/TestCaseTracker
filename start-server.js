#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting TestCaseTracker Application...');

// Change to the TestCaseTracker directory
const appPath = path.join(__dirname, 'TestCaseTracker', 'TestCaseTracker');

console.log('📂 Checking path:', appPath);
console.log('📂 Path exists:', existsSync(appPath));

if (!existsSync(appPath)) {
  console.error('❌ TestCaseTracker directory not found at:', appPath);
  process.exit(1);
}

process.chdir(appPath);
console.log('📂 Working directory:', process.cwd());

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!existsSync(packageJsonPath)) {
  console.error('❌ package.json not found in:', process.cwd());
  process.exit(1);
}

console.log('✅ Found package.json, starting server...');

// Start the server using tsx
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