import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash, 
  Calendar, 
  Clock, 
  Users, 
  Target,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TrackerFeatureForm } from './tracker-feature-form';
import { TrackerSubFeatureForm } from './tracker-subfeature-form';
import { format } from 'date-fns';

interface TrackerProjectDetailsProps {
  projectId: number;
  onBack: () => void;
}

export function TrackerProjectDetails({ projectId, onBack }: TrackerProjectDetailsProps) {
  const { toast } = useToast();
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [showSubFeatureForm, setShowSubFeatureForm] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedSubFeature, setSelectedSubFeature] = useState<any>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: [`/api/tracker/projects/${projectId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  // Fetch features
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: [`/api/tracker/features`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
  });

  // Fetch sub-features
  const { data: subFeatures } = useQuery({
    queryKey: [`/api/tracker/sub-features`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/sub-features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch sub-features');
      return response.json();
    },
  });

  // Create feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tracker/features', data);
      if (!response.ok) throw new Error('Failed to create feature');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Feature created successfully' });
      queryClient.invalidateQueries({ queryKey: [`/api/tracker/features`] });
      setShowFeatureForm(false);
      setSelectedFeature(null);
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/tracker/features/${id}`, data);
      if (!response.ok) throw new Error('Failed to update feature');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Feature updated successfully' });
      queryClient.invalidateQueries({ queryKey: [`/api/tracker/features`] });
      setShowFeatureForm(false);
      setSelectedFeature(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    },
  });

  // Create sub-feature mutation
  const createSubFeatureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tracker/sub-features', data);
      if (!response.ok) throw new Error('Failed to create sub-feature');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Sub-feature created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/sub-features'] });
      setShowSubFeatureForm(false);
      setSelectedSubFeature(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create sub-feature',
        variant: 'destructive',
      });
    },
  });

  // Update sub-feature mutation
  const updateSubFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/tracker/sub-features/${id}`, data);
      if (!response.ok) throw new Error('Failed to update sub-feature');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Sub-feature updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/sub-features'] });
      setShowSubFeatureForm(false);
      setSelectedSubFeature(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update sub-feature',
        variant: 'destructive',
      });
    },
  });

  const handleCreateFeature = (data: any) => {
    if (selectedFeature) {
      updateFeatureMutation.mutate({ id: selectedFeature.id, data });
    } else {
      createFeatureMutation.mutate(data);
    }
  };

  const handleCreateSubFeature = (data: any) => {
    if (selectedSubFeature) {
      updateSubFeatureMutation.mutate({ id: selectedSubFeature.id, data });
    } else {
      createSubFeatureMutation.mutate(data);
    }
  };

  const handleEditSubFeature = (subFeature: any) => {
    setSelectedSubFeature(subFeature);
    setShowSubFeatureForm(true);
  };

  const toggleFeatureExpansion = (featureId: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const getFeatureSubFeatures = (featureId: number) => {
    return subFeatures?.filter(sf => sf.featureId === featureId) || [];
  };

  const statusColors = {
    'Planning': 'bg-blue-100 text-blue-800',
    'Design': 'bg-purple-100 text-purple-800',
    'Development': 'bg-orange-100 text-orange-800',
    'Testing': 'bg-yellow-100 text-yellow-800',
    'Deployment': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Blocked': 'bg-red-100 text-red-800',
  };

  const workTypeColors = {
    'Development': 'bg-blue-500',
    'QA': 'bg-green-500',
    'DevOps': 'bg-purple-500',
    'Designing': 'bg-pink-500',
    'Analysis': 'bg-orange-500',
    'Documentation': 'bg-gray-500',
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <Badge className={statusColors[project.status] || 'bg-gray-100 text-gray-800'}>
          {project.status}
        </Badge>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Features</span>
            </div>
            <p className="text-2xl font-bold mt-1">{features?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Sub-Features</span>
            </div>
            <p className="text-2xl font-bold mt-1">{subFeatures?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Timeline</span>
            </div>
            <p className="text-sm mt-1">
              {project.startDate && project.endDate
                ? `${format(new Date(project.startDate), 'MMM dd')} - ${format(new Date(project.endDate), 'MMM dd')}`
                : 'Not set'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {subFeatures ? Math.round((subFeatures.filter(sf => sf.status === 'Completed').length / Math.max(subFeatures.length, 1)) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hierarchy">Project Hierarchy</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Features & Sub-Features</CardTitle>
                <Button onClick={() => {
                  setSelectedFeature(null);
                  setShowFeatureForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {featuresLoading ? (
                <div>Loading features...</div>
              ) : features?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No features yet. Create your first feature to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {features?.map((feature: any) => (
                    <div key={feature.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatureExpansion(feature.id)}
                          >
                            {expandedFeatures.has(feature.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <h3 className="font-semibold">{feature.name}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[feature.status]}>
                            {feature.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFeatureId(feature.id);
                              setShowSubFeatureForm(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Sub-Feature
                          </Button>
                        </div>
                      </div>

                      {expandedFeatures.has(feature.id) && (
                        <div className="mt-4 ml-8 space-y-2">
                          {getFeatureSubFeatures(feature.id).map((subFeature: any) => (
                            <div key={subFeature.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4" style={{ borderLeftColor: workTypeColors[subFeature.workType] || '#gray' }}>
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium">{subFeature.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {subFeature.workType}
                                    </Badge>
                                    {subFeature.department && (
                                      <Badge variant="outline" className="text-xs">
                                        {subFeature.department}
                                      </Badge>
                                    )}
                                    {subFeature.estimatedHours && (
                                      <span className="text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {subFeature.estimatedHours}h
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={statusColors[subFeature.status]}>
                                  {subFeature.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSubFeature(subFeature)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {getFeatureSubFeatures(feature.id).length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No sub-features yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Timeline data will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed reports and analytics will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Form Dialog */}
      <Dialog open={showFeatureForm} onOpenChange={setShowFeatureForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFeature ? 'Edit Feature' : 'Create New Feature'}
            </DialogTitle>
          </DialogHeader>
          <TrackerFeatureForm
            feature={selectedFeature}
            projectId={projectId}
            onSubmit={handleCreateFeature}
            onCancel={() => {
              setShowFeatureForm(false);
              setSelectedFeature(null);
            }}
            isLoading={createFeatureMutation.isPending || updateFeatureMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Sub-Feature Form Dialog */}
      <Dialog open={showSubFeatureForm} onOpenChange={setShowSubFeatureForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSubFeature ? 'Edit Sub-Feature' : 'Create New Sub-Feature'}
            </DialogTitle>
          </DialogHeader>
          {selectedFeatureId && (
            <TrackerSubFeatureForm
              subFeature={selectedSubFeature}
              featureId={selectedFeatureId}
              projectId={projectId}
              availableSubFeatures={subFeatures || []}
              onSubmit={handleCreateSubFeature}
              onCancel={() => {
                setShowSubFeatureForm(false);
                setSelectedSubFeature(null);
                setSelectedFeatureId(null);
              }}
              isLoading={createSubFeatureMutation.isPending || updateSubFeatureMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}