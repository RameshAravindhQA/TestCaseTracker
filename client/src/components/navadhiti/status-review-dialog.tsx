
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save } from "lucide-react";

interface StatusReviewDialogProps {
  project: any;
  onClose: () => void;
}

interface StatusReviewDialogProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
}

export function StatusReviewDialog({ project, isOpen, onClose }: StatusReviewDialogProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    overallProjectStatus: project?.overallProjectStatus || '',
    currentSprint: project?.currentSprint || '',
    currentIssues: project?.currentIssues || '',
    weeklyComms: project?.weeklyComms || '',
    immediateActionItems: project?.immediateActionItems || '',
    supportRequired: project?.supportRequired || '',
    additionalRemarks: project?.additionalRemarks || '',
    completionPercentage: project?.completionPercentage || 0
  });

  // Reset form data when project changes
  React.useEffect(() => {
    if (project) {
      setFormData({
        overallProjectStatus: project.overallProjectStatus || '',
        currentSprint: project.currentSprint || '',
        currentIssues: project.currentIssues || '',
        weeklyComms: project.weeklyComms || '',
        immediateActionItems: project.immediateActionItems || '',
        supportRequired: project.supportRequired || '',
        additionalRemarks: project.additionalRemarks || '',
        completionPercentage: project.completionPercentage || 0
      });
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!project?.id) {
        throw new Error('Project ID is required');
      }
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${project.id}`, data);
      if (!res.ok) {
        throw new Error('Failed to update project');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status review updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      onClose();
    },
    onError: (error) => {
      console.error('Status review update error:', error);
      toast({ 
        title: "Failed to update status review", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
      // Don't close dialog on error, allow user to retry
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Status options for dropdown
  const overallProjectStatusOptions = [
    { value: 'Active', label: 'Active', color: 'green' },
    { value: 'On Track', label: 'On Track', color: 'green' },
    { value: 'At Risk', label: 'At Risk', color: 'amber' },
    { value: 'Behind Schedule', label: 'Behind Schedule', color: 'orange' },
    { value: 'Blocked', label: 'Blocked', color: 'red' },
    { value: 'On Hold', label: 'On Hold', color: 'yellow' },
    { value: 'Completed', label: 'Completed', color: 'blue' },
    { value: 'Cancelled', label: 'Cancelled', color: 'gray' },
    { value: 'Under Review', label: 'Under Review', color: 'purple' },
    { value: 'Planning Phase', label: 'Planning Phase', color: 'indigo' }
  ];

  const sprintStatusOptions = [
    { value: 'On Track', label: 'On Track', color: 'green' },
    { value: 'At Risk', label: 'At Risk', color: 'amber' },
    { value: 'Behind Schedule', label: 'Behind Schedule', color: 'orange' },
    { value: 'Blocked', label: 'Blocked', color: 'red' },
    { value: 'Completed', label: 'Completed', color: 'blue' },
    { value: 'Not Started', label: 'Not Started', color: 'gray' }
  ];

  const weeklyCommsOptions = [
    { value: 'On Track', label: 'On Track', color: 'green' },
    { value: 'At Risk', label: 'At Risk', color: 'amber' },
    { value: 'Blocked', label: 'Blocked', color: 'red' },
    { value: 'Need Attention', label: 'Need Attention', color: 'orange' },
    { value: 'Good', label: 'Good', color: 'blue' },
    { value: 'Excellent', label: 'Excellent', color: 'green' }
  ];

  // Don't render if no project
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Update Status Review - {project.projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overall Project Status */}
            <div>
              <Label htmlFor="overallProjectStatus">Overall Project Status</Label>
              <Select value={formData.overallProjectStatus} onValueChange={(value) => handleInputChange('overallProjectStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select overall project status" />
                </SelectTrigger>
                <SelectContent>
                  {overallProjectStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          option.color === 'green' ? 'bg-green-500' :
                          option.color === 'amber' ? 'bg-amber-500' :
                          option.color === 'orange' ? 'bg-orange-500' :
                          option.color === 'red' ? 'bg-red-500' :
                          option.color === 'yellow' ? 'bg-yellow-500' :
                          option.color === 'blue' ? 'bg-blue-500' :
                          option.color === 'purple' ? 'bg-purple-500' :
                          option.color === 'indigo' ? 'bg-indigo-500' :
                          'bg-gray-500'
                        }`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Sprint Status */}
            <div>
              <Label htmlFor="currentSprint">Current Sprint Status</Label>
              <Select value={formData.currentSprint} onValueChange={(value) => handleInputChange('currentSprint', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint status" />
                </SelectTrigger>
                <SelectContent>
                  {sprintStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          option.color === 'green' ? 'bg-green-500' :
                          option.color === 'amber' ? 'bg-amber-500' :
                          option.color === 'orange' ? 'bg-orange-500' :
                          option.color === 'red' ? 'bg-red-500' :
                          option.color === 'blue' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weekly Communications */}
            <div>
              <Label htmlFor="weeklyComms">Weekly Communications</Label>
              <Select value={formData.weeklyComms} onValueChange={(value) => handleInputChange('weeklyComms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select communication status" />
                </SelectTrigger>
                <SelectContent>
                  {weeklyCommsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          option.color === 'green' ? 'bg-green-500' :
                          option.color === 'amber' ? 'bg-amber-500' :
                          option.color === 'orange' ? 'bg-orange-500' :
                          option.color === 'red' ? 'bg-red-500' :
                          option.color === 'blue' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Progress */}
            <div>
              <Label htmlFor="completionPercentage">Project Progress (%)</Label>
              <Input
                id="completionPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.completionPercentage}
                onChange={(e) => handleInputChange('completionPercentage', parseInt(e.target.value) || 0)}
                placeholder="Enter completion percentage"
              />
            </div>
          </div>

          {/* Current Issues */}
          <div>
            <Label htmlFor="currentIssues">Current Issues</Label>
            <Textarea
              id="currentIssues"
              value={formData.currentIssues}
              onChange={(e) => handleInputChange('currentIssues', e.target.value)}
              placeholder="Describe any current issues or blockers"
              rows={3}
            />
          </div>

          {/* Immediate Action Items */}
          <div>
            <Label htmlFor="immediateActionItems">Immediate Action Items</Label>
            <Textarea
              id="immediateActionItems"
              value={formData.immediateActionItems}
              onChange={(e) => handleInputChange('immediateActionItems', e.target.value)}
              placeholder="List immediate action items required"
              rows={3}
            />
          </div>

          {/* Support Required */}
          <div>
            <Label htmlFor="supportRequired">Support Required</Label>
            <Textarea
              id="supportRequired"
              value={formData.supportRequired}
              onChange={(e) => handleInputChange('supportRequired', e.target.value)}
              placeholder="Describe any support or resources needed"
              rows={3}
            />
          </div>

          {/* Additional Remarks */}
          <div>
            <Label htmlFor="additionalRemarks">Additional Remarks</Label>
            <Textarea
              id="additionalRemarks"
              value={formData.additionalRemarks}
              onChange={(e) => handleInputChange('additionalRemarks', e.target.value)}
              placeholder="Any additional comments or remarks"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProjectMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateProjectMutation.isPending ? 'Updating...' : 'Update Status Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
