import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, AlertCircle, CheckCircle2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ColorPicker } from "@/components/ui/color-picker";
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

export function StatusReviewDialog({ project, isOpen, onClose }: StatusReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const selectedDate = new Date();

  // Form state
  const [formData, setFormData] = useState({
    overallProjectStatus: "",
    currentSprintStatus: "",
    weeklyComms: "",
    notes: "",
    projectLead: "",
    currentIssues: "",
    immediateActionItems: "",
    supportRequired: "",
    additionalRemarks: ""
  });
  const [saving, setSaving] = useState(false);

  // Status options state
  const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        overallProjectStatus: project?.overallProjectStatus || "",
        currentSprintStatus: project?.currentSprintStatus || "",
        weeklyComms: project?.weeklyComms || "",
        notes: project?.notes || "",
        projectLead: project?.projectLead || "",
        currentIssues: project?.currentIssues || "",
        immediateActionItems: project?.immediateActionItems || "",
        supportRequired: project?.supportRequired || "",
        additionalRemarks: project?.additionalRemarks || ""
      });
    }
  }, [project]);

  const updateStatusMutation = useMutation({
    mutationFn: async (statusData: any) => {
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${project.id}`, {
        ...project,
        ...statusData
      });
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Failed to save status review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status review saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Status review save error:", error);
      toast({ 
        title: "Failed to save status review", 
        description: error.message || "An error occurred while saving",
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
    if (!formData.projectLead.trim()) {
      toast({ 
        title: "Project Lead Required", 
        description: "Please enter a project lead name",
        variant: "destructive" 
      });
      return;
    }

    updateStatusMutation.mutate(formData);
  };

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/navadhiti-projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...project,
          overallProjectStatus: formData.overallProjectStatus,
          currentSprint: formData.currentSprintStatus,
          weeklyComms: formData.weeklyComms,
          currentIssues: formData.currentIssues,
          immediateActionItems: formData.immediateActionItems,
          supportRequired: formData.supportRequired,
          additionalRemarks: formData.additionalRemarks,
          projectLead: formData.projectLead
        }),
      });

      if (response.ok) {
        toast({
          title: "Status review saved",
          description: "Project status has been updated successfully.",
        });
        onClose();
      } else {
        throw new Error('Failed to save status review');
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save status review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
                <div><strong>Customer:</strong> {project.clientName || project.customer || 'N/A'}</div>
                <div><strong>Lead:</strong> {project.projectLead || 'N/A'}</div>
                <div><strong>Review Date:</strong> {selectedDate.toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Project Lead Field */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label htmlFor="projectLead">Project Lead *</Label>
                <Input
                  id="projectLead"
                  value={formData.projectLead}
                  onChange={(e) => setFormData({...formData, projectLead: e.target.value})}
                  placeholder="Enter project lead name"
                  className="w-full"
                />
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

          {/* Additional Fields */}
          <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentIssues">Current Issues</Label>
                    <textarea
                      id="currentIssues"
                      className="w-full p-3 border rounded-md min-h-[80px] resize-vertical"
                      value={formData.currentIssues}
                      onChange={(e) => setFormData({...formData, currentIssues: e.target.value})}
                      placeholder="Enter major challenges or risks..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="immediateActionItems">Immediate Action Items</Label>
                    <textarea
                      id="immediateActionItems"
                      className="w-full p-3 border rounded-md min-h-[80px] resize-vertical"
                      value={formData.immediateActionItems}
                      onChange={(e) => setFormData({...formData, immediateActionItems: e.target.value})}
                      placeholder="Enter immediate action items..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supportRequired">Support Required</Label>
                    <textarea
                      id="supportRequired"
                      className="w-full p-3 border rounded-md min-h-[80px] resize-vertical"
                      value={formData.supportRequired}
                      onChange={(e) => setFormData({...formData, supportRequired: e.target.value})}
                      placeholder="Enter specific support requests..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="additionalRemarks">Additional Remarks / Inputs</Label>
                    <textarea
                      id="additionalRemarks"
                      className="w-full p-3 border rounded-md min-h-[80px] resize-vertical"
                      value={formData.additionalRemarks}
                      onChange={(e) => setFormData({...formData, additionalRemarks: e.target.value})}
                      placeholder="Enter additional remarks or inputs..."
                    />
                  </div>
                </div>
              </div>

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
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Status Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}