const { spawn } = require('child_process');
const path = require('path');

// Kill any existing processes
const killProcesses = () => {
  try {
    spawn('pkill', ['-f', 'tsx|vite'], { stdio: 'inherit' });
  } catch (error) {
    console.log('No existing processes to kill');
  }
};

// Start the application
const startApp = () => {
  console.log('Starting Test Case Management System...');
  
  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
};

// Kill existing processes and start fresh
killProcesses();
setTimeout(startApp, 1000);