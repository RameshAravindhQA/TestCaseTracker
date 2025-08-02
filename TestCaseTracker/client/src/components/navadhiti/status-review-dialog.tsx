import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface StatusOption {
  id: string;
  label: string;
  color: string;
}

interface StatusReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  selectedDate: Date;
}

const defaultStatusOptions: StatusOption[] = [
  { id: "green", label: "On Track", color: "#10b981" },
  { id: "amber", label: "At Risk", color: "#f59e0b" },
  { id: "red", label: "Critical", color: "#ef4444" },
  { id: "gray", label: "No Update", color: "#6b7280" }
];

export function StatusReviewDialog({ isOpen, onClose, project, selectedDate }: StatusReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(defaultStatusOptions);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");
  const [formData, setFormData] = useState({
    overallProjectStatus: "",
    currentSprintStatus: "",
    weeklyComms: "",
    notes: ""
  });

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        overallProjectStatus: "",
        currentSprintStatus: "",
        weeklyComms: "",
        notes: ""
      });
    }
  }, [project]);

  const createStatusMutation = useMutation({
    mutationFn: async (statusData: any) => {
      const res = await apiRequest("POST", "/api/navadhiti-projects/status-review", statusData);
      if (!res.ok) throw new Error("Failed to save status review");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status review saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save status review", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addCustomStatus = () => {
    if (!newStatusLabel.trim()) return;

    const newStatus: StatusOption = {
      id: `custom_${Date.now()}`,
      label: newStatusLabel.trim(),
      color: newStatusColor
    };

    setStatusOptions([...statusOptions, newStatus]);
    setNewStatusLabel("");
    setNewStatusColor("#3b82f6");

    toast({ title: "Custom status added successfully" });
  };

  const getStatusBadge = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId);
    if (!status) return null;

    return (
      <Badge 
        style={{ 
          backgroundColor: status.color, 
          color: 'white',
          border: `1px solid ${status.color}` 
        }}
      >
        {status.label}
      </Badge>
    );
  };

  const handleSubmit = () => {
    if (!formData.overallProjectStatus || !formData.currentSprintStatus || !formData.weeklyComms) {
      toast({ 
        title: "Please fill all required fields", 
        variant: "destructive" 
      });
      return;
    }

    const statusData = {
      projectId: project.id,
      projectName: project.projectName,
      customerName: project.clientName || '',
      projectLead: project.projectLead || '',
      reviewDate: selectedDate.toISOString(),
      overallProjectStatus: formData.overallProjectStatus,
      currentSprintStatus: formData.currentSprintStatus,
      weeklyComms: formData.weeklyComms,
      notes: formData.notes
    };

    createStatusMutation.mutate(statusData);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Status Review - {project.projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Project:</strong> {project.projectName}</div>
                <div><strong>Customer:</strong> {project.clientName || 'N/A'}</div>
                <div><strong>Lead:</strong> {project.projectLead || 'N/A'}</div>
                <div><strong>Review Date:</strong> {selectedDate.toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Project Status */}
            <div className="space-y-2">
              <Label htmlFor="overallStatus">Overall Project Status *</Label>
              <Select 
                value={formData.overallProjectStatus} 
                onValueChange={(value) => setFormData({...formData, overallProjectStatus: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.overallProjectStatus && (
                <div className="mt-2">
                  {getStatusBadge(formData.overallProjectStatus)}
                </div>
              )}
            </div>

            {/* Current Sprint Status */}
            <div className="space-y-2">
              <Label htmlFor="sprintStatus">Current Sprint Status *</Label>
              <Select 
                value={formData.currentSprintStatus} 
                onValueChange={(value) => setFormData({...formData, currentSprintStatus: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.currentSprintStatus && (
                <div className="mt-2">
                  {getStatusBadge(formData.currentSprintStatus)}
                </div>
              )}
            </div>

            {/* Weekly Communications */}
            <div className="space-y-2">
              <Label htmlFor="weeklyComms">Weekly Communications *</Label>
              <Select 
                value={formData.weeklyComms} 
                onValueChange={(value) => setFormData({...formData, weeklyComms: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.weeklyComms && (
                <div className="mt-2">
                  {getStatusBadge(formData.weeklyComms)}
                </div>
              )}
            </div>
          </div>

          {/* Custom Status Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Custom Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="statusLabel">Status Label</Label>
                  <Input
                    id="statusLabel"
                    value={newStatusLabel}
                    onChange={(e) => setNewStatusLabel(e.target.value)}
                    placeholder="Enter status label"
                  />
                </div>
                <div>
                  <Label htmlFor="statusColor">Color</Label>
                  <ColorPicker
                    value={newStatusColor}
                    onChange={setNewStatusColor}
                  />
                </div>
                <Button onClick={addCustomStatus} disabled={!newStatusLabel.trim()}>
                  Add Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea
              id="notes"
              className="w-full p-3 border rounded-md min-h-[100px] resize-vertical"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Enter any additional notes or comments..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createStatusMutation.isPending}
            >
              {createStatusMutation.isPending ? "Saving..." : "Save Status Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}