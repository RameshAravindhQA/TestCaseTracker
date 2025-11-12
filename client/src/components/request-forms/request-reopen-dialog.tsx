import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, History, RefreshCw, User, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RequestReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  employees: any[];
  onSuccess: () => void;
  editingReopenId?: number | null;
  editingReopenData?: any;
  onCancelEdit?: () => void;
}

export function RequestReopenDialog({
  open,
  onOpenChange,
  request,
  employees = [],
  onSuccess,
  editingReopenId = null,
  editingReopenData = null,
  onCancelEdit
}: RequestReopenDialogProps) {
  const { toast } = useToast();
  const [reopenReason, setReopenReason] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newAssignedEmployee, setNewAssignedEmployee] = useState("");

  const isEditing = editingReopenId !== null;

  // Initialize form with editing data if in edit mode
  useEffect(() => {
    if (isEditing && editingReopenData) {
      setReopenReason(editingReopenData.reason || "");
      setNewStartDate(editingReopenData.newStartDate || "");
      setNewEndDate(editingReopenData.newEndDate || "");
      setNewAssignedEmployee(editingReopenData.reassignedEmployeeId?.toString() || "");
    } else {
      // Reset form for new reopen
      setReopenReason("");
      setNewStartDate("");
      setNewEndDate("");
      setNewAssignedEmployee("");
    }
  }, [isEditing, editingReopenData]);

  // Fetch audit logs for this request
  const { data: auditLogs = [] } = useQuery({
    queryKey: [`/api/resource-requests/${request?.id}/audit-logs`],
    queryFn: async () => {
      if (!request?.id) return [];
      const res = await apiRequest("GET", `/api/resource-requests/${request.id}/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    enabled: !!request?.id && open,
  });

  // Reopen request mutation
  const reopenMutation = useMutation({
    mutationFn: async (data: {
      reason: string;
      newStartDate?: string;
      newEndDate?: string;
      newAssignedEmployee?: number;
    }) => {
      if (isEditing) {
        // For editing, we update the existing reopen record
        const res = await apiRequest("PUT", `/api/resource-requests/${request.id}/reopen`, data);
        if (!res.ok) throw new Error("Failed to update reopen request");
        return res.json();
      } else {
        // For new reopen
        const res = await apiRequest("POST", `/api/resource-requests/${request.id}/reopen`, data);
        if (!res.ok) throw new Error("Failed to reopen request");
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Reopen record updated successfully" : "Request reopened successfully",
        description: isEditing ? "The reopen record has been updated." : "The request has been reopened with updated details.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resource-requests/${request.id}/audit-logs`] });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
      resetForm();
      if (onCancelEdit) onCancelEdit(); // Clear editing state
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Failed to update reopen record" : "Failed to reopen request",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setReopenReason("");
    setNewStartDate("");
    setNewEndDate("");
    setNewAssignedEmployee("");
  };

  const handleSubmit = () => {
    if (!reopenReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for reopening the request.",
        variant: "destructive",
      });
      return;
    }

    if (newStartDate && newEndDate) {
      const startDate = new Date(newStartDate);
      const endDate = new Date(newEndDate);

      if (endDate <= startDate) {
        toast({
          title: "Invalid dates",
          description: "End date must be after start date.",
          variant: "destructive",
        });
        return;
      }
    }

    const reopenData: any = { reason: reopenReason };

    if (newStartDate) reopenData.newStartDate = newStartDate;
    if (newEndDate) reopenData.newEndDate = newEndDate;
    if (newAssignedEmployee && newAssignedEmployee !== "0") {
      reopenData.newAssignedEmployee = parseInt(newAssignedEmployee);
    }

    reopenMutation.mutate(reopenData);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!request) return null;

  const currentEmployee = employees.find(emp => emp.id === request.leadId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {isEditing ? `Edit Reopen Record - ${request.requestId}` : `Reopen Request - ${request.requestId}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Request Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Title</Label>
                <p className="font-semibold">{request.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                <Badge variant="outline" className="ml-2">{request.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                  <p className="font-medium">{formatDate(request.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">End Date</Label>
                  <p className="font-medium">{formatDate(request.endDate)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Duration</Label>
                <p className="font-medium">{calculateDuration(request.startDate, request.endDate)} days</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Assigned Employee</Label>
                <div className="flex items-center gap-2 mt-1">
                  {currentEmployee ? (
                    <>
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {currentEmployee.firstName} {currentEmployee.lastName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {currentEmployee.department || 'No Dept'}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Not Assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reopen Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Reopen Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reopenReason">Reason for Reopening *</Label>
                <Textarea
                  id="reopenReason"
                  placeholder="Please provide a detailed reason for reopening this request..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newStartDate">New Start Date (Optional)</Label>
                  <Input
                    id="newStartDate"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newEndDate">New End Date (Optional)</Label>
                  <Input
                    id="newEndDate"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    min={newStartDate || undefined}
                    className="mt-1"
                  />
                </div>
              </div>

              {newStartDate && newEndDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>New Duration:</strong> {calculateDuration(newStartDate, newEndDate)} days
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    From {formatDate(newStartDate)} to {formatDate(newEndDate)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="newAssignedEmployee">Reassign Employee (Optional)</Label>
                <select
                  id="newAssignedEmployee"
                  value={newAssignedEmployee}
                  onChange={(e) => setNewAssignedEmployee(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Assignment</option>
                  <option value="0">Unassign Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id.toString()}>
                      {employee.firstName} {employee.lastName} - {employee.department || 'No Dept'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    if (onCancelEdit) onCancelEdit();
                    onOpenChange(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={reopenMutation.isPending}
                  className="flex-1"
                >
                  {reopenMutation.isPending 
                    ? (isEditing ? "Updating..." : "Reopening...") 
                    : (isEditing ? "Update Reopen Record" : "Reopen Request")
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Request Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{log.action}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          if (!log.details) return 'No additional details';
                          
                          try {
                            let logDetails;
                            if (typeof log.details === 'string') {
                              try {
                                logDetails = JSON.parse(log.details);
                              } catch (e) {
                                return log.details;
                              }
                            } else {
                              logDetails = log.details;
                            }

                            if (logDetails && typeof logDetails === 'object') {
                              let formattedDetails = '';
                              
                              if (logDetails.reason) {
                                formattedDetails += `Reason: ${logDetails.reason}\n`;
                              }
                              
                              if (logDetails.dateChanges) {
                                const dateChanges = logDetails.dateChanges;
                                if (dateChanges.originalStartDate !== dateChanges.newStartDate) {
                                  formattedDetails += `Start Date: ${formatDate(dateChanges.originalStartDate)} → ${formatDate(dateChanges.newStartDate)}\n`;
                                }
                                if (dateChanges.originalEndDate !== dateChanges.newEndDate) {
                                  formattedDetails += `End Date: ${formatDate(dateChanges.originalEndDate)} → ${formatDate(dateChanges.newEndDate)}\n`;
                                }
                              }
                              
                              if (logDetails.employeeChanges) {
                                const empChanges = logDetails.employeeChanges;
                                if (empChanges.previousEmployeeName !== empChanges.newEmployeeName) {
                                  formattedDetails += `Employee: ${empChanges.previousEmployeeName || 'None'} → ${empChanges.newEmployeeName || 'None'}\n`;
                                }
                              }
                              
                              if (logDetails.newStartDate && !logDetails.dateChanges) {
                                formattedDetails += `New Start Date: ${formatDate(logDetails.newStartDate)}\n`;
                              }
                              if (logDetails.newEndDate && !logDetails.dateChanges) {
                                formattedDetails += `New End Date: ${formatDate(logDetails.newEndDate)}\n`;
                              }
                              
                              if (logDetails.message && !formattedDetails) {
                                formattedDetails = logDetails.message;
                              }
                              
                              return formattedDetails.trim() || JSON.stringify(logDetails, null, 2);
                            }
                            
                            return typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
                          } catch (error) {
                            return typeof log.details === 'string' ? log.details : 'Error parsing details';
                          }
                        })()}
                      </p>
                      {log.user && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {log.user.firstName} {log.user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}