
import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Key, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIProvider {
  provider: string;
  name: string;
  description: string;
  keyFormat: string;
  available: boolean;
  error?: string;
  isFree: boolean;
}

interface TestCase {
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: string;
  testType: string;
  coverage: string;
  category: string;
  tags: string[];
}

interface AITestGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCasesGenerated: (testCases: TestCase[]) => void;
  projectId?: string;
  moduleId?: string;
}

export function AITestGenerator({
  isOpen,
  onClose,
  onTestCasesGenerated,
  projectId,
  moduleId,
}: AITestGeneratorProps) {
  const [requirement, setRequirement] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [moduleContext, setModuleContext] = useState("");
  const [testType, setTestType] = useState("functional");
  const [priority, setPriority] = useState("Medium");
  const [aiProvider, setAiProvider] = useState("gemini");
  const [inputType, setInputType] = useState("text");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [elementInspection, setElementInspection] = useState("");
  const [userFlows, setUserFlows] = useState("");
  const [businessRules, setBusinessRules] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Fetch available AI providers
  const { data: providers = [], refetch: refetchProviders } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: async (): Promise<AIProvider[]> => {
      const response = await fetch("/api/ai/providers", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch AI providers");
      const data = await response.json();
      return data.providers || [];
    },
  });

  // API Key management mutation
  const updateAPIKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const response = await fetch("/api/ai/update-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!response.ok) throw new Error("Failed to update API key");
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "API Key Updated",
        description: `${variables.provider} API key has been updated successfully.`,
      });
      refetchProviders();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  // AI Generation Mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🚀 Starting AI test case generation:", data);

      const response = await fetch("/api/ai/generate-enhanced-test-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ AI generation successful:", data);
      setGeneratedTestCases(data.testCases || []);
      setShowResults(true);
      toast({
        title: "Test Cases Generated!",
        description: `Successfully generated ${data.testCases?.length || 0} test cases using ${data.provider || 'AI'}.`,
      });
    },
    onError: (error: any) => {
      console.error("❌ AI generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate test cases. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!requirement.trim() && !websiteUrl.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide either a requirement description or website URL.",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      requirement,
      projectContext,
      moduleContext,
      testType,
      priority,
      websiteUrl,
      elementInspection,
      userFlows,
      businessRules,
      inputType,
      aiProvider,
    };

    generateMutation.mutate(requestData);
  };

  const handleUseTestCases = () => {
    onTestCasesGenerated(generatedTestCases);
    onClose();
    setShowResults(false);
    setGeneratedTestCases([]);
  };

  const handleUpdateAPIKey = (provider: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey?.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }

    updateAPIKeyMutation.mutate({ provider, apiKey });
  };

  const getProviderIcon = (provider: AIProvider) => {
    if (provider.available) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getProviderBadge = (provider: AIProvider) => {
    if (provider.available) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
    }
    return <Badge variant="destructive">Unavailable</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold">🤖 AI Test Case Generator Pro</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Powered by Multiple AI Services</p>
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Provider Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {providers.map((provider) => (
                  <Card key={provider.provider}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getProviderIcon(provider)}
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          {provider.isFree && <Badge variant="outline" className="text-green-600">Free</Badge>}
                        </div>
                        {getProviderBadge(provider)}
                      </div>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`${provider.provider}-key`}>
                            API Key <span className="text-gray-500">({provider.keyFormat})</span>
                          </Label>
                          <div className="flex space-x-2 mt-1">
                            <Input
                              id={`${provider.provider}-key`}
                              type="password"
                              placeholder={`Enter ${provider.name} API key`}
                              value={apiKeys[provider.provider] || ""}
                              onChange={(e) => setApiKeys(prev => ({
                                ...prev,
                                [provider.provider]: e.target.value
                              }))}
                            />
                            <Button
                              onClick={() => handleUpdateAPIKey(provider.provider)}
                              disabled={updateAPIKeyMutation.isPending}
                              size="sm"
                            >
                              {updateAPIKeyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Key className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {provider.error && (
                          <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                            <Info className="h-4 w-4 text-red-500 mt-0.5" />
                            <p className="text-sm text-red-700">{provider.error}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* AI Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Provider Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Choose AI Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem 
                          key={provider.provider} 
                          value={provider.provider}
                          disabled={!provider.available}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              {getProviderIcon(provider)}
                              <span>{provider.name}</span>
                              {provider.isFree && <Badge variant="outline" className="text-green-600 text-xs">Free</Badge>}
                            </div>
                            {provider.available ? (
                              <Badge variant="secondary" className="ml-2">Available</Badge>
                            ) : (
                              <Badge variant="destructive" className="ml-2">Unavailable</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {providers.find(p => p.provider === aiProvider)?.description || 
                     "Select an AI provider for intelligent test case generation"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Project & Module Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project & Module Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Module (Optional)</Label>
                    <Input
                      placeholder="Select Module"
                      value={moduleContext}
                      onChange={(e) => setModuleContext(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Test Type</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="e2e">End-to-End</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="ui">UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Input Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    variant={inputType === "text" ? "default" : "outline"}
                    onClick={() => setInputType("text")}
                    className="flex-1"
                  >
                    📝 Text Prompt
                  </Button>
                  <Button
                    variant={inputType === "url" ? "default" : "outline"}
                    onClick={() => setInputType("url")}
                    className="flex-1"
                  >
                    🌐 Website URL
                  </Button>
                  <Button
                    variant={inputType === "image" ? "default" : "outline"}
                    onClick={() => setInputType("image")}
                    className="flex-1"
                  >
                    🖼️ Image Upload
                  </Button>
                </div>

                {inputType === "text" && (
                  <div>
                    <Label>Test Requirements / User Story</Label>
                    <Textarea
                      placeholder="Describe what you want to test. For example: 'User registration form with email validation and password strength requirements'"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}

                {inputType === "url" && (
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="min-w-[140px]"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    🚀 Generate Test Cases
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Test Cases ({generatedTestCases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedTestCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{testCase.feature}</h4>
                        <Badge variant="outline">{testCase.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{testCase.testObjective}</p>
                      <div className="text-xs text-gray-500">
                        <strong>Steps:</strong> {testCase.testSteps.split('\n').length} steps
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Back to Generator
              </Button>
              <Button onClick={handleUseTestCases} className="min-w-[140px]">
                Use These Test Cases
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
