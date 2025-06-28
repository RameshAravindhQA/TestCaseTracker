
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Plus, Edit, Trash, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CustomMarker {
  id: string;
  markerId: string;
  label: string;
  color: string;
  type: string;
  projectId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
}

export function MarkerManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CustomMarker | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newMarker, setNewMarker] = useState({
    label: '',
    color: '#3b82f6'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Fetch markers for selected project
  const { data: customMarkers = [] } = useQuery<CustomMarker[]>({
    queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/markers`);
      if (!response.ok) throw new Error("Failed to fetch markers");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Create marker mutation
  const createMarkerMutation = useMutation({
    mutationFn: async (markerData: { label: string; color: string; projectId: number }) => {
      const response = await apiRequest("POST", "/api/custom-markers", markerData);
      if (!response.ok) throw new Error("Failed to create marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });
      setIsMarkerDialogOpen(false);
      setNewMarker({ label: '', color: '#3b82f6' });
      toast({
        title: "Success",
        description: "Marker created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create marker",
        variant: "destructive",
      });
    },
  });

  // Update marker mutation
  const updateMarkerMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; label: string; color: string }) => {
      const response = await apiRequest("PUT", `/api/custom-markers/${id}`, data);
      if (!response.ok) throw new Error("Failed to update marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });
      setIsMarkerDialogOpen(false);
      setEditingMarker(null);
      setNewMarker({ label: '', color: '#3b82f6' });
      toast({
        title: "Success",
        description: "Marker updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update marker",
        variant: "destructive",
      });
    },
  });

  // Delete marker mutation
  const deleteMarkerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/custom-markers/${id}`);
      if (!response.ok) throw new Error("Failed to delete marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });
      toast({
        title: "Success",
        description: "Marker deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete marker",
        variant: "destructive",
      });
    },
  });

  const handleCreateMarker = () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    createMarkerMutation.mutate({
      ...newMarker,
      projectId: selectedProjectId,
    });
  };

  const handleUpdateMarker = () => {
    if (!editingMarker) return;
    
    updateMarkerMutation.mutate({
      id: editingMarker.id,
      ...newMarker,
    });
  };

  const handleEditMarker = (marker: CustomMarker) => {
    setEditingMarker(marker);
    setNewMarker({ label: marker.label, color: marker.color });
    setIsMarkerDialogOpen(true);
  };

  const handleDeleteMarker = (id: string) => {
    if (confirm('Are you sure you want to delete this marker?')) {
      deleteMarkerMutation.mutate(id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Manage Markers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Marker Management</DialogTitle>
          <DialogDescription>
            Create and manage custom markers for your traceability matrices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Select Project</Label>
            <select
              className="w-full p-2 border rounded"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Custom Markers</CardTitle>
                  <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingMarker(null);
                        setNewMarker({ label: '', color: '#3b82f6' });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Marker
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingMarker ? 'Edit Marker' : 'Create New Marker'}
                        </DialogTitle>
                        <DialogDescription>
                          Create a custom marker with a label and color for the traceability matrix.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="label" className="text-right">
                            Label
                          </Label>
                          <Input
                            id="label"
                            value={newMarker.label}
                            onChange={(e) => setNewMarker(prev => ({ ...prev, label: e.target.value }))}
                            className="col-span-3"
                            placeholder="Enter marker label"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="color" className="text-right">
                            Color
                          </Label>
                          <div className="col-span-3">
                            <ColorPicker
                              value={newMarker.color}
                              onChange={(color) => setNewMarker(prev => ({ ...prev, color }))}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={editingMarker ? handleUpdateMarker : handleCreateMarker}
                          disabled={createMarkerMutation.isPending || updateMarkerMutation.isPending}
                        >
                          {editingMarker ? 'Update' : 'Create'} Marker
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customMarkers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No markers created yet</p>
                  ) : (
                    customMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: marker.color }}
                          />
                          <span className="font-medium">{marker.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditMarker(marker)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMarker(marker.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
