
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Upload, 
  Link, 
  Search, 
  Download,
  Plus,
  Merge,
  FileText,
  Image as ImageIcon,
  Globe,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedTestCase {
  id: string;
  title: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
  selected: boolean;
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

export default function AIGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('description');
  const [projectDescription, setProjectDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  // Fetch modules for selected project
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['/api/modules', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await apiRequest('GET', `/api/modules?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // Generate test cases mutation
  const generateTestCasesMutation = useMutation({
    mutationFn: async (data: {
      type: 'description' | 'url' | 'image';
      content: string;
      images?: File[];
      projectId?: number;
      moduleId?: number;
    }) => {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('content', data.content);
      if (data.projectId) formData.append('projectId', data.projectId.toString());
      if (data.moduleId) formData.append('moduleId', data.moduleId.toString());
      
      if (data.images) {
        data.images.forEach((image, index) => {
          formData.append(`images`, image);
        });
      }

      const response = await apiRequest('POST', '/api/ai/generate-test-cases', formData, { isFormData: true });
      if (!response.ok) throw new Error('Failed to generate test cases');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedTestCases(data.testCases.map((tc: any, index: number) => ({
        ...tc,
        id: `generated-${Date.now()}-${index}`,
        selected: true
      })));
      toast({
        title: "✨ Test cases generated!",
        description: `Generated ${data.testCases.length} test cases using AI`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Generation failed",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Merge test cases mutation
  const mergeTestCasesMutation = useMutation({
    mutationFn: async (data: {
      testCases: GeneratedTestCase[];
      projectId: number;
      moduleId: number;
    }) => {
      const response = await apiRequest('POST', '/api/ai/merge-test-cases', data);
      if (!response.ok) throw new Error('Failed to merge test cases');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Test cases merged!",
        description: `Successfully added ${data.mergedCount} test cases to the project`,
      });
      setGeneratedTestCases([]);
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error) => {
      toast({
        title: "❌ Merge failed",
        description: "Failed to merge test cases. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setUploadedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (!selectedProject || !selectedModule) {
      toast({
        title: "⚠️ Missing selection",
        description: "Please select a project and module first",
        variant: "destructive",
      });
      return;
    }

    let content = '';
    let type: 'description' | 'url' | 'image' = 'description';

    switch (activeTab) {
      case 'description':
        if (!projectDescription.trim()) {
          toast({
            title: "⚠️ Missing description",
            description: "Please provide a project description",
            variant: "destructive",
          });
          return;
        }
        content = projectDescription;
        type = 'description';
        break;
      case 'url':
        if (!websiteUrl.trim()) {
          toast({
            title: "⚠️ Missing URL",
            description: "Please provide a website URL",
            variant: "destructive",
          });
          return;
        }
        content = websiteUrl;
        type = 'url';
        break;
      case 'images':
        if (uploadedImages.length === 0) {
          toast({
            title: "⚠️ No images",
            description: "Please upload at least one image",
            variant: "destructive",
          });
          return;
        }
        content = 'Image analysis';
        type = 'image';
        break;
    }

    setIsGenerating(true);
    generateTestCasesMutation.mutate({
      type,
      content,
      images: type === 'image' ? uploadedImages : undefined,
      projectId: selectedProject,
      moduleId: selectedModule,
    });
  };

  const handleMergeSelected = () => {
    const selectedTestCases = generatedTestCases.filter(tc => tc.selected);
    
    if (selectedTestCases.length === 0) {
      toast({
        title: "⚠️ No test cases selected",
        description: "Please select at least one test case to merge",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProject || !selectedModule) {
      toast({
        title: "⚠️ Missing selection",
        description: "Please select a project and module",
        variant: "destructive",
      });
      return;
    }

    mergeTestCasesMutation.mutate({
      testCases: selectedTestCases,
      projectId: selectedProject,
      moduleId: selectedModule,
    });
  };

  const toggleTestCaseSelection = (id: string) => {
    setGeneratedTestCases(prev => 
      prev.map(tc => 
        tc.id === id ? { ...tc, selected: !tc.selected } : tc
      )
    );
  };

  const selectedCount = generatedTestCases.filter(tc => tc.selected).length;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Sparkles className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Test Case Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate comprehensive test cases using Google Gemini AI
          </p>
        </div>
      </div>

      {/* Project and Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Target Project & Module</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject?.toString() || ''} onValueChange={(value) => {
                setSelectedProject(parseInt(value));
                setSelectedModule(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Module</label>
              <Select 
                value={selectedModule?.toString() || ''} 
                onValueChange={(value) => setSelectedModule(parseInt(value))}
                disabled={!selectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
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
          </div>
        </CardContent>
      </Card>

      {/* Input Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Input Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Website URL</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4" />
                <span>Images</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Textarea
                placeholder="Describe your project, features, or functionality you want to test..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="min-h-[200px]"
              />
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <Input
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                AI will analyze the website structure and content to generate relevant test cases
              </p>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <p className="text-sm text-gray-600">
                  Upload screenshots, mockups, or UI designs for analysis
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                      <p className="text-xs text-center mt-1 truncate">{image.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || generateTestCasesMutation.isPending}
              className="w-full md:w-auto"
            >
              {isGenerating || generateTestCasesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Test Cases
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Test Cases */}
      {generatedTestCases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Generated Test Cases ({generatedTestCases.length})</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedCount} selected</Badge>
                <Button 
                  onClick={handleMergeSelected}
                  disabled={selectedCount === 0 || mergeTestCasesMutation.isPending}
                  size="sm"
                >
                  {mergeTestCasesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {generatedTestCases.map((testCase, index) => (
                <motion.div
                  key={testCase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`cursor-pointer transition-colors ${testCase.selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={testCase.selected}
                          onChange={() => toggleTestCaseSelection(testCase.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{testCase.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                testCase.priority === 'Critical' ? 'destructive' :
                                testCase.priority === 'High' ? 'default' :
                                testCase.priority === 'Medium' ? 'secondary' : 'outline'
                              }>
                                {testCase.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {testCase.description}
                          </p>
                          <div className="text-sm space-y-1">
                            <p><strong>Preconditions:</strong> {testCase.preconditions}</p>
                            <div>
                              <strong>Steps:</strong>
                              <ol className="list-decimal list-inside ml-4 space-y-1">
                                {testCase.steps.map((step, stepIndex) => (
                                  <li key={stepIndex}>{step}</li>
                                ))}
                              </ol>
                            </div>
                            <p><strong>Expected Result:</strong> {testCase.expectedResult}</p>
                          </div>
                          {testCase.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {testCase.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
