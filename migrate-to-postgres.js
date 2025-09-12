
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 PostgreSQL Migration Helper');
console.log('==============================\n');

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in environment variables');
  console.log('Please create a PostgreSQL database in Replit first:\n');
  console.log('1. Open a new tab in Replit and type "Database"');
  console.log('2. Click "create a database"');
  console.log('3. Wait for the database to be created');
  console.log('4. Run this script again\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');
console.log('🔄 Updating storage import...\n');

// Update server/index.ts to use database storage
const indexPath = path.join(__dirname, 'server', 'index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('import { storage } from "./storage"')) {
  indexContent = indexContent.replace(
    'import { storage } from "./storage"',
    'import { storage } from "./db-storage"'
  );
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Updated server/index.ts to use database storage');
} else {
  console.log('ℹ️  Storage import already configured');
}

console.log('\n🔄 Next steps:');
console.log('1. Run: npx drizzle-kit push:pg');
console.log('2. Restart your application');
console.log('3. Your data will now be stored in PostgreSQL!\n');

console.log('✅ Migration preparation complete!');
