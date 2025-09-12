
const fetch = require('node-fetch');

async function testAIServices() {
  console.log('🧪 Testing AI Services...\n');
  
  try {
    // Test the AI generation endpoint
    const response = await fetch('http://localhost:5000/api/ai/test-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requirement: 'User registration with email validation and password strength checking',
        testType: 'functional',
        priority: 'High',
        aiProvider: 'gemini'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AI Service Test PASSED');
      console.log('📊 Results:', {
        testCases: result.testInfo.testCasesGenerated,
        source: result.testInfo.source,
        provider: result.testInfo.provider,
        isRealAI: result.testInfo.isRealAI
      });
      
      if (result.testInfo.isRealAI) {
        console.log('🎉 REAL AI is working!');
      } else {
        console.log('⚠️  Using mock service - check API keys');
      }
      
      console.log('\n📋 Generated Test Cases:');
      result.result.testCases.forEach((tc, index) => {
        console.log(`${index + 1}. ${tc.feature}`);
        console.log(`   ${tc.testObjective}`);
        console.log('   ---');
      });
    } else {
      console.error('❌ AI Service Test FAILED');
      console.error('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAIServices();
