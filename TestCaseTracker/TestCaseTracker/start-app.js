
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TestCaseTracker Application...');

// Kill any existing processes
const killCommand = spawn('pkill', ['-f', 'tsx|vite|concurrently'], { stdio: 'inherit' });
killCommand.on('close', () => {
  setTimeout(() => {
    // Start server
    console.log('📡 Starting backend server...');
    const server = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit',
      detached: false
    });

    // Start client after a short delay
    setTimeout(() => {
      console.log('🎨 Starting frontend client...');
      const client = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'client'),
        stdio: 'inherit',
        detached: false
      });

      client.on('error', (err) => {
        console.error('Client error:', err);
      });
    }, 3000);

    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  }, 2000);
});
