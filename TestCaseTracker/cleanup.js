
#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🧹 Cleaning up system resources...');

// Kill any hanging Node.js processes
exec('pkill -f "node.*npm"', (error) => {
  if (error && error.code !== 1) {
    console.log('No hanging npm processes found');
  } else {
    console.log('✅ Cleaned up hanging npm processes');
  }
});

exec('pkill -f "node.*vite"', (error) => {
  if (error && error.code !== 1) {
    console.log('No hanging vite processes found');
  } else {
    console.log('✅ Cleaned up hanging vite processes');
  }
});

// Wait a moment for cleanup to complete
setTimeout(() => {
  console.log('🚀 Cleanup complete, ready to restart');
}, 1000);
