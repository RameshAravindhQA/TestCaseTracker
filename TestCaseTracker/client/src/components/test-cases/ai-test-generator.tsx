import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Upload, Globe, Type, Wand2, CheckCircle2, Download, Merge, Settings, Loader2, Bug } from "lucide-react";
import type { Module, TestCase } from "@/types";

interface AITestGeneratorProps {
  projectId: number;
  modules: Module[];
  onTestCasesGenerated: (testCases: Partial<TestCase>[]) => void;
}

interface GeneratedTestCase {
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  testType: string;
  coverage: string;
  category?: string;
  tags?: string[];
}

type InputType = 'text' | 'url' | 'image';
type AIProvider = 'gemini' | 'openai' | 'claude' | 'grok' | 'deepseek' | 'huggingface' | 'cohere' | 'mistral';

const availableProviders = [
  {
    provider: "gemini",
    name: "Google Gemini",
    available: true,
  },
  {
    provider: "openai",
    name: "OpenAI GPT-4",
    available: true,
  },
  {
    provider: "claude",
    name: "Anthropic Claude",
    available: true,
  },
  {
    provider: "grok",
    name: "xAI Grok",
    available: true,
  },
  {
    provider: "deepseek",
    name: "DeepSeek Coder",
    available: true,
  },
  {
    provider: "huggingface",
    name: "Hugging Face",
    available: true,
  },
  {
    provider: "cohere",
    name: "Cohere",
    available: true,
  },
  {
    provider: "mistral",
    name: "Mistral AI",
    available: true,
  },
];

export function AITestGenerator({ projectId, modules, onTestCasesGenerated }: AITestGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InputType>("text");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    requirement: '',
    projectContext: '',
    moduleContext: '',
    testType: 'functional',
    priority: 'Medium',
    websiteUrl: '',
    elementInspection: '',
    userFlows: '',
    businessRules: '',
    inputType: 'text' as InputType,
    aiProvider: 'gemini' as AIProvider,
    testCaseCount: 20
  });

  // Generated test cases and selection
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<number>>(new Set());
  const [selectedModuleId, setSelectedModuleId] = useState<number | undefined>();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // AI Provider selection state is now managed within formData
  const [showResults, setShowResults] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedProviderForKey, setSelectedProviderForKey] = useState<string>("gemini"); // Default to gemini or the initial aiProvider
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'inputType') {
      // Reset specific inputs when input type changes
      setFormData(prev => ({ ...prev, websiteUrl: '', requirement: '' }));
      if (value !== 'image') {
        setSelectedImages([]);
      }
    }
    if (field === 'aiProvider') {
      setSelectedProviderForKey(value);
    }
  };

  // Fetch API Key Status
  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/ai/api-key-status');
      if (!response.ok) {
        throw new Error('Failed to fetch API key status');
      }
      const data: Record<string, boolean> = await response.json();
      setApiKeyStatus(data);
    } catch (error) {
      console.error("Error fetching API key status:", error);
      toast({
        title: "API Key Status Error",
        description: "Could not retrieve API key status.",
        variant: "destructive",
      });
    }
  };

  // Update API Key Mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) => {
      const response = await fetch('/api/ai/update-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update API key for ${data.provider}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Updated",
        description: `API key for ${availableProviders.find(p => p.provider === selectedProviderForKey)?.name} updated successfully.`,
      });
      fetchApiKeyStatus(); // Refresh status
      setShowApiKeyDialog(false);
      setApiKeyInput("");
    },
    onError: (error: any) => {
      console.error("Error updating API key:", error);
      toast({
        title: "API Key Update Failed",
        description: error.message || "Please check your API key and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKey = () => {
    if (!selectedProviderForKey || !apiKeyInput.trim()) {
      toast({
        title: "Input Error",
        description: "Please select a provider and enter an API key.",
        variant: "destructive",
      });
      return;
    }
    updateApiKeyMutation.mutate({ provider: selectedProviderForKey, apiKey: apiKeyInput });
  };

  // AI Generation Mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🚀 Starting AI test case generation:", data);

      try {
        const response = await fetch("/api/ai/generate-enhanced-test-cases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        console.log("📡 API Response:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          ok: response.ok,
          url: response.url
        });

        // Check if we got HTML instead of JSON
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const htmlText = await response.text();
          console.error("❌ Expected JSON but got HTML:", htmlText.substring(0, 200));
          throw new Error("Server returned HTML instead of JSON. This indicates a routing issue.");
        }

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            const errorText = await response.text();
            console.error("Failed to parse error response:", errorText);
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}`;
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log("✅ Response data:", responseData);

        // Handle both new and old response formats
        if (responseData.success !== undefined) {
          if (!responseData.success) {
            throw new Error(responseData.error || "AI generation failed");
          }
          return responseData;
        } else {
          // Legacy format - wrap in success response
          return {
            success: true,
            testCases: responseData.testCases || responseData,
            source: 'legacy'
          };
        }

      } catch (error: any) {
        console.error("❌ API call failed:", {
          error: error.message,
          status: error.status,
          type: typeof error,
          fullError: error
        });

        // Try to extract error message with more context
        let errorMessage = "Failed to generate test cases";
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Add helpful context for common errors
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage += " (Network error - check your connection)";
        } else if (error.message?.includes('timeout')) {
          errorMessage += " (Request timeout - try again)";
        } else if (error.message?.includes('401') || error.message?.includes('403')) {
          errorMessage += " (Authentication error - please refresh and try again)";
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log("✅ AI generation successful:", data);

      const testCases = data.testCases || [];
      const source = data.source || 'unknown';
      const message = data.message;

      if (testCases && Array.isArray(testCases) && testCases.length > 0) {
        setGeneratedTestCases(testCases);
        setShowResults(true);

        let toastMessage = `Generated ${testCases.length} test cases successfully.`;
        if (message) {
          toastMessage += ` (${message})`;
        }

        // Show appropriate message based on AI source
        if (source === 'mock-service') {
          toast({
            title: "Test Cases Generated",
            description: "Test cases generated using mock service (AI providers not available)",
            variant: "warning",
          });
        } else if (data.provider) {
          toast({
            title: "Test Cases Generated! 🎉",
            description: `${toastMessage} using ${data.provider}!`,
          });
        } else {
          toast({
            title: "Test Cases Generated! 🎉",
            description: toastMessage,
          });
        }
      } else {
        console.error("❌ No test cases in response:", data);
        toast({
          title: "Generation Warning",
          description: "No test cases were generated. Please try with a different requirement.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ AI Generation error:', error);

      let errorMessage = "Failed to generate test cases. Please try again.";

      if (error.message) {
        if (error.message.includes('JSON')) {
          errorMessage = "Server configuration error. The API is returning HTML instead of JSON.";
        } else if (error.message.includes('Authentication')) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Merge Test Cases Mutation
  const mergeMutation = useMutation({
    mutationFn: async (testCases: Partial<TestCase>[]) => {
      const results = [];

      for (const testCase of testCases) {
        const response = await fetch(`/api/projects/${projectId}/test-cases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(testCase),
        });

        if (!response.ok) {
          throw new Error(`Failed to create test case: ${testCase.feature}`);
        }

        const result = await response.json();
        results.push(result);
      }

      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "✅ Test Cases Merged Successfully",
        description: `${results.length} test cases have been added to your project`,
      });

      // Call the callback to refresh the parent component
      onTestCasesGenerated(results);

      // Reset the component state
      setGeneratedTestCases([]);
      setSelectedTestCases(new Set());
      setShowResults(false);
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Merge Failed",
        description: error.message || "Failed to merge test cases",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    const selectedModule = modules.find(m => m.id === (selectedModuleId === undefined ? undefined : Number(selectedModuleId))); // Ensure selectedModuleId is number or undefined

    let requirement = '';
    let inputType = activeTab;

    switch (activeTab) {
      case 'text':
        requirement = formData.requirement;
        break;
      case 'url':
        requirement = `Website analysis for: ${formData.websiteUrl}`;
        break;
      case 'image':
        requirement = `UI analysis from ${selectedImages.length} uploaded image(s)`;
        inputType = 'image';
        break;
      default:
        requirement = formData.requirement;
    }

    if (!requirement.trim() && activeTab !== 'image') {
      toast({
        title: "Input Required",
        description: `Please provide ${activeTab === 'text' ? 'a text prompt' : activeTab === 'url' ? 'a website URL' : 'input'}.`,
        variant: "destructive",
      });
      return;
    }

    if (activeTab === 'url' && !formData.websiteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please provide a website URL to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === 'image' && selectedImages.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image for analysis.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      requirement,
      projectContext: formData.projectContext,
      moduleContext: selectedModule?.name || '',
      testType: formData.testType,
      priority: formData.priority,
      websiteUrl: activeTab === 'url' ? formData.websiteUrl : '',
      inputType,
      images: activeTab === 'image' ? selectedImages : [],
      aiProvider: formData.aiProvider,
      testCaseCount: formData.testCaseCount, // Pass the count from form data
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
    // Update form data's inputType if it's currently null or not 'image'
    if (formData.inputType !== 'image') {
      handleInputChange('inputType', 'image');
    }
  };

  const handleMergeTestCases = () => {
    const selectedCases = Array.from(selectedTestCases).map(index => {
      const testCase = generatedTestCases[index];
      const selectedModule = modules.find(m => m.id === (selectedModuleId === undefined ? undefined : Number(selectedModuleId))); // Ensure selectedModuleId is number or undefined

      return {
        projectId,
        moduleId: selectedModule?.id || null, // Use the found module's ID
        feature: testCase.feature,
        testObjective: testCase.testObjective,
        preConditions: testCase.preConditions,
        testSteps: testCase.testSteps,
        expectedResult: testCase.expectedResult,
        priority: testCase.priority,
        testType: testCase.testType,
        status: 'Active',
        comments: `Generated by AI - ${testCase.coverage}`,
        tags: testCase.tags || [],
        // These fields will be auto-generated by the server
        createdById: undefined, // Will be set by server from session
        assignedToId: null,
        estimatedEffort: null,
        actualEffort: null,
        executionHistory: [],
        dependencies: [],
        automationScript: null
      };
    });

    if (selectedCases.length === 0) {
      toast({
        title: "No Test Cases Selected",
        description: "Please select at least one test case to merge.",
        variant: "destructive",
      });
      return;
    }

    mergeMutation.mutate(selectedCases);
  };

  const toggleTestCaseSelection = (index: number) => {
    const newSelection = new Set(selectedTestCases);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedTestCases(newSelection);
  };

  const selectAllTestCases = (checked: boolean) => {
    if (checked) {
      setSelectedTestCases(new Set(generatedTestCases.map((_, index) => index)));
    } else {
      setSelectedTestCases(new Set());
    }
  };

  // Fetch API key status on mount
  React.useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Test Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Test Case Generator Pro
            <Badge variant="secondary">
              {availableProviders.find(p => p.provider === formData.aiProvider)?.name ?? formData.aiProvider}
            </Badge>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log("🔍 Client Debug Info:", {
                    apiKeys: apiKeyStatus,
                    selectedProvider: formData.aiProvider,
                    debugInfo: {
                      timestamp: new Date().toISOString(),
                      userAgent: navigator.userAgent,
                      url: window.location.href
                    }
                  });

                  // Fetch comprehensive debug info from server
                  try {
                    const response = await fetch('/api/ai/debug-comprehensive', {
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const debugData = await response.json();
                    console.log("🔍 Server Debug Info:", debugData);

                    if (debugData.success) {
                      const summary = debugData.summary || {};
                      const debug = debugData.debug || {};

                      // Show user-friendly debug info
                      alert(`🔍 AI Provider Debug Info:

✅ Working Providers: ${summary.workingProviders?.join(', ') || 'None'}
📊 Available Providers: ${summary.availableProviders || 'Unknown'}
🎭 Mock Service: ${summary.mockServiceStatus || 'Unknown'}

Environment:
• Google API Key: ${debug.environment?.hasGoogleApiKey ? (debug.environment?.googleKeyFormat === 'valid' ? '✅ Valid' : '❌ Invalid Format') : '❌ Missing'}
• OpenAI API Key: ${debug.environment?.hasOpenaiApiKey ? (debug.environment?.openaiKeyFormat === 'valid' ? '✅ Valid' : '❌ Invalid Format') : '❌ Missing'}
• GROK API Key: ${debug.environment?.hasGrokApiKey ? (debug.environment?.grokKeyFormat === 'valid' ? '✅ Valid' : '❌ Invalid Format') : '❌ Missing'}

Selected Provider: ${formData.aiProvider}

Check console for detailed technical information.`);
                    } else {
                      throw new Error(debugData.error || 'Debug failed');
                    }
                  } catch (error: any) {
                    console.error("❌ Failed to fetch debug info:", error);
                    alert(`❌ Debug fetch failed: ${error.message}

Client API Status:
${Object.entries(apiKeyStatus).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`).join('\n')}

Selected Provider: ${formData.aiProvider}

Check console and server logs for more details.`);
                  }
                }}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedProviderForKey(formData.aiProvider);
                  setShowApiKeyDialog(true);
                }}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* AI Provider Selection and Test Case Count */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Provider Selection */}
                <div>
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <Select value={formData.aiProvider} onValueChange={(value: AIProvider) => handleInputChange('aiProvider', value)}>
                    <SelectTrigger id="ai-provider" className="mt-1">
                      <SelectValue placeholder="Select AI Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem
                          key={provider.provider}
                          value={provider.provider}
                          disabled={!provider.available}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{provider.name}</span>
                            {!provider.available && (
                              <Badge variant="secondary" className="ml-2">Not Available</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Case Count */}
                <div>
                  <Label htmlFor="test-case-count">Number of Test Cases</Label>
                  <Input
                    id="test-case-count"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.testCaseCount || 20}
                    onChange={(e) => handleInputChange('testCaseCount', parseInt(e.target.value) || 20)}
                    placeholder="Enter number of test cases (e.g., 20)"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Specify how many test cases you want to generate (1-50)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Project and Module Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project & Module Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Module (Optional)</Label>
                    <Select value={selectedModuleId?.toString()} onValueChange={(value) => setSelectedModuleId(value ? parseInt(value) : undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Test Type</Label>
                    <Select value={formData.testType} onValueChange={(value) => handleInputChange('testType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="e2e">End-to-End</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
                </div>
              </CardContent>
            </Card>

            {/* Input Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Input Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text Prompt
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website URL
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Image Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4 mt-4">
                    <div>
                      <Label>Test Requirements / User Story</Label>
                      <Textarea
                        placeholder="Describe what you want to test. For example: 'User registration with email validation and password strength requirements'"
                        value={formData.requirement}
                        onChange={(e) => handleInputChange('requirement', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Project Context (Optional)</Label>
                      <Textarea
                        placeholder="Provide additional context about your application, business rules, or specific requirements..."
                        value={formData.projectContext}
                        onChange={(e) => handleInputChange('projectContext', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4 mt-4">
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={formData.websiteUrl}
                        onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Project Context (Optional)</Label>
                      <Textarea
                        placeholder="Provide additional context about what functionality to focus on..."
                        value={formData.projectContext}
                        onChange={(e) => handleInputChange('projectContext', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4 mt-4">
                    <div>
                      <Label>Upload Images</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload screenshots or mockups for AI analysis
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Files
                        </Button>
                        {selectedImages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-green-600">
                              {selectedImages.length} file(s) selected
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {generateMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Test Cases
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Generated Test Cases</h3>
                <p className="text-sm text-gray-600">
                  {generatedTestCases.length} test cases generated. Select the ones you want to merge.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResults(false)}
                >
                  Back to Generator
                </Button>
                <Button
                  onClick={handleMergeTestCases}
                  disabled={mergeMutation.isPending || selectedTestCases.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {mergeMutation.isPending ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Selected ({selectedTestCases.size})
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Test Cases Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTestCases.size === generatedTestCases.length && generatedTestCases.length > 0}
                        onCheckedChange={selectAllTestCases}
                      />
                    </TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Test Objective</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTestCases.map((testCase, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTestCases.has(index)}
                          onCheckedChange={() => toggleTestCaseSelection(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{testCase.feature}</TableCell>
                      <TableCell className="max-w-xs truncate">{testCase.testObjective}</TableCell>
                      <TableCell>
                        <Badge variant={testCase.priority === 'High' ? 'destructive' : testCase.priority === 'Medium' ? 'default' : 'secondary'}>
                          {testCase.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{testCase.testType}</TableCell>
                      <TableCell className="max-w-xs truncate">{testCase.coverage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>

      {/* API Key Configuration Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure API Key</DialogTitle>
            <DialogDescription>
              Enter your {availableProviders.find(p => p.provider === selectedProviderForKey)?.name} API key
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your API key will be stored securely and used only for test generation
              </p>
            </div>

            {/* Provider-specific instructions */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <div className="font-medium mb-1">Where to get your API key:</div>
              {selectedProviderForKey === 'gemini' && (
                <p>Visit Google AI Studio (makersuite.google.com) to create an API key</p>
              )}
              {selectedProviderForKey === 'openai' && (
                <p>Visit OpenAI Platform (platform.openai.com) → API Keys</p>
              )}
              {selectedProviderForKey === 'claude' && (
                <p>Visit Anthropic Console (console.anthropic.com) → API Keys</p>
              )}
              {selectedProviderForKey === 'grok' && (
                <p>Visit xAI Console (console.x.ai) → API Keys</p>
              )}
              {selectedProviderForKey === 'deepseek' && (
                <p>Visit DeepSeek Platform (platform.deepseek.com) → API Keys (Free tier available)</p>
              )}
              {selectedProviderForKey === 'huggingface' && (
                <p>Visit Hugging Face (huggingface.co) → Settings → Access Tokens (Free tier available)</p>
              )}
              {selectedProviderForKey === 'cohere' && (
                <p>Visit Cohere Dashboard (dashboard.cohere.ai) → API Keys (Free tier available)</p>
              )}
              {selectedProviderForKey === 'mistral' && (
                <p>Visit Mistral AI Console (console.mistral.ai) → API Keys</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApiKeyDialog(false);
                  setApiKeyInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveApiKey}
                disabled={updateApiKeyMutation.isPending || !apiKeyInput.trim()}
              >
                {updateApiKeyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Key'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}