#!/usr/bin/env node

/**
 * Test Run Script
 * 
 * This script runs the folder rename tests.
 * To run: node test-run-script.js
 */

console.log('Starting folder rename tests...');

try {
  // Import the test runner
  const { run } = require('./run-folder-tests');
  
  console.log('✨ Test runner imported successfully');
  console.log('🧪 Running folder rename tests...');
  
  // Run the tests
  run().then(() => {
    console.log('✅ All tests completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test run failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to import test runner:', error);
  process.exit(1);
}