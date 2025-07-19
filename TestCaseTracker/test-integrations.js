
import { geminiService } from './server/gemini-service.js';
import { storage } from './server/storage.js';

// Test 1: AI Generator
console.log('🧪 Testing AI Generator...');

async function testAIGenerator() {
  try {
    const testRequest = {
      requirement: 'User registration with email and password validation',
      projectContext: 'Test App',
      moduleContext: 'Authentication',
      testType: 'functional',
      priority: 'High',
      inputType: 'text'
    };

    console.log('📝 Generating test cases...');
    const response = await geminiService.generateTestCases(testRequest);
    
    console.log('✅ AI Generator Test Results:');
    console.log(`- Source: ${response.source}`);
    console.log(`- Test Cases Generated: ${response.testCases.length}`);
    console.log(`- Message: ${response.message}`);
    
    if (response.testCases.length > 0) {
      console.log('✅ AI Generator working correctly');
      return true;
    } else {
      console.log('❌ AI Generator returned no test cases');
      return false;
    }
  } catch (error) {
    console.error('❌ AI Generator test failed:', error.message);
    return false;
  }
}

// Test 2: Messenger
console.log('🧪 Testing Messenger...');

async function testMessenger() {
  try {
    // Create test users
    const user1 = await storage.createUser({
      firstName: 'Test',
      lastName: 'User1',
      email: 'test1@example.com',
      password: 'hashed_password',
      role: 'Tester'
    });

    const user2 = await storage.createUser({
      firstName: 'Test',
      lastName: 'User2', 
      email: 'test2@example.com',
      password: 'hashed_password',
      role: 'Tester'
    });

    console.log('👥 Created test users:', user1.id, user2.id);

    // Create direct conversation
    const conversation = await storage.createDirectConversation(user1.id, user2.id);
    console.log('💬 Created conversation:', conversation.id);

    // Send test message
    const message = await storage.createChatMessage({
      userId: user1.id,
      receiverId: user2.id,
      conversationId: conversation.id,
      message: 'Hello, this is a test message!',
      type: 'text'
    });

    console.log('📨 Created message:', message.id);

    // Retrieve messages
    const messages = await storage.getMessagesByChat(conversation.id);
    console.log('📬 Retrieved messages:', messages.length);

    if (messages.length > 0) {
      console.log('✅ Messenger working correctly');
      return true;
    } else {
      console.log('❌ Messenger returned no messages');
      return false;
    }
  } catch (error) {
    console.error('❌ Messenger test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Integration Tests...\n');
  
  const aiResult = await testAIGenerator();
  console.log('');
  const messengerResult = await testMessenger();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`AI Generator: ${aiResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Messenger: ${messengerResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (aiResult && messengerResult) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
  }
}

runTests().catch(console.error);
