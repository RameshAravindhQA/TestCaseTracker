
#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Running Messenger One-on-One Chat Tests...\n');

try {
  // Run the specific messenger test
  execSync('npx vitest run server/__tests__/messenger-one-on-one.test.ts --reporter=verbose', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All messenger tests passed!');
} catch (error) {
  console.error('\n❌ Some tests failed:', error.message);
  process.exit(1);
}
