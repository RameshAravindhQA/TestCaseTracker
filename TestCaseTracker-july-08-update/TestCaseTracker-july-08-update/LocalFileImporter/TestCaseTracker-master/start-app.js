#!/usr/bin/env node

// Simple application starter that bypasses TypeScript compilation issues
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CLIENT_ROOT = './client';

console.log('Starting Test Case Management Application...');
console.log('Environment:', process.env.NODE_ENV);

// Start the server with tsx
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, terminating...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, terminating...');
  serverProcess.kill('SIGTERM');
});