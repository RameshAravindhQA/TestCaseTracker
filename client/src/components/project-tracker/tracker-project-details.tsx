import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { TrackerWorkLogForm } from './tracker-work-log-form';
import { TrackerReports } from './tracker-reports';
import { TrackerAnalytics } from './tracker-analytics';
import WorkLogsList from './tracker-work-logs-list';
import TimelineView from './tracker-timeline-view';
import { format } from 'date-fns';

interface TrackerProjectDetailsProps {
  projectId: number;
  onBack: () => void;
}

// Mock interfaces for types that are not fully defined in the provided code
interface TrackerProject {
  id: number;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export function TrackerProjectDetails({ projectId, onBack }: TrackerProjectDetailsProps) {
  const { toast } = useToast();
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [showSubFeatureForm, setShowSubFeatureForm] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedSubFeature, setSelectedSubFeature] = useState<any>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());
  const [showSubFeatureViewDialog, setShowSubFeatureViewDialog] = useState(false);
  const [showWorkLogForm, setShowWorkLogForm] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<any>(null);

  // Pagination and search states for hierarchy
  const [hierarchyCurrentPage, setHierarchyCurrentPage] = useState(1);
  const [hierarchySearchTerm, setHierarchySearchTerm] = useState('');
  const hierarchyItemsPerPage = 5;

  // Pagination for features
  const [featureCurrentPage, setFeatureCurrentPage] = useState(1);
  const featuresPerPage = 5; // Number of features per page

  // Fetch project details
  const { data: project } = useQuery<TrackerProject>({
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

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tracker/features/${id}`);
      if (!response.ok) throw new Error('Failed to delete feature');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tracker/features`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete feature',
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

  // Create work log mutation
  const createWorkLogMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tracker/work-logs', data);
      if (!response.ok) throw new Error('Failed to create work log');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Work log added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/work-logs'] });
      setShowWorkLogForm(false);
      setSelectedSubFeature(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add work log',
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

  const handleEditFeature = (feature: any) => {
    setSelectedFeature(feature);
    setShowFeatureForm(true);
  };

  const handleDeleteFeature = (featureId: number) => {
    if (window.confirm('Are you sure you want to delete this feature? This will also delete all associated sub-features.')) {
      deleteFeatureMutation.mutate(featureId);
    }
  };

  const handleAddSubFeature = (featureId: number) => {
    setSelectedFeatureId(featureId);
    setSelectedSubFeature(null); // Reset to null for new sub-feature
    setShowSubFeatureForm(true);
  };

  const handleEditSubFeature = (subFeature: any) => {
    setSelectedSubFeature(subFeature); // Set the selected sub-feature for editing
    setSelectedFeatureId(subFeature.featureId);
    setShowSubFeatureForm(true);
  };

  const handleViewSubFeature = (subFeature: any) => {
    setSelectedSubFeature(subFeature);
    setShowSubFeatureViewDialog(true);
  };

  const handleAddWorkLog = (subFeature: any) => {
    setSelectedSubFeature(subFeature);
    setSelectedWorkLog(null);
    setShowWorkLogForm(true);
  };

  const handleEditWorkLog = (workLog: any) => {
    setSelectedWorkLog(workLog);
    setSelectedSubFeature({ id: workLog.subFeatureId });
    setShowWorkLogForm(true);
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
          <TabsTrigger value="analytics">Analytics & Charts</TabsTrigger>
          <TabsTrigger value="work-logs">Work Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Features & Sub-Features</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Search features..."
                      value={hierarchySearchTerm}
                      onChange={(e) => {
                        setHierarchySearchTerm(e.target.value);
                        setHierarchyCurrentPage(1);
                      }}
                      className="w-64"
                    />
                  </div>
                  <Button onClick={() => {
                    setSelectedFeature(null);
                    setShowFeatureForm(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
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
                (() => {
                  // Filter features based on search term
                  const filteredFeatures = features?.filter((feature: any) => 
                    feature.name.toLowerCase().includes(hierarchySearchTerm.toLowerCase()) ||
                    feature.description?.toLowerCase().includes(hierarchySearchTerm.toLowerCase()) ||
                    getFeatureSubFeatures(feature.id).some((sf: any) => 
                      sf.name.toLowerCase().includes(hierarchySearchTerm.toLowerCase())
                    )
                  ) || [];

                  // Calculate pagination for hierarchy
                  const totalHierarchyPages = Math.ceil(filteredFeatures.length / hierarchyItemsPerPage);
                  const hierarchyStartIndex = (hierarchyCurrentPage - 1) * hierarchyItemsPerPage;
                  const paginatedHierarchyFeatures = filteredFeatures.slice(hierarchyStartIndex, hierarchyStartIndex + hierarchyItemsPerPage);

                  return (
                    <>
                      {/* Feature Pagination */}
                      {features && features.length > featuresPerPage && (
                        <div className="flex justify-center items-center gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFeatureCurrentPage(Math.max(featureCurrentPage - 1, 1))}
                            disabled={featureCurrentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {featureCurrentPage} of {Math.ceil((features?.length || 0) / featuresPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFeatureCurrentPage(Math.min(featureCurrentPage + 1, Math.ceil((features?.length || 0) / featuresPerPage)))}
                            disabled={featureCurrentPage === Math.ceil((features?.length || 0) / featuresPerPage)}
                          >
                            Next
                          </Button>
                        </div>
                      )}

                      {/* Feature Hierarchy */}
                      <div className="space-y-4">
                        {paginatedHierarchyFeatures.map((feature: any) => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFeature(feature)}
                            title="Edit Feature"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeature(feature.id)}
                            title="Delete Feature"
                          >
                            <Trash className="h-4 w-4" />
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
                                  onClick={() => handleViewSubFeature(subFeature)}
                                  title="View Sub-Feature"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSubFeature(subFeature)}
                                  title="Edit Sub-Feature"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddWorkLog(subFeature)}
                                  title="Add Work Log"
                                >
                                  <Plus className="h-4 w-4" />
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

                      {/* Hierarchy Pagination */}
                      {totalHierarchyPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHierarchyCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={hierarchyCurrentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {hierarchyCurrentPage} of {totalHierarchyPages} ({filteredFeatures.length} features)
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHierarchyCurrentPage(prev => Math.min(prev + 1, totalHierarchyPages))}
                            disabled={hierarchyCurrentPage === totalHierarchyPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <TrackerAnalytics 
            projectId={projectId} 
            features={features || []} 
            subFeatures={subFeatures || []} 
            workLogs={[]} 
          />
        </TabsContent>

        <TabsContent value="work-logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Logs</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WorkLogsList projectId={projectId} onEditWorkLog={handleEditWorkLog} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <TrackerReports projectId={projectId} features={features} subFeatures={subFeatures} />
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
          {(selectedFeatureId || selectedSubFeature?.featureId) && (
            <TrackerSubFeatureForm
              subFeature={selectedSubFeature}
              featureId={selectedFeatureId || selectedSubFeature?.featureId}
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

      {/* Sub-Feature View Dialog */}
      <Dialog open={showSubFeatureViewDialog} onOpenChange={setShowSubFeatureViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sub-Feature Details: {selectedSubFeature?.name}</DialogTitle>
          </DialogHeader>
          {selectedSubFeature && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                  <p className="mt-1">{selectedSubFeature.description || 'No description provided'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <Badge className={statusColors[selectedSubFeature.status]} variant="outline">
                    {selectedSubFeature.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Priority</h4>
                  <Badge variant="outline">{selectedSubFeature.priority}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Work Type</h4>
                  <Badge 
                    variant="outline" 
                    style={{ borderLeftColor: workTypeColors[selectedSubFeature.workType], borderLeftWidth: '4px' }}
                  >
                    {selectedSubFeature.workType}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Department</h4>
                  <p className="mt-1">{selectedSubFeature.department || 'Not assigned'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Estimated Hours</h4>
                  <p className="mt-1">{selectedSubFeature.estimatedHours || 'Not estimated'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Start Date</h4>
                  <p className="mt-1">{selectedSubFeature.startDate || 'Not set'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">End Date</h4>
                  <p className="mt-1">{selectedSubFeature.endDate || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Work Log Form Dialog */}
      <Dialog open={showWorkLogForm} onOpenChange={setShowWorkLogForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkLog ? 'Edit Work Log' : `Add Work Log: ${selectedSubFeature?.name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedSubFeature && (
            <TrackerWorkLogForm
              workLog={selectedWorkLog}
              subFeature={selectedSubFeature}
              projectId={projectId}
              onSubmit={(data) => {
                const workLogData = {
                  ...data,
                  projectId: projectId,
                  subFeatureId: selectedSubFeature.id,
                  featureId: selectedSubFeature.featureId,
                };
                createWorkLogMutation.mutate(workLogData);
              }}
              isLoading={createWorkLogMutation.isPending}
              onCancel={() => {
                setShowWorkLogForm(false);
                setSelectedSubFeature(null);
                setSelectedWorkLog(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}