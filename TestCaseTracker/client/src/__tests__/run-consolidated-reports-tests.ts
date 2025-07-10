
import { execSync } from 'child_process';

console.log('Running Consolidated Reports Data Loading Tests...\n');

try {
  // Run the specific test file
  const result = execSync('npm run test client/src/__tests__/components/reports/consolidated-reports-data-fix.test.tsx', {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error);
  process.exit(1);
}
