
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TestCaseTracker Application...');
console.log('📂 Working directory:', process.cwd());

// Change to the TestCaseTracker directory
process.chdir(path.join(__dirname, 'TestCaseTracker'));

let serverProcess = null;
let clientProcess = null;

// Function to kill processes gracefully
function cleanup() {
  console.log('\n🛑 Shutting down processes...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  if (clientProcess) {
    clientProcess.kill('SIGTERM');
  }
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start server first
console.log('🖥️  Starting server...');
serverProcess = spawn('npm', ['run', 'server'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Wait a bit for server to start, then start client
setTimeout(() => {
  console.log('🌐 Starting client...');
  clientProcess = spawn('npm', ['run', 'client'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
  });

  clientProcess.stdout.on('data', (data) => {
    console.log(`[CLIENT] ${data.toString().trim()}`);
  });

  clientProcess.stderr.on('data', (data) => {
    console.error(`[CLIENT ERROR] ${data.toString().trim()}`);
  });

  clientProcess.on('close', (code) => {
    console.log(`[CLIENT] Process exited with code ${code}`);
    if (code !== 0) {
      console.log('🔄 Restarting client...');
      setTimeout(() => {
        // Restart client if it crashes
        clientProcess = spawn('npm', ['run', 'client'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
        });
      }, 2000);
    }
  });
}, 3000);

serverProcess.on('close', (code) => {
  console.log(`[SERVER] Process exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting server...');
    setTimeout(() => {
      // Restart server if it crashes
      serverProcess = spawn('npm', ['run', 'server'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
      });
    }, 2000);
  }
});

console.log('✅ Application startup initiated');
console.log('📝 Server will start first, then client will follow');
console.log('🌍 Once both are running, your app will be available');
