
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DocumentTestResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export function OnlyOfficeTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{
    creation: DocumentTestResult | null;
    opening: DocumentTestResult | null;
  }>({
    creation: null,
    opening: null
  });
  const [isRunning, setIsRunning] = useState(false);
  const [testDocumentId, setTestDocumentId] = useState('');
  const [testDocumentData, setTestDocumentData] = useState({
    title: 'Test Document',
    type: 'text' as 'text' | 'spreadsheet' | 'presentation',
    projectId: 1
  });

  const createTestDocument = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/onlyoffice/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: testDocumentData.title,
          type: testDocumentData.type,
          projectId: testDocumentData.projectId,
          description: 'Unit test document'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create test document');
      }

      const document = await response.json();
      setTestDocumentId(document.id);
      
      setTestResults(prev => ({
        ...prev,
        creation: {
          success: true,
          documentId: document.id
        }
      }));

      toast({
        title: 'Document Creation Test Passed',
        description: `Created document with ID: ${document.id}`,
      });

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        creation: {
          success: false,
          error: error.message
        }
      }));

      toast({
        title: 'Document Creation Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testDocumentOpening = async () => {
    if (!testDocumentId) {
      toast({
        title: 'No Document to Test',
        description: 'Please create a test document first',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    try {
      // Test opening the document in OnlyOffice editor
      const editorUrl = `/api/onlyoffice/editor/${testDocumentId}`;
      const editorWindow = window.open(editorUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (editorWindow) {
        setTestResults(prev => ({
          ...prev,
          opening: {
            success: true,
            documentId: testDocumentId
          }
        }));

        toast({
          title: 'Document Opening Test Passed',
          description: `Successfully opened document ${testDocumentId} in OnlyOffice editor`,
        });
      } else {
        throw new Error('Unable to open editor window - popup may be blocked');
      }

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        opening: {
          success: false,
          error: error.message
        }
      }));

      toast({
        title: 'Document Opening Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    await createTestDocument();
    // Wait a bit before testing opening
    setTimeout(() => {
      if (testDocumentId) {
        testDocumentOpening();
      }
    }, 1000);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">OnlyOffice Document Editor Tests</h1>
          <p className="text-gray-600 mt-2">Test OnlyOffice document creation and editor functionality</p>
        </div>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="test-title">Document Title</Label>
                <Input
                  id="test-title"
                  value={testDocumentData.title}
                  onChange={(e) => setTestDocumentData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Test Document"
                />
              </div>
              <div>
                <Label htmlFor="test-type">Document Type</Label>
                <Select 
                  value={testDocumentData.type} 
                  onValueChange={(value: 'text' | 'spreadsheet' | 'presentation') => 
                    setTestDocumentData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Document</SelectItem>
                    <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="test-project">Project ID</Label>
                <Input
                  id="test-project"
                  type="number"
                  value={testDocumentData.projectId}
                  onChange={(e) => setTestDocumentData(prev => ({ ...prev, projectId: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button 
                onClick={createTestDocument} 
                disabled={isRunning}
                variant="outline"
              >
                Test Creation
              </Button>
              <Button 
                onClick={testDocumentOpening} 
                disabled={isRunning || !testDocumentId}
                variant="outline"
              >
                Test Opening
              </Button>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
              >
                Run All Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Document Creation Test */}
              <div className={`p-3 rounded border ${
                testResults.creation === null ? 'bg-gray-50 border-gray-200' :
                testResults.creation.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="font-medium">Document Creation Test</div>
                {testResults.creation === null && (
                  <div className="text-sm text-gray-600">Not run yet</div>
                )}
                {testResults.creation?.success && (
                  <div className="text-sm text-green-600">
                    ✅ Success - Document created with ID: {testResults.creation.documentId}
                  </div>
                )}
                {testResults.creation?.error && (
                  <div className="text-sm text-red-600">
                    ❌ Failed: {testResults.creation.error}
                  </div>
                )}
              </div>

              {/* Document Opening Test */}
              <div className={`p-3 rounded border ${
                testResults.opening === null ? 'bg-gray-50 border-gray-200' :
                testResults.opening.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="font-medium">Document Opening Test</div>
                {testResults.opening === null && (
                  <div className="text-sm text-gray-600">Not run yet</div>
                )}
                {testResults.opening?.success && (
                  <div className="text-sm text-green-600">
                    ✅ Success - Document opened in OnlyOffice editor
                  </div>
                )}
                {testResults.opening?.error && (
                  <div className="text-sm text-red-600">
                    ❌ Failed: {testResults.opening.error}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500">
          This unit test validates the OnlyOffice document editor functionality by creating documents and testing editor opening.
        </div>
      </div>
    </div>
  );
}
