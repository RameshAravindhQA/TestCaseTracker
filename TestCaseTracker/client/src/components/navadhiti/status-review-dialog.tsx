
import React, { useState } from "react";
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

export function StatusReviewDialog({ project, onClose }: StatusReviewDialogProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentSprint: project?.currentSprint || '',
    currentIssues: project?.currentIssues || '',
    weeklyComms: project?.weeklyComms || '',
    immediateActionItems: project?.immediateActionItems || '',
    supportRequired: project?.supportRequired || '',
    additionalRemarks: project?.additionalRemarks || '',
    completionPercentage: project?.completionPercentage || 0
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${project.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status review updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update status review", variant: "destructive" });
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
  const sprintStatusOptions = [
    { value: 'On Track', label: 'On Track', color: 'green' },
    { value: 'At Risk', label: 'At Risk', color: 'amber' },
    { value: 'Blocked', label: 'Blocked', color: 'red' }
  ];

  const weeklyCommsOptions = [
    { value: 'On Track', label: 'On Track', color: 'green' },
    { value: 'At Risk', label: 'At Risk', color: 'amber' },
    { value: 'Blocked', label: 'Blocked', color: 'red' }
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Update Status Review - {project?.projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          option.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
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
                          option.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
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
