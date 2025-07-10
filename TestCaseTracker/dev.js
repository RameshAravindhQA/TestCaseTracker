#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Change to TestCaseTracker directory and run the dev command
process.chdir(path.join(__dirname, 'TestCaseTracker'));

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});