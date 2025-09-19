import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Edit, 
  Save,
  X,
  Trash2,
  Target
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FunctionalRequirement {
  id: number;
  requirementId: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status: "Pass" | "Fail" | "Not Executed";
  acceptanceCriteria?: string;
  notes?: string;
  createdAt?: string;
}

interface BrdFunctionalRequirementsProps {
  brdId: number;
  functionalRequirements: FunctionalRequirement[];
  onUpdateFunctionalRequirement: (requirement: FunctionalRequirement) => void;
  onAddFunctionalRequirement: (requirement: Omit<FunctionalRequirement, "id" | "requirementId">) => void;
  onDeleteFunctionalRequirement: (requirementId: number) => void;
}

export function BrdFunctionalRequirements({
  brdId,
  functionalRequirements,
  onUpdateFunctionalRequirement,
  onAddFunctionalRequirement,
  onDeleteFunctionalRequirement
}: BrdFunctionalRequirementsProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<FunctionalRequirement | null>(null);
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    priority: "Medium" as const,
    acceptanceCriteria: "",
    notes: ""
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Pass": "default",
      "Fail": "destructive", 
      "Not Executed": "secondary"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "High": "destructive",
      "Medium": "default",
      "Low": "secondary"
    };

    return (
      <Badge variant={variants[priority] || "secondary"}>
        {priority}
      </Badge>
    );
  };

  const handleAddFunctionalRequirement = () => {
    if (!newRequirement.title.trim()) {
      return;
    }

    const requirement = {
      brdId,
      title: newRequirement.title,
      description: newRequirement.description,
      priority: newRequirement.priority,
      status: "Not Executed" as const,
      acceptanceCriteria: newRequirement.acceptanceCriteria,
      notes: newRequirement.notes
    };

    onAddFunctionalRequirement(requirement);
    setNewRequirement({ 
      title: "", 
      description: "", 
      priority: "Medium", 
      acceptanceCriteria: "", 
      notes: "" 
    });
    setShowAddForm(false);
  };

  const handleEditRequirement = (requirement: FunctionalRequirement) => {
    setEditingRequirement({ ...requirement });
    setEditingId(requirement.id);
  };

  const handleSaveEdit = () => {
    if (editingRequirement) {
      onUpdateFunctionalRequirement(editingRequirement);
      setEditingRequirement(null);
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingRequirement(null);
    setEditingId(null);
  };

  const handleDeleteRequirement = (requirementId: number) => {
    if (confirm("Are you sure you want to delete this functional requirement?")) {
      onDeleteFunctionalRequirement(requirementId);
    }
  };

  // Calculate statistics
  const stats = {
    total: functionalRequirements.length,
    passed: functionalRequirements.filter(req => req.status === "Pass").length,
    failed: functionalRequirements.filter(req => req.status === "Fail").length,
    notExecuted: functionalRequirements.filter(req => req.status === "Not Executed").length
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Functional Requirements Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Requirements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-gray-500">Satisfied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{passRate}%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functional Requirements List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Functional Requirements</CardTitle>
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Functional Requirement
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Functional Requirement Form */}
            {showAddForm && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Requirement ID will be auto-generated (e.g., BEG-REQ-001-FR-001)
                      </p>
                    </div>

                    <Input
                      placeholder="Functional requirement title"
                      value={newRequirement.title}
                      onChange={(e) => setNewRequirement(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newRequirement.description}
                      onChange={(e) => setNewRequirement(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                    />
                    <Select
                      value={newRequirement.priority}
                      onValueChange={(value: "High" | "Medium" | "Low") => 
                        setNewRequirement(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Acceptance criteria"
                      value={newRequirement.acceptanceCriteria}
                      onChange={(e) => setNewRequirement(prev => ({
                        ...prev,
                        acceptanceCriteria: e.target.value
                      }))}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleAddFunctionalRequirement}>
                        <Save className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Functional Requirements */}
            {functionalRequirements.map((requirement) => (
              <Card key={requirement.id} className="border-l-4 border-l-blue-200">
                <CardContent className="pt-6">
                  {editingId === requirement.id && editingRequirement ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{requirement.requirementId}</Badge>
                        {getStatusBadge(requirement.status)}
                        {getPriorityBadge(requirement.priority)}
                      </div>

                      <Input
                        placeholder="Requirement title"
                        value={editingRequirement.title}
                        onChange={(e) => setEditingRequirement(prev => prev ? {
                          ...prev,
                          title: e.target.value
                        } : null)}
                      />

                      <Textarea
                        placeholder="Description"
                        value={editingRequirement.description || ""}
                        onChange={(e) => setEditingRequirement(prev => prev ? {
                          ...prev,
                          description: e.target.value
                        } : null)}
                      />

                      <Select
                        value={editingRequirement.priority}
                        onValueChange={(value: "High" | "Medium" | "Low") => 
                          setEditingRequirement(prev => prev ? { ...prev, priority: value } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Acceptance criteria"
                        value={editingRequirement.acceptanceCriteria || ""}
                        onChange={(e) => setEditingRequirement(prev => prev ? {
                          ...prev,
                          acceptanceCriteria: e.target.value
                        } : null)}
                      />

                      <Textarea
                        placeholder="Notes"
                        value={editingRequirement.notes || ""}
                        onChange={(e) => setEditingRequirement(prev => prev ? {
                          ...prev,
                          notes: e.target.value
                        } : null)}
                      />

                      {/* Status Selection in Edit Mode */}
                      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-pass-${requirement.id}`}
                            checked={editingRequirement.status === "Pass"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditingRequirement(prev => prev ? {
                                  ...prev,
                                  status: "Pass"
                                } : null);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`edit-pass-${requirement.id}`}
                            className="text-sm font-medium text-green-600"
                          >
                            Satisfied
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-fail-${requirement.id}`}
                            checked={editingRequirement.status === "Fail"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditingRequirement(prev => prev ? {
                                  ...prev,
                                  status: "Fail"
                                } : null);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`edit-fail-${requirement.id}`}
                            className="text-sm font-medium text-red-600"
                          >
                            Failed
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-not-executed-${requirement.id}`}
                            checked={editingRequirement.status === "Not Executed"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditingRequirement(prev => prev ? {
                                  ...prev,
                                  status: "Not Executed"
                                } : null);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`edit-not-executed-${requirement.id}`}
                            className="text-sm font-medium text-gray-600"
                          >
                            Not Evaluated
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{requirement.requirementId}</Badge>
                          {getStatusBadge(requirement.status)}
                          {getPriorityBadge(requirement.priority)}
                        </div>
                        <h4 className="font-medium mb-2">{requirement.title}</h4>
                        {requirement.description && (
                          <p className="text-sm text-gray-600 mb-2">{requirement.description}</p>
                        )}
                        {requirement.acceptanceCriteria && (
                          <div className="text-sm mb-2">
                            <strong>Acceptance Criteria:</strong> {requirement.acceptanceCriteria}
                          </div>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(requirement.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRequirement(requirement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequirement(requirement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {requirement.notes && !editingId && (
                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-200">
                      <p className="text-sm">{requirement.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {functionalRequirements.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-gray-500">
                No functional requirements defined yet. Click "Add Functional Requirement" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}