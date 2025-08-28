
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting TestCaseTracker Application...');
console.log('📂 Working directory:', process.cwd());

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

// Kill any existing processes on port 5000
async function killExistingProcesses() {
  try {
    const { exec } = require('child_process');
    exec('lsof -ti:5000 | xargs kill -9', (error) => {
      if (error && !error.message.includes('No such process')) {
        console.log('Note: No existing processes found on port 5000');
      }
    });
    
    // Wait a moment for processes to be killed
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // Ignore errors - likely no processes to kill
  }
}

async function startServer() {
  try {
    await killExistingProcesses();
    
    // Check if port is still in use
    const portInUse = await isPortInUse(5000);
    if (portInUse) {
      console.log('⚠️  Port 5000 is still in use, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🏁 Starting server...');
    
    // Start the server with optimized settings
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        PORT: '5000',
        // Optimize Node.js memory and performance
        NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
      }
    });

    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });

    server.on('exit', (code, signal) => {
      if (code !== 0) {
        console.log(`🔄 Server exited with code ${code}, restarting...`);
        setTimeout(startServer, 2000); // Restart after 2 seconds
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      server.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      server.kill('SIGINT');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
