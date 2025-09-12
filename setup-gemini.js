
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Google Gemini API Setup\n');

console.log('To get your Google Gemini API key:');
console.log('1. Visit: https://aistudio.google.com/app/apikey');
console.log('2. Create a new API key');
console.log('3. Copy the key (it should start with "AIza")\n');

rl.question('Enter your Google Gemini API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting...');
    rl.close();
    return;
  }

  if (!apiKey.startsWith('AIza')) {
    console.log('⚠️  Warning: API key doesn\'t start with "AIza". This might not be a valid Gemini key.');
  }

  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Found existing .env file');
  } else {
    console.log('📄 Creating new .env file');
  }

  // Update or add the GOOGLE_API_KEY
  const lines = envContent.split('\n');
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('GOOGLE_API_KEY=')) {
      lines[i] = `GOOGLE_API_KEY=${apiKey}`;
      found = true;
      break;
    }
  }

  if (!found) {
    lines.push(`GOOGLE_API_KEY=${apiKey}`);
  }

  // Add other required environment variables if they don't exist
  const requiredVars = [
    'DATABASE_URL=file:./dev.db',
    'NODE_ENV=development',
    'PORT=5000',
    'SESSION_SECRET=your-session-secret-here'
  ];

  requiredVars.forEach(varLine => {
    const varName = varLine.split('=')[0];
    const exists = lines.some(line => line.startsWith(varName + '='));
    if (!exists) {
      lines.push(varLine);
    }
  });

  // Write the updated .env file
  fs.writeFileSync(envPath, lines.join('\n'));

  console.log('✅ API key saved to .env file');
  console.log('🔄 Please restart the server to apply changes');
  
  rl.close();
});
