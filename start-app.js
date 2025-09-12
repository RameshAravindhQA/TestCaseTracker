
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TestCaseTracker Application...');

// Kill any existing processes
const killCommand = spawn('pkill', ['-f', 'tsx|vite|concurrently'], { stdio: 'inherit' });
killCommand.on('close', () => {
  setTimeout(() => {
    // Start server
    console.log('📡 Starting backend server...');
    const server = spawn('npm', ['run', 'dev'], {
      cwd: join(__dirname, 'server'),
      stdio: 'inherit',
      detached: false
    });

    // Start client after a short delay
    setTimeout(() => {
      console.log('🎨 Starting frontend client...');
      const client = spawn('npm', ['run', 'dev'], {
        cwd: join(__dirname, 'client'),
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
