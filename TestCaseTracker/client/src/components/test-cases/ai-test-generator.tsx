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
import { Sparkles, Upload, Globe, Type, Wand2, CheckCircle2, Download, Merge, Settings, Loader2, Bug, GitBranch, Eye } from "lucide-react";
import type { Module, TestCase } from "@/types";
import { useLocation } from "wouter";

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

export function AITestGenerator({ projectId: selectedProjectId, modules, onTestCasesGenerated }: AITestGeneratorProps) {
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
  const [viewingTestCase, setViewingTestCase] = useState<GeneratedTestCase | null>(null);
  const [showTestCaseDialog, setShowTestCaseDialog] = useState(false);

  // AI Provider selection state is now managed within formData
  const [showResults, setShowResults] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedProviderForKey, setSelectedProviderForKey] = useState<string>("gemini"); // Default to gemini or the initial aiProvider
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({});

  // New state for flow diagram generation
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);

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
        const response = await fetch(`/api/projects/${selectedProjectId}/test-cases`, {
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

  const handleGenerate = async () => {
    if (!formData.requirement.trim() && formData.inputType === 'text') {
      toast({
        title: "Input Required",
        description: "Please provide a text prompt.",
        variant: "destructive",
      });
      return;
    }

    if (formData.inputType === 'url' && !formData.websiteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please provide a website URL to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (formData.inputType === 'image' && selectedImages.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image for analysis.",
        variant: "destructive",
      });
      return;
    }

    const selectedModule = modules.find(m => m.id === (selectedModuleId === undefined ? undefined : Number(selectedModuleId))); // Ensure selectedModuleId is number or undefined

    generateMutation.mutate({
      requirement: formData.requirement,
      projectContext: formData.projectContext,
      moduleContext: selectedModule?.name || '',
      testType: formData.testType,
      priority: formData.priority,
      websiteUrl: formData.inputType === 'url' ? formData.websiteUrl : '',
      inputType: formData.inputType,
      images: formData.inputType === 'image' ? selectedImages : [],
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

      // Generate tags based on test type
      const generateTagsFromTestType = (testType: string) => {
        const tagColors = {
          'functional': '#3b82f6',    // blue
          'integration': '#10b981',   // green
          'unit': '#f59e0b',         // amber
          'e2e': '#8b5cf6',          // purple
          'security': '#ef4444',     // red
          'performance': '#f97316',  // orange
          'api': '#06b6d4',          // cyan
          'ui': '#ec4899',           // pink
          'smoke': '#84cc16',        // lime
          'regression': '#6366f1'    // indigo
        };

        const baseTag = {
          name: testType.charAt(0).toUpperCase() + testType.slice(1),
          color: tagColors[testType.toLowerCase()] || '#6b7280'
        };

        // Add priority-based tag
        const priorityTag = {
          name: `${testCase.priority} Priority`,
          color: testCase.priority === 'High' ? '#dc2626' :
                 testCase.priority === 'Medium' ? '#d97706' : '#16a34a'
        };

        // Add coverage-based tag if available
        const coverageTag = testCase.coverage ? {
          name: testCase.coverage.split(' ').slice(0, 2).join(' '), // Take first two words
          color: '#64748b'
        } : null;

        return [baseTag, priorityTag, coverageTag].filter(Boolean);
      };

      return {
        projectId: selectedProjectId,
        moduleId: selectedModule?.id || null, // Use the found module's ID
        feature: testCase.feature,
        testObjective: testCase.testObjective,
        preConditions: testCase.preConditions,
        testSteps: testCase.testSteps,
        expectedResult: testCase.expectedResult,
        priority: testCase.priority,
        testType: testCase.testType,
        status: 'Not Executed',
        comments: `Generated by AI - ${testCase.coverage}`,
        tags: generateTagsFromTestType(testCase.testType),
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

  const viewTestCase = (testCase: GeneratedTestCase) => {
    setViewingTestCase(testCase);
    setShowTestCaseDialog(true);
  };

  // Fetch API key status on mount
  React.useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const [, navigate] = useLocation();

  // Handler for generating flow diagrams
  const handleGenerateFlowDiagram = async () => {
    if (!selectedProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFlow(true);
    try {
      // Get test cases for the selected project
      const testCasesResponse = await fetch(`/api/test-cases?projectId=${selectedProjectId}`);
      const testCasesData = await testCasesResponse.json();

      if (!testCasesData || testCasesData.length === 0) {
        toast({
          title: "No test cases found",
          description: "Please add test cases to generate a flow diagram.",
          variant: "destructive",
        });
        return;
      }

      // Generate Mermaid flow diagram code
      let mermaidCode = 'flowchart TD\n';

      // Start node
      mermaidCode += '    A[Start Testing] --> B[Setup Environment]\n';

      // Add test case nodes
      testCasesData.forEach((testCase: any, index: number) => {
        const nodeId = `TC${index + 1}`;
        const nextNodeId = index < testCasesData.length - 1 ? `TC${index + 2}` : 'END';
        const prevNodeId = index === 0 ? 'B' : `TC${index}`;

        // Sanitize test case title for Mermaid
        const sanitizedTitle = testCase.testCaseId?.replace(/[^a-zA-Z0-9\s]/g, '') || `Test Case ${index + 1}`;

        mermaidCode += `    ${prevNodeId} --> ${nodeId}["${sanitizedTitle}"]\n`;

        // Add status-based styling
        if (testCase.status === 'Pass') {
          mermaidCode += `    ${nodeId} --> ${nodeId}_PASS[✓ Passed]\n`;
          mermaidCode += `    ${nodeId}_PASS --> ${nextNodeId === 'END' ? 'END' : nextNodeId}\n`;
        } else if (testCase.status === 'Fail') {
          mermaidCode += `    ${nodeId} --> ${nodeId}_FAIL[✗ Failed]\n`;
          mermaidCode += `    ${nodeId}_FAIL --> ${nextNodeId === 'END' ? 'END' : nextNodeId}\n`;
        } else {
          if (nextNodeId !== 'END') {
            mermaidCode += `    ${nodeId} --> ${nextNodeId}\n`;
          } else {
            mermaidCode += `    ${nodeId} --> END\n`;
          }
        }
      });

      // End node
      mermaidCode += '    END[Testing Complete]\n\n';

      // Add styling
      mermaidCode += '    classDef passStyle fill:#d4edda,stroke:#155724,color:#155724\n';
      mermaidCode += '    classDef failStyle fill:#f8d7da,stroke:#721c24,color:#721c24\n';
      mermaidCode += '    classDef startEndStyle fill:#e7f3ff,stroke:#0056b3,color:#0056b3\n';

      // Apply styles to nodes
      mermaidCode += '    class A,B,END startEndStyle\n';
      testCasesData.forEach((testCase: any, index: number) => {
        const nodeId = `TC${index + 1}`;
        if (testCase.status === 'Pass') {
          mermaidCode += `    class ${nodeId}_PASS passStyle\n`;
        } else if (testCase.status === 'Fail') {
          mermaidCode += `    class ${nodeId}_FAIL failStyle\n`;
        }
      });

      // Create a dialog to show the Mermaid diagram
      const mermaidDialog = document.createElement('div');
      mermaidDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      const dialogContent = document.createElement('div');
      dialogContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        position: relative;
      `;

      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      `;
      closeButton.onclick = () => document.body.removeChild(mermaidDialog);

      const title = document.createElement('h2');
      title.textContent = 'Test Case Flow Diagram';
      title.style.cssText = 'margin: 0 0 20px 0; color: #333;';

      const mermaidContainer = document.createElement('div');
      mermaidContainer.id = 'mermaid-flow-container';
      mermaidContainer.style.cssText = 'min-height: 400px; width: 100%;';

      const codeSection = document.createElement('div');
      codeSection.style.cssText = 'margin-top: 20px;';

      const codeTitle = document.createElement('h3');
      codeTitle.textContent = 'Mermaid Code:';
      codeTitle.style.cssText = 'margin: 0 0 10px 0; color: #333;';

      const codeBlock = document.createElement('pre');
      codeBlock.style.cssText = `
        background: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        border: 1px solid #ddd;
      `;
      codeBlock.textContent = mermaidCode;

      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy Code';
      copyButton.style.cssText = `
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      `;
      copyButton.onclick = () => {
        navigator.clipboard.writeText(mermaidCode);
        toast({
          title: "Copied!",
          description: "Mermaid code copied to clipboard",
        });
      };

      codeSection.appendChild(codeTitle);
      codeSection.appendChild(codeBlock);
      codeSection.appendChild(copyButton);

      dialogContent.appendChild(closeButton);
      dialogContent.appendChild(title);
      dialogContent.appendChild(mermaidContainer);
      dialogContent.appendChild(codeSection);
      mermaidDialog.appendChild(dialogContent);
      document.body.appendChild(mermaidDialog);

      // Import and render Mermaid dynamically
      const mermaid = await import('mermaid');
      await mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });

      try {
        const { svg } = await mermaid.default.render('generated-flow-diagram', mermaidCode);
        mermaidContainer.innerHTML = svg;
      } catch (renderError) {
        console.error('Mermaid render error:', renderError);
        mermaidContainer.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center;">
            <p>Error rendering diagram. Please check the Mermaid code below.</p>
          </div>
        `;
      }

      toast({
        title: "Success",
        description: `Flow diagram generated with ${testCasesData.length} test cases`,
      });

    } catch (error) {
      console.error("Error generating flow diagram:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate flow diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleGenerateFlowDiagram}
        disabled={isGeneratingFlow}
      >
        {isGeneratingFlow ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitBranch className="h-4 w-4" />
        )}
        Flow Diagram
      </Button>

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
                      <TableHead className="w-20">Actions</TableHead>
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewTestCase(testCase)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
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

        {/* Individual Test Case View Dialog */}
        <Dialog open={showTestCaseDialog} onOpenChange={setShowTestCaseDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Test Case Details
              </DialogTitle>
            </DialogHeader>

            {viewingTestCase && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</Label>
                    <div className="mt-1">
                      <Badge variant={viewingTestCase.priority === 'High' ? 'destructive' : viewingTestCase.priority === 'Medium' ? 'default' : 'secondary'}>
                        {viewingTestCase.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{viewingTestCase.testType}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{viewingTestCase.category}</Badge>
                    </div>
                  </div>
                </div>

                {/* Feature */}
                <div>
                  <Label className="text-lg font-semibold">Feature</Label>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{viewingTestCase.feature}</p>
                </div>

                {/* Test Objective */}
                <div>
                  <Label className="text-lg font-semibold">Test Objective</Label>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{viewingTestCase.testObjective}</p>
                </div>

                {/* Pre-Conditions */}
                <div>
                  <Label className="text-lg font-semibold">Pre-Conditions</Label>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingTestCase.preConditions}</p>
                  </div>
                </div>

                {/* Test Steps */}
                <div>
                  <Label className="text-lg font-semibold">Test Steps</Label>
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {viewingTestCase.testSteps.split('\n').map((step, index) => (
                        <div key={index} className="mb-2 flex gap-2">
                          <span className="text-green-600 dark:text-green-400 font-medium min-w-[20px]">
                            {step.trim().match(/^\d+\./) ? '' : `${index + 1}.`}
                          </span>
                          <span>{step.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expected Result */}
                <div>
                  <Label className="text-lg font-semibold">Expected Result</Label>
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingTestCase.expectedResult}</p>
                  </div>
                </div>

                {/* Coverage */}
                <div>
                  <Label className="text-lg font-semibold">Coverage</Label>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{viewingTestCase.coverage}</p>
                </div>

                {/* Tags */}
                {viewingTestCase.tags && viewingTestCase.tags.length > 0 && (
                  <div>
                    <Label className="text-lg font-semibold">Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {viewingTestCase.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowTestCaseDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const index = generatedTestCases.indexOf(viewingTestCase);
                      if (index !== -1) {
                        toggleTestCaseSelection(index);
                      }
                      setShowTestCaseDialog(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Select for Merge
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Dialog>
    </div>
  );
}