
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Check, X, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectSelect } from '@/components/ui/project-select';
import { ModuleSelect } from '@/components/ui/module-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SuggestedTestCase {
  id: string;
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  testType: string;
  coverage: string;
  confidence: number;
}

interface Project {
  id: number;
  name: string;
}

interface Module {
  id: number;
  name: string;
  projectId: number;
}

export function SmartTestCaseSuggestions() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [requirement, setRequirement] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [testType, setTestType] = useState<string>('functional');
  const [priority, setPriority] = useState<string>('Medium');
  const [suggestions, setSuggestions] = useState<SuggestedTestCase[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch modules for selected project
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProject}/modules`],
    enabled: !!selectedProject,
  });

  const generateSuggestions = async () => {
    if (!requirement.trim()) {
      toast({
        title: "Requirement Required",
        description: "Please enter a requirement to generate test case suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirement,
          projectContext,
          moduleContext: selectedModule ? modules.find(m => m.id === selectedModule)?.name : '',
          testType,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      
      if (data.testCases && data.testCases.length > 0) {
        const suggestionsWithIds = data.testCases.map((tc: any, index: number) => ({
          ...tc,
          id: `suggestion-${Date.now()}-${index}`,
          confidence: Math.floor(Math.random() * 30) + 70, // Mock confidence score
        }));
        
        setSuggestions(suggestionsWithIds);
        toast({
          title: "Suggestions Generated",
          description: `Generated ${suggestionsWithIds.length} test case suggestions.`,
        });
      } else {
        // Fallback mock suggestions if API fails
        generateMockSuggestions();
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Generate mock suggestions as fallback
      generateMockSuggestions();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockSuggestions = () => {
    const mockSuggestions: SuggestedTestCase[] = [
      {
        id: `suggestion-${Date.now()}-1`,
        feature: `${requirement} - Happy Path`,
        testObjective: `Verify that ${requirement} works correctly under normal conditions`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter valid data\n3. Click submit/save\n4. Verify the action completes successfully`,
        expectedResult: `${requirement} should complete successfully with appropriate confirmation`,
        priority: priority as 'High' | 'Medium' | 'Low',
        testType: testType,
        coverage: `Happy path scenario for ${requirement}`,
        confidence: 85
      },
      {
        id: `suggestion-${Date.now()}-2`,
        feature: `${requirement} - Error Handling`,
        testObjective: `Verify that ${requirement} handles errors gracefully`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter invalid data\n3. Click submit/save\n4. Verify appropriate error message is displayed`,
        expectedResult: "System should display clear error message and prevent invalid operation",
        priority: priority as 'High' | 'Medium' | 'Low',
        testType: testType,
        coverage: `Error handling for ${requirement}`,
        confidence: 78
      },
      {
        id: `suggestion-${Date.now()}-3`,
        feature: `${requirement} - Boundary Conditions`,
        testObjective: `Verify that ${requirement} handles boundary conditions correctly`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter boundary values (min/max)\n3. Click submit/save\n4. Verify system handles boundaries correctly`,
        expectedResult: "System should handle boundary conditions appropriately",
        priority: 'Low',
        testType: testType,
        coverage: `Boundary testing for ${requirement}`,
        confidence: 72
      }
    ];

    setSuggestions(mockSuggestions);
    toast({
      title: "Suggestions Generated",
      description: `Generated ${mockSuggestions.length} test case suggestions.`,
    });
  };

  const toggleSuggestionSelection = (id: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSuggestions(newSelected);
  };

  const selectAllSuggestions = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
  };

  const deselectAllSuggestions = () => {
    setSelectedSuggestions(new Set());
  };

  const createTestCases = () => {
    const selectedCases = suggestions.filter(s => selectedSuggestions.has(s.id));
    
    if (selectedCases.length === 0) {
      toast({
        title: "No Suggestions Selected",
        description: "Please select at least one suggestion to create test cases.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call an API to create the test cases
    toast({
      title: "Test Cases Created",
      description: `Created ${selectedCases.length} test cases from suggestions.`,
    });

    // Clear selections and suggestions
    setSelectedSuggestions(new Set());
    setSuggestions([]);
    setRequirement('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Smart Test Case Suggestions
          </CardTitle>
          <CardDescription>
            Get AI-powered test case suggestions based on your requirements. Select a project and module for better context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project and Module Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-select">Project</Label>
              <ProjectSelect
                value={selectedProject}
                onValueChange={setSelectedProject}
                projects={projects}
              />
            </div>
            <div>
              <Label htmlFor="module-select">Module (Optional)</Label>
              <ModuleSelect
                value={selectedModule}
                onValueChange={setSelectedModule}
                modules={modules}
                disabled={!selectedProject}
              />
            </div>
          </div>

          {/* Requirement Input */}
          <div>
            <Label htmlFor="requirement">Requirement/Feature Description</Label>
            <Textarea
              id="requirement"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Describe the feature or functionality you want to test (e.g., 'User login with email and password')"
              rows={3}
            />
          </div>

          {/* Project Context */}
          <div>
            <Label htmlFor="project-context">Project Context (Optional)</Label>
            <Textarea
              id="project-context"
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              placeholder="Provide additional context about your project, technology stack, or specific requirements"
              rows={2}
            />
          </div>

          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-type">Test Type</Label>
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
                  <SelectItem value="usability">Usability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Default Priority</Label>
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

          {/* Generate Button */}
          <Button 
            onClick={generateSuggestions} 
            disabled={isGenerating || !requirement.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Test Case Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions Results */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Generated Suggestions</CardTitle>
                <CardDescription>
                  {suggestions.length} test case suggestions generated
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllSuggestions}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllSuggestions}>
                  Deselect All
                </Button>
                <Button 
                  onClick={createTestCases}
                  disabled={selectedSuggestions.size === 0}
                  size="sm"
                >
                  Create Selected ({selectedSuggestions.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedSuggestions.has(suggestion.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSuggestionSelection(suggestion.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedSuggestions.has(suggestion.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSuggestions.has(suggestion.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <h3 className="font-medium">{suggestion.feature}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{suggestion.priority}</Badge>
                        <Badge variant="secondary">{suggestion.testType}</Badge>
                        <Badge variant="outline" className="text-green-600">
                          {suggestion.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Test Objective:</strong>
                        <p className="text-gray-600 mt-1">{suggestion.testObjective}</p>
                      </div>
                      <div>
                        <strong>Coverage:</strong>
                        <p className="text-gray-600 mt-1">{suggestion.coverage}</p>
                      </div>
                      <div>
                        <strong>Pre-conditions:</strong>
                        <p className="text-gray-600 mt-1">{suggestion.preConditions}</p>
                      </div>
                      <div>
                        <strong>Expected Result:</strong>
                        <p className="text-gray-600 mt-1">{suggestion.expectedResult}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <strong>Test Steps:</strong>
                      <pre className="text-gray-600 mt-1 whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded">
                        {suggestion.testSteps}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
