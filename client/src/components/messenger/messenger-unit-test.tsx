import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface ConversationTestResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

interface MessageTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function MessengerUnitTest() {
  const [testResults, setTestResults] = useState<{
    conversation: ConversationTestResult | null;
    message: MessageTestResult | null;
  }>({
    conversation: null,
    message: null
  });
  const [isRunning, setIsRunning] = useState(false);
  const [testConversationId, setTestConversationId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from the unit test.');

  const runConversationTest = async () => {
    setIsRunning(true);
    try {
      // Create a test conversation
      const response = await apiRequest('POST', '/api/chats', {
        type: 'direct',
        title: 'Unit Test Conversation',
        participants: [1, 2], // Admin and another user
        isActive: true
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation = await response.json();
      setTestConversationId(conversation.id);
      
      setTestResults(prev => ({
        ...prev,
        conversation: {
          success: true,
          conversationId: conversation.id
        }
      }));

      toast({
        title: 'Conversation Test Passed',
        description: `Created conversation with ID: ${conversation.id}`,
      });

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        conversation: {
          success: false,
          error: error.message
        }
      }));

      toast({
        title: 'Conversation Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runMessageTest = async () => {
    if (!testConversationId) {
      toast({
        title: 'Error',
        description: 'Please run conversation test first',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    try {
      // Send a test message
      const response = await apiRequest('POST', `/api/chats/${testConversationId}/messages`, {
        message: testMessage,
        type: 'text'
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        message: {
          success: true,
          messageId: message.id
        }
      }));

      toast({
        title: 'Message Test Passed',
        description: `Sent message with ID: ${message.id}`,
      });

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        message: {
          success: false,
          error: error.message
        }
      }));

      toast({
        title: 'Message Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    await runConversationTest();
    // Wait a bit before running message test
    setTimeout(() => {
      if (testConversationId) {
        runMessageTest();
      }
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Messenger Unit Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button 
            onClick={runConversationTest} 
            disabled={isRunning}
            variant="outline"
          >
            Test Conversation
          </Button>
          <Button 
            onClick={runMessageTest} 
            disabled={isRunning || !testConversationId}
            variant="outline"
          >
            Test Message
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
          >
            Run All Tests
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Test Message:</label>
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message..."
            rows={2}
          />
        </div>

        {testConversationId && (
          <div className="p-2 bg-green-50 rounded border border-green-200">
            <strong>Active Conversation ID:</strong> {testConversationId}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          
          <div className="space-y-2">
            <div className={`p-3 rounded border ${
              testResults.conversation === null ? 'bg-gray-50 border-gray-200' :
              testResults.conversation.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="font-medium">Conversation Test</div>
              {testResults.conversation === null && (
                <div className="text-sm text-gray-600">Not run yet</div>
              )}
              {testResults.conversation?.success && (
                <div className="text-sm text-green-600">
                  ✅ Success - ID: {testResults.conversation.conversationId}
                </div>
              )}
              {testResults.conversation?.error && (
                <div className="text-sm text-red-600">
                  ❌ Failed: {testResults.conversation.error}
                </div>
              )}
            </div>

            <div className={`p-3 rounded border ${
              testResults.message === null ? 'bg-gray-50 border-gray-200' :
              testResults.message.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="font-medium">Message Test</div>
              {testResults.message === null && (
                <div className="text-sm text-gray-600">Not run yet</div>
              )}
              {testResults.message?.success && (
                <div className="text-sm text-green-600">
                  ✅ Success - ID: {testResults.message.messageId}
                </div>
              )}
              {testResults.message?.error && (
                <div className="text-sm text-red-600">
                  ❌ Failed: {testResults.message.error}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          This unit test validates the messenger chat functionality by creating conversations and sending messages.
        </div>
      </CardContent>
    </Card>
  );
}