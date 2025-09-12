
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

async function testProviders() {
  console.log('🧪 Testing AI Providers Configuration...\n');
  
  // Test Gemini
  console.log('=== GEMINI TEST ===');
  const geminiKey = process.env.GOOGLE_API_KEY;
  console.log('Gemini API Key:', {
    configured: !!geminiKey,
    length: geminiKey?.length || 0,
    format: geminiKey?.startsWith('AIza') || false,
    preview: geminiKey ? `${geminiKey.substring(0, 15)}...` : 'NONE'
  });

  if (geminiKey && geminiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent('Generate a simple test case for user login');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini working! Response length:', text.length);
      console.log('📄 Preview:', text.substring(0, 200) + '...\n');
    } catch (error) {
      console.error('❌ Gemini test failed:', error.message, '\n');
    }
  } else {
    console.log('❌ Gemini not properly configured\n');
  }

  // Test OpenAI
  console.log('=== OPENAI TEST ===');
  const openaiKey = process.env.OPENAI_API_KEY;
  console.log('OpenAI API Key:', {
    configured: !!openaiKey,
    length: openaiKey?.length || 0,
    format: openaiKey?.startsWith('sk-') || false,
    preview: openaiKey ? `${openaiKey.substring(0, 15)}...` : 'NONE'
  });

  if (openaiKey && openaiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({
        apiKey: openaiKey,
      });
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'Generate a simple test case for user login' }],
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
      });
      
      const text = completion.choices[0]?.message?.content || '';
      console.log('✅ OpenAI working! Response length:', text.length);
      console.log('📄 Preview:', text.substring(0, 200) + '...\n');
    } catch (error) {
      console.error('❌ OpenAI test failed:', error.message, '\n');
    }
  } else {
    console.log('❌ OpenAI not properly configured\n');
  }

  console.log('🏁 AI Provider tests completed!');
}

// Run if called directly
if (require.main === module) {
  testProviders().catch(console.error);
}

module.exports = { testProviders };
