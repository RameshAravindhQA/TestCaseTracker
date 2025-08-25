
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, Key, TestTube } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface APIConfigFormProps {
  onConfigured?: () => void;
}

export function AIAPIConfig({ onConfigured }: APIConfigFormProps) {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const providers = [
    { value: 'gemini', label: 'Google Gemini', placeholder: 'AIzaSy...' },
    { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
    { value: 'claude', label: 'Claude', placeholder: 'sk-ant-...' },
    { value: 'grok', label: 'Grok', placeholder: 'xai-...' },
  ];

  const handleConfigure = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }

    setIsConfiguring(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        });
        
        setTestResult(data.testResult);
        
        if (onConfigured) {
          onConfigured();
        }
      } else {
        toast({
          title: "Error",
          description: data.error || 'Configuration failed',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Configuration error:', error);
      toast({
        title: "Error",
        description: 'Failed to configure API key',
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const selectedProvider = providers.find(p => p.value === provider);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI API Configuration
        </CardTitle>
        <CardDescription>
          Configure your AI provider API key to enable test case generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="provider">AI Provider</Label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {providers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider?.placeholder || 'Enter your API key...'}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleConfigure}
          disabled={isConfiguring || !apiKey.trim()}
          className="w-full"
        >
          {isConfiguring ? (
            <>
              <TestTube className="mr-2 h-4 w-4 animate-spin" />
              Configuring & Testing...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Configure API Key
            </>
          )}
        </Button>

        {testResult && (
          <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              {testResult.success ? (
                <span className="text-green-700">
                  ✅ API key is working! Generated {testResult.testCasesGenerated} test cases.
                </span>
              ) : (
                <span className="text-red-700">
                  ❌ API key test failed: {testResult.error}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>For Google Gemini:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></li>
            <li>Create a new API key</li>
            <li>Copy and paste it above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
