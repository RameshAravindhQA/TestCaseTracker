
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AITestGenerator } from "@/components/test-cases/ai-test-generator";
import { ProjectSelect } from "@/components/ui/project-select";
import { ModuleSelect } from "@/components/ui/module-select";
import { useQuery } from "@tanstack/react-query";
import { Project, Module, TestCase } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Brain, Zap, Target, Wand2, ArrowRight } from "lucide-react";

export default function AIGeneratorPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | string>("");

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });

  // Filter modules by selected project
  const filteredModules = modules?.filter(module => 
    module.projectId === parseInt(selectedProjectId.toString())
  ) || [];

  const handleTestCasesGenerated = (testCases: Partial<TestCase>[]) => {
    // Refresh test cases data
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/test-cases`] });
    
    toast({
      title: "🎯 Test Cases Merged Successfully!",
      description: `${testCases.length} AI-generated test cases have been added to your project`,
    });
  };

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(parseInt(value));
    setSelectedModuleId("");
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-500 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Test Case Generator</h1>
                <p className="text-muted-foreground mt-1">
                  Generate comprehensive test cases using AI with Google Gemini
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-purple-200 hover:border-purple-300 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Smart Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  AI analyzes your requirements and generates comprehensive test scenarios
                  covering edge cases and boundary conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Multi-Input Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Generate test cases from text requirements, website URLs, and images
                  with intelligent analysis capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:border-green-300 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  Direct Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Generated test cases can be directly merged into your project
                  with proper formatting and organization.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Select Project & Module
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project *</label>
                  <ProjectSelect
                    projects={projects}
                    isLoading={isProjectsLoading}
                    selectedProjectId={selectedProjectId}
                    onChange={handleProjectChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Module (Optional)</label>
                  <ModuleSelect
                    modules={filteredModules}
                    isLoading={isModulesLoading}
                    selectedModuleId={selectedModuleId}
                    onChange={(value) => setSelectedModuleId(value ? parseInt(value) : "")}
                    disabled={!selectedProjectId || isModulesLoading}
                    placeholder="Select a module"
                    includeAllOption={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generator */}
          {selectedProjectId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Ready to Generate Test Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Project Selected: {projects?.find(p => p.id === parseInt(selectedProjectId.toString()))?.name}
                    </h3>
                    {selectedModuleId && (
                      <p className="text-gray-600 mt-1">
                        Module: {filteredModules.find(m => m.id === parseInt(selectedModuleId.toString()))?.name}
                      </p>
                    )}
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  
                  <AITestGenerator
                    projectId={Number(selectedProjectId)}
                    modules={filteredModules}
                    onTestCasesGenerated={handleTestCasesGenerated}
                  />
                  
                  <p className="text-sm text-gray-500 max-w-md text-center">
                    Click the button above to open the AI Test Generator with multiple input options:
                    Text Prompt, Website URL inspection, and Image Upload analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Select a Project to Continue</h3>
                    <p className="text-gray-500 mt-1">
                      Please select a project above to start generating AI test cases
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ol className="list-decimal list-inside space-y-2">
                <li>Select your project from the dropdown above</li>
                <li>Optionally select a specific module for more targeted test cases</li>
                <li>Click "AI Test Generator" to open the generation dialog</li>
                <li>Choose your input method: Text Prompt, Website URL, or Image Upload</li>
                <li>Review the generated test cases in the results table</li>
                <li>Select the test cases you want to keep</li>
                <li>Click "Merge Selected" to add them to your project</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
