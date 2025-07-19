import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Plus, Check, Upload, Globe, Code, Eye, Download, Merge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TestCase, Module } from "@/types";

interface GeneratedTestCase {
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  testType: string;
  coverage: string;
  category: string;
  tags: string[];
}

interface AITestGeneratorProps {
  projectId: number;
  modules: Module[];
  onTestCasesGenerated: (testCases: Partial<TestCase>[]) => void;
}

export function AITestGenerator({ projectId, modules, onTestCasesGenerated }: AITestGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  // Form inputs
  const [requirement, setRequirement] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [moduleId, setModuleId] = useState<number>();
  const [testType, setTestType] = useState<string>("functional");
  const [priority, setPriority] = useState<string>("Medium");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [elementInspection, setElementInspection] = useState("");
  const [userFlows, setUserFlows] = useState("");
  const [businessRules, setBusinessRules] = useState("");

  // Results
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Enhanced AI generation with multiple input types
  const generateTestCases = useMutation({
    mutationFn: async (data: any) => {
      console.log('🤖 Starting AI test case generation...', data);

      // Validate required data
      if (!data.requirement && !data.websiteUrl && (!data.images || data.images.length === 0)) {
        throw new Error('At least one input is required: requirement text, website URL, or uploaded images');
      }

      const formData = new FormData();

      // Append all form fields with proper defaults
      formData.append('requirement', data.requirement || '');
      formData.append('projectContext', data.projectContext || '');
      formData.append('moduleContext', data.moduleContext || '');
      formData.append('testType', data.testType || 'functional');
      formData.append('priority', data.priority || 'Medium');
      formData.append('websiteUrl', data.websiteUrl || '');
      formData.append('elementInspection', data.elementInspection || '');
      formData.append('userFlows', data.userFlows || '');
      formData.append('businessRules', data.businessRules || '');
      formData.append('inputType', data.inputType || 'text');

      // Add images if any
      if (data.images && data.images.length > 0) {
        data.images.forEach((image: File, index: number) => {
          formData.append(`images`, image);
        });
        formData.append('imageCount', data.images.length.toString());
      }

      try {
        console.log('🔄 Calling AI Generation API...');
        console.log('📋 Request details:', {
          requirement: data.requirement?.substring(0, 100),
          moduleContext: data.moduleContext,
          testType: data.testType,
          priority: data.priority,
          inputType: data.inputType,
          hasImages: data.images && data.images.length > 0
        });

        // Play sound for AI generation start
        try {
          const { playSound } = await import('../../lib/soundManager.js');
          await playSound('crud');
        } catch (soundError) {
          console.warn('Sound playback failed:', soundError);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout, aborting...');
          controller.abort();
        }, 30000); // 30 seconds timeout

        // Determine if we should use FormData or JSON
        let requestBody: FormData | string;
        let headers: Record<string, string> = {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (data.images && data.images.length > 0) {
          // Use FormData for file uploads
          requestBody = formData;
          console.log('🔄 Using FormData for file uploads');
        } else {
          // Use JSON for text-only requests
          requestBody = JSON.stringify({
            requirement: data.requirement || '',
            projectContext: data.projectContext || '',
            moduleContext: data.moduleContext || '',
            testType: data.testType || 'functional',
            priority: data.priority || 'Medium',
            websiteUrl: data.websiteUrl || '',
            elementInspection: data.elementInspection || '',
            userFlows: data.userFlows || '',
            businessRules: data.businessRules || '',
            inputType: data.inputType || 'text'
          });
          headers['Content-Type'] = 'application/json';
          console.log('🔄 Using JSON for text-only request');
        }

        const response = await fetch('/api/ai/generate-enhanced-test-cases', {
          method: 'POST',
          body: requestBody,


  // Debug function to test AI generation
  const debugAIGeneration = useMutation({
    mutationFn: async () => {
      console.log('🔍 Debug: Testing AI Generation API...');
      
      const response = await fetch('/api/ai/debug-generation', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Debug API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Debug response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Debug test successful:', data);
      toast({
        title: "🔍 AI Generation Debug",
        description: `Debug completed. Service status: ${data.debug.testGeneration?.success ? 'Working' : 'Failed'}`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Debug test failed:', error);
      toast({
        title: "Debug Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

          credentials: 'include',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 AI API Response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          ok: response.ok,
          url: response.url
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500)
          });
          
          // Try to parse error as JSON
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || `API request failed with status ${response.status}`);
          } catch (parseError) {
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
          }
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        let responseData;
        
        try {
          // Get the raw response text
          const responseText = await response.text();
          console.log('📋 Raw response received:', {
            contentType,
            status: response.status,
            statusText: response.statusText,
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 500)
          });
          
          // Check if we got HTML instead of JSON
          if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
            console.error('❌ Server returned HTML page instead of JSON');
            console.error('❌ HTML content preview:', responseText.substring(0, 1000));
            throw new Error('Server error: Received HTML page instead of API response. This usually indicates a server-side error or routing issue.');
          }
          
          // Check content type
          if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Invalid content type:', {
              expectedContentType: 'application/json',
              actualContentType: contentType,
              responsePreview: responseText.substring(0, 200)
            });
            throw new Error(`Invalid response format: Expected JSON but got ${contentType || 'unknown'}`);
          }
          
          // Try to parse as JSON
          if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response from server');
          }
          
          responseData = JSON.parse(responseText);
          console.log('✅ Successfully parsed JSON response:', {
            success: responseData.success,
            testCasesCount: responseData.testCases?.length || 0,
            source: responseData.source,
            hasAnalysis: !!responseData.analysis,
            hasError: !!responseData.error
          });
          
        } catch (parseError: any) {
          console.error('❌ Response parsing failed:', {
            error: parseError.message,
            contentType,
            responseStatus: response.status,
            responseLength: responseText?.length || 0
          });
          
          if (parseError instanceof SyntaxError) {
            throw new Error('Server returned invalid JSON. This may indicate a server error.');
          } else {
            throw new Error(parseError.message || 'Failed to process server response');
          }
        }

        // Validate response structure
        if (!responseData.success) {
          throw new Error(responseData.error || 'AI generation failed');
        }

        if (!responseData.testCases || !Array.isArray(responseData.testCases)) {
          throw new Error('Invalid response: missing test cases array');
        }

        if (responseData.testCases.length === 0) {
          throw new Error('No test cases were generated');
        }

        console.log('✅ AI Generation successful - returning data');
        return responseData;

      } catch (error: any) {
        console.error('❌ AI Generation failed:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500)
        });
        
        // Provide more specific error messages
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again with a shorter requirement or check your connection.');
        } else if (error.message.includes('JSON')) {
          throw new Error('Server response format error. Please try again or contact support if the issue persists.');
        } else if (error.message.includes('status 500')) {
          throw new Error('Internal server error. Please try again in a few moments.');
        } else if (error.message.includes('status 401')) {
          throw new Error('Authentication error. Please refresh the page and try again.');
        }
        
        throw new Error(error.message || 'AI generation failed unexpectedly');
      }
    },
    onSuccess: (data) => {
      console.log('✅ Enhanced AI Generation Response:', data);

      // Play success sound
      try {
        import('../../lib/soundManager.js').then(({ playSound }) => {
          playSound('success');
        });
      } catch (soundError) {
        console.warn('Sound playback failed:', soundError);
      }

      setShowResults(true);
      setAnalysisResults(data.analysis);

      if (data.testCases && Array.isArray(data.testCases) && data.testCases.length > 0) {
        setGeneratedTestCases(data.testCases);

        const sourceLabel = data.source === 'gemini-ai' ? 'Google Gemini AI' : 'Intelligent Mock Service';

        toast({
          title: "🎯 AI Test Cases Generated",
          description: `Generated ${data.testCases.length} comprehensive test cases using ${sourceLabel}`,
        });
      } else {
        toast({
          title: "No Test Cases Generated",
          description: "The AI couldn't generate test cases. Try providing more detailed input.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Enhanced AI Generation error:', error);

      // Play error sound
      try {
        import('../../lib/soundManager.js').then(({ playSound }) => {
          playSound('error');
        });
      } catch (soundError) {
        console.warn('Sound playback failed:', soundError);
      }

      let errorMessage = "Failed to generate test cases. Please try again.";
      let errorTitle = "Generation Failed";

      if (error.message.includes('non-JSON response')) {
        errorMessage = "Server error occurred. The service might be temporarily unavailable. Please try again in a few moments.";
        errorTitle = "Server Error";
      } else if (error.message.includes('AbortError') || error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please check your connection and try again.";
        errorTitle = "Request Timeout";
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = "Internal server error. Please try again or contact support if the issue persists.";
        errorTitle = "Server Error";
      } else if (error.message.includes('HTTP 400')) {
        errorMessage = "Invalid request. Please check your input and try again.";
        errorTitle = "Invalid Request";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Website analysis mutation
  const analyzeWebsite = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/ai/analyze-website', { url });
      if (!response.ok) throw new Error('Failed to analyze website');
      return response.json();
    },
    onSuccess: (data) => {
      setElementInspection(data.elements || '');
      setUserFlows(data.userFlows || '');
      toast({
        title: "🌐 Website Analyzed",
        description: "Extracted UI elements and user flows for test case generation",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the website. Please check the URL.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!requirement.trim() && !websiteUrl.trim() && selectedImages.length === 0) {
      toast({
        title: "Input Required",
        description: "Please provide a requirement, website URL, or upload images.",
        variant: "destructive",
      });
      return;
    }

    const selectedModule = modules.find(m => m.id === moduleId);
    const inputType = activeTab;

    const requestData = {
      requirement,
      projectContext,
      moduleContext: selectedModule?.name,
      testType,
      priority,
      websiteUrl,
      elementInspection,
      userFlows,
      businessRules,
      images: selectedImages,
      inputType
    };

    generateTestCases.mutate(requestData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please upload only image files",
        variant: "destructive",
      });
    }

    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectTestCase = (index: number) => {
    const newSelected = new Set(selectedTestCases);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTestCases(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTestCases.size === generatedTestCases.length) {
      setSelectedTestCases(new Set());
    } else {
      setSelectedTestCases(new Set(generatedTestCases.map((_, index) => index)));
    }
  };

  const handleMergeSelected = () => {
    const selectedCases = generatedTestCases
      .filter((_, index) => selectedTestCases.has(index))
      .map(tc => ({
        projectId: projectId,
        moduleId: moduleId || modules[0]?.id,
        feature: tc.feature,
        testObjective: tc.testObjective,
        preConditions: tc.preConditions,
        testSteps: tc.testSteps,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        status: "Not Executed" as const,
        comments: `Generated by AI${tc.category ? ` - ${tc.category}` : ''}`,
        tags: tc.tags || [],
        testType: tc.testType,
        category: tc.category,
        coverage: tc.coverage,
        createdById: 1 // This should be the current user ID
      }));

    onTestCasesGenerated(selectedCases);
    setOpen(false);
    resetForm();

    toast({
      title: "🚀 Test Cases Merged!",
      description: `Successfully merged ${selectedCases.length} AI-generated test cases into your project`,
    });
  };

  const resetForm = () => {
    setShowResults(false);
    setGeneratedTestCases([]);
    setSelectedTestCases(new Set());
    setAnalysisResults(null);
    setRequirement("");
    setProjectContext("");
    setWebsiteUrl("");
    setSelectedImages([]);
    setElementInspection("");
    setUserFlows("");
    setBusinessRules("");
    setActiveTab("text");
  };

  const exportTestCases = () => {
    const selectedCases = generatedTestCases.filter((_, index) => selectedTestCases.has(index));
    const csvContent = [
      ['Feature', 'Test Objective', 'Pre-conditions', 'Test Steps', 'Expected Result', 'Priority', 'Type', 'Category', 'Tags'].join(','),
      ...selectedCases.map(tc => [
        tc.feature,
        tc.testObjective,
        tc.preConditions,
        tc.testSteps.replace(/\n/g, ' | '),
        tc.expectedResult,
        tc.priority,
        tc.testType,
        tc.category,
        tc.tags?.join('; ') || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-generated-test-cases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onTestCasesGenerated && (
        <DialogTrigger asChild>
          <Button variant="default" className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
            <Sparkles className="h-4 w-4" />
            🤖 AI Test Generator Pro
          </Button>
        </DialogTrigger>
      )}
      {!onTestCasesGenerated && (
        <Button onClick={() => setOpen(true)} variant="default" className="gap-2 w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
          <Sparkles className="h-4 w-4" />
          Start AI Generation
        </Button>
      )}
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Test Case Generator Pro
            <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100">
              Powered by Google Gemini
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive test cases using AI with text, images, URLs, and element inspection
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Image Upload
              </TabsTrigger>
              <TabsTrigger value="inspect" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Element Inspector
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              {/* Common Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Module</label>
                  <Select value={moduleId?.toString()} onValueChange={(value) => setModuleId(parseInt(value))}>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Type</label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="e2e">End-to-End</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Context (Optional)</label>
                <Input
                  placeholder="e.g., E-commerce platform, Banking app, Healthcare system..."
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                />
              </div>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Feature/Requirement Description *</label>
                  <Textarea
                    placeholder="Describe the feature, user story, or functionality you want to test..."
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Rules & Constraints</label>
                  <Textarea
                    placeholder="Specify business rules, validation rules, constraints, and edge cases..."
                    value={businessRules}
                    onChange={(e) => setBusinessRules(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL *</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <Button 
                      onClick={() => analyzeWebsite.mutate(websiteUrl)}
                      disabled={!websiteUrl || analyzeWebsite.isPending}
                      variant="outline"
                    >
                      {analyzeWebsite.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Analyze
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">User Flows to Test</label>
                  <Textarea
                    placeholder="Describe the user journeys and workflows to test..."
                    value={userFlows}
                    onChange={(e) => setUserFlows(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Screenshots/Mockups *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Images
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload screenshots, mockups, or UI designs for analysis
                    </p>
                  </div>
                </div>

                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Images ({selectedImages.length})</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Context</label>
                  <Textarea
                    placeholder="Describe what should be tested in these images..."
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="inspect" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">DOM Elements / Selectors *</label>
                  <Textarea
                    placeholder="Paste DOM elements, CSS selectors, or HTML structure to test..."
                    value={elementInspection}
                    onChange={(e) => setElementInspection(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Focus</label>
                  <Textarea
                    placeholder="Specify what aspects to focus on (interactions, validation, accessibility, etc.)..."
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="secondary" 
                  onClick={() => debugAIGeneration.mutate()}
                  disabled={debugAIGeneration.isPending}
                  size="sm"
                >
                  {debugAIGeneration.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "🔍 Debug"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={generateTestCases.isPending}
                  className="gap-2"
                >
                  {generateTestCases.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate AI Test Cases
                </Button>
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Analysis Results Header */}
            {analysisResults && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">🎯 AI Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Coverage:</span>
                      <Badge variant="outline" className="ml-2">{analysisResults.coverage}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Complexity:</span>
                      <Badge variant="outline" className="ml-2">{analysisResults.complexity}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Focus Areas:</span>
                      <span className="ml-2">{analysisResults.focusAreas}</span>
                    </div>
                    <div>
                      <span className="font-medium">Test Count:</span>
                      <Badge variant="default" className="ml-2">{generatedTestCases.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Generated Test Cases</h3>
                <Badge variant="outline">{generatedTestCases.length} total</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSelectAll} size="sm">
                  {selectedTestCases.size === generatedTestCases.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="outline" onClick={exportTestCases} size="sm" disabled={selectedTestCases.size === 0}>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={resetForm} size="sm">
                  Generate More
                </Button>
                <Button 
                  onClick={handleMergeSelected}
                  disabled={selectedTestCases.size === 0}
                  className="gap-2"
                >
                  <Merge className="h-4 w-4" />
                  Merge Selected ({selectedTestCases.size})
                </Button>
              </div>
            </div>

            {/* Test Cases List */}
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {generatedTestCases.map((testCase, index) => (
                  <Card key={index} className={`cursor-pointer transition-all ${
                    selectedTestCases.has(index) ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950' : ''
                  }`}>
                    <CardHeader 
                      className="pb-2"
                      onClick={() => handleSelectTestCase(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {selectedTestCases.has(index) && (
                              <Check className="h-4 w-4 text-purple-500" />
                            )}
                            {testCase.feature}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {testCase.testObjective}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={testCase.priority === 'High' ? 'destructive' : testCase.priority === 'Medium' ? 'default' : 'secondary'}>
                            {testCase.priority}
                          </Badge>
                          <Badge variant="outline">{testCase.testType}</Badge>
                          {testCase.category && (
                            <Badge variant="secondary">{testCase.category}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Pre-conditions:</span>
                          <p className="text-muted-foreground">{testCase.preConditions}</p>
                        </div>
                        <div>
                          <span className="font-medium">Test Steps:</span>
                          <pre className="text-muted-foreground whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">
                            {testCase.testSteps}
                          </pre>
                        </div>
                        <div>
                          <span className="font-medium">Expected Result:</span>
                          <p className="text-muted-foreground">{testCase.expectedResult}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Coverage:</span>
                          <Badge variant="outline">{testCase.coverage}</Badge>
                          {testCase.tags && testCase.tags.length > 0 && (
                            <div className="flex gap-1">
                              {testCase.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}