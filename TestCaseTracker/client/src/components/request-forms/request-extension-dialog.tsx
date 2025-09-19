
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RequestExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onSuccess: () => void;
}

export function RequestExtensionDialog({ 
  open, 
  onOpenChange, 
  request, 
  onSuccess 
}: RequestExtensionDialogProps) {
  const { toast } = useToast();
  const [newEndDate, setNewEndDate] = useState("");
  const [extensionReason, setExtensionReason] = useState("");

  // Fetch extension history
  const { data: extensions = [] } = useQuery({
    queryKey: [`/api/resource-requests/${request?.id}/extensions`],
    queryFn: async () => {
      if (!request?.id) return [];
      const res = await apiRequest("GET", `/api/resource-requests/${request.id}/extensions`);
      if (!res.ok) throw new Error("Failed to fetch extensions");
      return res.json();
    },
    enabled: !!request?.id && open,
  });

  // Create extension mutation
  const createExtensionMutation = useMutation({
    mutationFn: async (data: { newEndDate: string; extensionReason: string }) => {
      const res = await apiRequest("POST", `/api/resource-requests/${request.id}/extend`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Extension request created",
        description: "Extension request has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resource-requests/${request.id}/extensions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
      setNewEndDate("");
      setExtensionReason("");
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create extension request",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newEndDate || !extensionReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both new end date and extension reason.",
        variant: "destructive",
      });
      return;
    }

    const currentEndDate = new Date(request.endDate);
    const proposedEndDate = new Date(newEndDate);

    if (proposedEndDate <= currentEndDate) {
      toast({
        title: "Invalid date",
        description: "New end date must be after the current end date.",
        variant: "destructive",
      });
      return;
    }

    createExtensionMutation.mutate({
      newEndDate,
      extensionReason,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateExtradays = (originalDate: string, newDate: string) => {
    const original = new Date(originalDate);
    const extended = new Date(newDate);
    
    // Reset time to avoid timezone issues
    original.setHours(0, 0, 0, 0);
    extended.setHours(0, 0, 0, 0);
    
    const diffTime = extended.getTime() - original.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); // Ensure non-negative
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Request Extension - {request.requestId}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Request Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Title</Label>
                <p className="font-semibold">{request.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Current End Date</Label>
                <p className="font-semibold">{formatDate(request.endDate)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Priority</Label>
                <Badge variant="outline">{request.priority}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Assigned Employee</Label>
                <p className="font-semibold">{request.assignedEmployee ? `${request.assignedEmployee.firstName} ${request.assignedEmployee.lastName}` : 'Not Assigned'}</p>
              </div>
            </CardContent>
          </Card>

          {/* New Extension Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Request Extension
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newEndDate">New End Date</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  min={request.endDate}
                />
              </div>

              <div>
                <Label htmlFor="extensionReason">Extension Reason</Label>
                <Textarea
                  id="extensionReason"
                  placeholder="Please provide a detailed reason for the extension..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={4}
                />
              </div>

              {newEndDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Extension Duration:</strong> {calculateExtradays(request.endDate, newEndDate)} additional days
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    From {formatDate(request.endDate)} to {formatDate(newEndDate)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createExtensionMutation.isPending}
                  className="flex-1"
                >
                  {createExtensionMutation.isPending ? "Submitting..." : "Submit Extension"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extension History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Extension History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extensions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No extension history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {extensions.map((extension: any) => (
                  <div key={extension.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(extension.status)}
                        <Badge className={getStatusColor(extension.status)}>
                          {extension.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(extension.createdAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Original Date</Label>
                        <p className="font-medium">{formatDate(extension.originalEndDate)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Requested Date</Label>
                        <p className="font-medium">{formatDate(extension.newEndDate)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Extension</Label>
                        <p className="font-medium">
                          +{calculateExtradays(extension.originalEndDate, extension.newEndDate)} days
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-gray-600">Reason</Label>
                      <p className="text-sm">{extension.extensionReason}</p>
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
