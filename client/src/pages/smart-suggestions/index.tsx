import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Brain, Lightbulb, Target, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Module {
  id: number;
  name: string;
  projectId: number;
}

export default function SmartSuggestionsPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  const { data: modules = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'modules'],
    enabled: !!selectedProject,
  });
  const [analysisType, setAnalysisType] = useState<string>('Feature Testing');
  const [requirements, setRequirements] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const { data: modulesData = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/modules', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/modules?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
    enabled: !!selectedProject
  });

  useEffect(() => {
    if (selectedProject) {
      setSelectedModule('');
    }
  }, [selectedProject]);

  const generateSuggestions = async () => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setIsLoadingAI(true);

    try {
      const response = await fetch('/api/smart-suggestions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: selectedProject,
          module: selectedModule,
          analysisType,
          feature: requirements || 'General functionality'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setHasGeneratedSuggestions(true);
        toast({
            title: "Success",
            description: `Generated ${data.suggestions.length} smart suggestions`
          });
      } else {
        // Fallback to sample data if API fails
        const fallbackSuggestions = [
          {
            id: 1,
            title: "Boundary Value Testing",
            description: "Test edge cases for input fields with minimum and maximum values",
            priority: "High",
            category: "Functional",
            rationale: "Critical for ensuring application handles edge cases properly"
          },
          {
            id: 2,
            title: "Cross-browser Compatibility",
            description: "Verify functionality across different browsers (Chrome, Firefox, Safari, Edge)",
            priority: "Medium",
            category: "Compatibility",
            rationale: "Ensures consistent user experience across platforms"
          },
          {
            id: 3,
            title: "Performance Testing",
            description: "Test application performance under normal and peak load conditions",
            priority: "High",
            category: "Performance",
            rationale: "Critical for user satisfaction and system stability"
          }
        ];
        setSuggestions(fallbackSuggestions);
        setHasGeneratedSuggestions(true);
        toast({
            title: "Warning",
            description: `Failed to generate suggestions from API. Using fallback data.`
          });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsLoadingAI(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'default';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test_case': return <CheckCircle className="w-4 h-4" />;
      case 'improvement': return <Lightbulb className="w-4 h-4" />;
      case 'risk': return <AlertCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <MainLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
          {/* Changed header to gradient logo and text */}
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Smart Test Case Suggestions
            </h1>
            <p className="text-gray-600">AI-powered test case generation and coverage analysis</p>
          </div>
        </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provide details to generate smart test case suggestions
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                      ) : projects.length === 0 ? (
                        <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                      ) : (
                        projects.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Module (Optional)</label>
                  <Select 
                    value={selectedModule} 
                    onValueChange={setSelectedModule}
                    disabled={!selectedProject || modulesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.length > 0 ? (
                        modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No modules available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Analysis Type</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feature Testing">Feature Testing</SelectItem>
                      <SelectItem value="API Testing">API Testing</SelectItem>
                      <SelectItem value="UI Testing">UI Testing</SelectItem>
                      <SelectItem value="Security Testing">Security Testing</SelectItem>
                      <SelectItem value="Performance Testing">Performance Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Feature/Functionality</label>
                  <Textarea
                    placeholder="Describe the detailed requirements, acceptance criteria, business rules or any specific scenarios you want to test..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button 
                  onClick={generateSuggestions}
                  disabled={loading || !selectedProject}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Generate Smart Suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggestions Panel */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
              {isLoadingAI && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <div className="relative">
                    <img
                      src="/images/navadhiti-logo-tree.jpg"
                      alt="NavaDhiti Logo"
                      className="w-16 h-16 object-contain opacity-30 blur-sm"
                    />
                    <Loader2 className="h-8 w-8 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                  </div>
                  <p className="text-gray-600 text-center">
                    Generating intelligent test suggestions...
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Analyzing your project and exploring best practices
                  </p>
                </motion.div>
              )}

              {!isLoadingAI && suggestions.length === 0 && hasGeneratedSuggestions && (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suggestions generated. Try a different configuration.</p>
                </div>
              )}

              {!isLoadingAI && suggestions.length === 0 && !hasGeneratedSuggestions && (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your project settings and generate smart suggestions.</p>
                </div>
              )}

              {!isLoadingAI && suggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(suggestion.type)}
                            <h3 className="font-semibold">{suggestion.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline">
                              {suggestion.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>

                        <div className="bg-muted p-3 rounded text-sm">
                          <strong>Rationale:</strong> {suggestion.rationale}
                        </div>
                      </motion.div>
                    ))}
                  </div>
              </CardContent>
            </Card>

            {/* Tips Panel */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Tips for Better Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be specific about the feature functionality</li>
                  <li>• Include business rules and constraints</li>
                  <li>• Mention user roles and permissions</li>
                  <li>• Describe expected workflows</li>
                  <li>• Include error scenarios</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}