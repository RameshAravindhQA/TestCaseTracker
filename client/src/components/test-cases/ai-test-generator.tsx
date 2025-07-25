import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, Check } from "lucide-react";
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
}

interface AITestGeneratorProps {
  projectId: number;
  modules: Module[];
  onTestCasesGenerated: (testCases: Partial<TestCase>[]) => void;
}

export function AITestGenerator({ projectId, modules, onTestCasesGenerated }: AITestGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [requirement, setRequirement] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [moduleId, setModuleId] = useState<number>();
  const [testType, setTestType] = useState<string>("functional");
  const [priority, setPriority] = useState<string>("Medium");
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();

  const generateTestCases = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending AI request with data:', data);
      try {
        const response = await apiRequest('POST', '/api/ai/generate-test-cases', data);
        console.log('AI API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API Error response:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Unknown error' };
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('AI API Success response:', result);
        return result;
      } catch (error) {
        console.error('AI Generation request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('AI Generation Response:', data);
      setShowResults(true);
      
      if (data.testCases && Array.isArray(data.testCases) && data.testCases.length > 0) {
        setGeneratedTestCases(data.testCases);
        toast({
          title: "Test Cases Generated",
          description: data.message || `Generated ${data.testCases.length} test cases successfully`,
        });
      } else if (data.error) {
        toast({
          title: "Generation Failed",
          description: data.error || "The AI couldn't generate test cases",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Test Cases Generated",
          description: "The AI couldn't generate test cases for the given requirements. Try providing more detailed requirements.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('AI Generation error:', error);
      toast({
        title: "Generation failed",
        description: `Failed to generate test cases: ${error.message || error}. Please check your requirements and try again.`,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!requirement.trim()) {
      toast({
        title: "Requirement needed",
        description: "Please provide a requirement description.",
        variant: "destructive",
      });
      return;
    }

    const selectedModule = modules.find(m => m.id === moduleId);

    generateTestCases.mutate({
      requirement,
      projectContext,
      moduleContext: selectedModule?.name,
      testType,
      priority,
    });
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

  const handleAddSelected = () => {
    const selectedCases = generatedTestCases
      .filter((_, index) => selectedTestCases.has(index))
      .map(tc => ({
        moduleId: moduleId || modules[0]?.id,
        feature: tc.feature,
        testObjective: tc.testObjective,
        preConditions: tc.preConditions,
        testSteps: tc.testSteps,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        status: "Not Executed" as const,
        comments: `Generated by AI - ${tc.coverage}`,
      }));

    onTestCasesGenerated(selectedCases);
    setOpen(false);
    setShowResults(false);
    setGeneratedTestCases([]);
    setSelectedTestCases(new Set());
    setRequirement("");
    setProjectContext("");

    toast({
      title: "Test cases added!",
      description: `Added ${selectedCases.length} AI-generated test cases.`,
    });
  };

  const resetForm = () => {
    setShowResults(false);
    setGeneratedTestCases([]);
    setSelectedTestCases(new Set());
    setRequirement("");
    setProjectContext("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Test Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Test Case Generator
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive test cases from your requirements using AI
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirement Description *</label>
              <Textarea
                placeholder="Describe the feature or functionality you want to test..."
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project Context (Optional)</label>
              <Input
                placeholder="e.g., E-commerce platform, Banking app, etc."
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Module</label>
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

            <div className="flex justify-end gap-2">
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
                Generate Test Cases
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Test Cases</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Generate More
                </Button>
                <Button 
                  onClick={handleAddSelected}
                  disabled={selectedTestCases.size === 0}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Selected ({selectedTestCases.size})
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      <div className="flex gap-1">
                        <Badge variant={testCase.priority === 'High' ? 'destructive' : testCase.priority === 'Medium' ? 'default' : 'secondary'}>
                          {testCase.priority}
                        </Badge>
                        <Badge variant="outline">{testCase.testType}</Badge>
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
                        <pre className="text-muted-foreground whitespace-pre-wrap text-xs">
                          {testCase.testSteps}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium">Expected Result:</span>
                        <p className="text-muted-foreground">{testCase.expectedResult}</p>
                      </div>
                      <div>
                        <span className="font-medium">Coverage:</span>
                        <Badge variant="outline" className="ml-2">{testCase.coverage}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}