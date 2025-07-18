import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Wand2, Download, FileText, Plus, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectSelect } from '@/components/ui/project-select';
import { ModuleSelect } from '@/components/ui/module-select';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface GeneratedTestCase {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  type: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  category: string;
  selected?: boolean;
}

export default function AIGeneratorPage() {
  const [description, setDescription] = useState('');
  const [testingType, setTestingType] = useState('functional');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      return response.json();
    }
  });

  const { data: modules } = useQuery({
    queryKey: ['modules', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/modules?projectId=${selectedProject}`);
      return response.json();
    },
    enabled: !!selectedProject
  });

  const generateTestCasesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai/generate-test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate test cases');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedTests(data.map((test: any) => ({ ...test, selected: true })));
      toast({ title: 'Success', description: 'Test cases generated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to generate test cases', variant: 'destructive' });
    }
  });

  const mergeTestCasesMutation = useMutation({
    mutationFn: async (testCases: GeneratedTestCase[]) => {
      const selectedTests = testCases.filter(test => test.selected);
      const promises = selectedTests.map(test => 
        fetch('/api/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: test.title,
            description: test.description,
            priority: test.priority,
            type: test.type,
            preconditions: test.preconditions,
            steps: test.steps.join('\n'),
            expectedResult: test.expectedResult,
            projectId: selectedProject,
            moduleId: selectedModule,
            status: 'Not Executed',
            createdById: 1
          })
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      toast({ title: 'Success', description: 'Test cases merged to project successfully!' });
      setGeneratedTests([]);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to merge test cases', variant: 'destructive' });
    }
  });

  const handleGenerate = async (type: 'requirements' | 'image' | 'url') => {
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Please provide a description', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const requestData = {
        projectId: selectedProject,
        moduleId: selectedModule,
        description,
        requirements,
        testingType,
        websiteUrl: type === 'url' ? websiteUrl : undefined
      };

      if (type === 'image' && selectedImage) {
        const base64 = await convertImageToBase64(selectedImage);
        await generateTestCasesMutation.mutateAsync({ ...requestData, imageBase64: base64 });
      } else {
        await generateTestCasesMutation.mutateAsync(requestData);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const toggleTestSelection = (index: number) => {
    setGeneratedTests(prev => 
      prev.map((test, i) => 
        i === index ? { ...test, selected: !test.selected } : test
      )
    );
  };

  const selectAllTests = () => {
    setGeneratedTests(prev => prev.map(test => ({ ...test, selected: true })));
  };

  const deselectAllTests = () => {
    setGeneratedTests(prev => prev.map(test => ({ ...test, selected: false })));
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Test Case Generator</h1>
        <p className="text-muted-foreground">Generate comprehensive test cases using Google Gemini AI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Target Project</Label>
          <ProjectSelect value={selectedProject} onValueChange={setSelectedProject} />
        </div>
        <div>
          <Label>Target Module</Label>
          <ModuleSelect 
            projectId={selectedProject || undefined} 
            value={selectedModule} 
            onValueChange={setSelectedModule}
            disabled={!selectedProject}
          />
        </div>
      </div>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="image">Image Analysis</TabsTrigger>
          <TabsTrigger value="url">URL Inspection</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Generate from Requirements</CardTitle>
              <CardDescription>Describe your feature or functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Feature Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the feature you want to test..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="requirements">Additional Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Any specific requirements, constraints, or acceptance criteria..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="testing-type">Testing Type</Label>
                <Select value={testingType} onValueChange={setTestingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="ui">UI/UX</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleGenerate('requirements')} disabled={isGenerating} className="w-full">
                <Wand2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Test Cases'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Generate from Image</CardTitle>
              <CardDescription>Upload a screenshot, mockup, or UI design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description-image">Image Description *</Label>
                <Textarea
                  id="description-image"
                  placeholder="Describe what this image shows and what needs to be tested..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Upload Image</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  {selectedImage ? (
                    <div>
                      <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt="Selected" 
                        className="max-w-full max-h-48 mx-auto mb-4"
                      />
                      <p className="text-sm text-muted-foreground">{selectedImage.name}</p>
                      <Button variant="outline" onClick={() => setSelectedImage(null)} className="mt-2">
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p>Drag and drop an image or click to browse</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button variant="outline" className="mt-4" onClick={() => document.getElementById('image-upload')?.click()}>
                        Choose File
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Button onClick={() => handleGenerate('image')} disabled={isGenerating || !selectedImage} className="w-full">
                <Wand2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Analyzing Image...' : 'Generate from Image'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Generate from URL</CardTitle>
              <CardDescription>Analyze a website or web application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">Website URL *</Label>
                <Input 
                  id="url" 
                  placeholder="https://example.com" 
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description-url">Testing Focus *</Label>
                <Textarea
                  id="description-url"
                  placeholder="What aspects of this website do you want to test? (e.g., user registration, checkout process, navigation, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button onClick={() => handleGenerate('url')} disabled={isGenerating || !websiteUrl} className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                {isGenerating ? 'Analyzing Website...' : 'Analyze Website'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedTests.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Test Cases</CardTitle>
            <CardDescription>
              {generatedTests.length} test cases generated • {generatedTests.filter(t => t.selected).length} selected
            </CardDescription>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllTests}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllTests}>
                Deselect All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedTests.map((test, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    test.selected ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                  onClick={() => toggleTestSelection(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          test.selected ? 'bg-primary border-primary' : 'border-muted'
                        }`}>
                          {test.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <h4 className="font-medium">{test.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          test.priority === 'High' ? 'bg-red-100 text-red-800' :
                          test.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {test.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Type:</strong> {test.type} | <strong>Category:</strong> {test.category}</p>
                        {test.preconditions && <p><strong>Preconditions:</strong> {test.preconditions}</p>}
                        <p><strong>Steps:</strong> {test.steps.length} step(s)</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button 
                onClick={() => mergeTestCasesMutation.mutate(generatedTests)}
                disabled={!selectedProject || !generatedTests.some(t => t.selected) || mergeTestCasesMutation.isPending}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                {mergeTestCasesMutation.isPending ? 'Merging...' : `Merge ${generatedTests.filter(t => t.selected).length} Test Cases`}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </ErrorBoundary>
  );
}