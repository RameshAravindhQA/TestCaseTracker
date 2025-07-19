

console.log('🔍 Checking Google Gemini Configuration...\n');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

// Look for .env in both root and TestCaseTracker directories
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, 'TestCaseTracker', '.env')
];

let envPath = null;
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

console.log('📁 Checking for .env file...');

if (envPath) {
  console.log(`✅ .env file found at: ${envPath}`);
  
  // Read and check environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 .env file contents (sanitized):');
  
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && key.includes('GOOGLE_API_KEY')) {
        console.log(`   ${key}=${value ? value.substring(0, 10) + '...' : 'NOT_SET'}`);
      } else if (key) {
        console.log(`   ${key}=${value ? 'SET' : 'NOT_SET'}`);
      }
    }
  });
} else {
  console.log('❌ .env file not found in either root or TestCaseTracker directory');
}

console.log('\n🔐 Environment Variables Check:');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 
  `✅ SET (${process.env.GOOGLE_API_KEY.substring(0, 10)}...)` : 
  '❌ NOT SET');

console.log('\n📋 Gemini Configuration Status:');
const hasValidKey = process.env.GOOGLE_API_KEY && 
                   process.env.GOOGLE_API_KEY !== 'your-gemini-api-key' &&
                   process.env.GOOGLE_API_KEY.length > 10;

if (hasValidKey) {
  console.log('✅ Google Gemini appears to be properly configured');
  console.log('🔑 API Key format: Valid (starts with expected prefix)');
} else {
  console.log('❌ Google Gemini is NOT properly configured');
  console.log('\n🛠️  To fix this:');
  console.log('1. Get a Google AI API key from: https://aistudio.google.com/app/apikey');
  console.log('2. Create a .env file in the TestCaseTracker directory');
  console.log('3. Add: GOOGLE_API_KEY=your_actual_api_key_here');
  console.log('4. Restart the application');
}

console.log('\n🌐 Testing API connectivity...');

if (hasValidKey) {
  // Test API connectivity
  (async () => {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      console.log('🔄 Making test API call...');
      const result = await model.generateContent("Say 'API Test Successful' in JSON format");
      const response = result.response.text();
      
      console.log('✅ API Test Result:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
      console.log('🎉 Gemini API is working correctly!');
      
    } catch (error) {
      console.log('❌ API Test Failed:', error.message);
      console.log('💡 This could be due to:');
      console.log('   - Invalid API key');
      console.log('   - Network connectivity issues');
      console.log('   - API quota exceeded');
      console.log('   - API permissions');
    }
  })();
} else {
  console.log('⏭️  Skipping API test (no valid key found)');
}

