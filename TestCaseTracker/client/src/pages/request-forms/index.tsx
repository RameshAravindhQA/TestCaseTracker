import React, { useState, useEffect, Suspense, startTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle, FileText, Settings, History, MessageSquare, Eye, Edit, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { RequestFormForm } from "@/components/request-forms/request-form-form";
import { RequestFormTypeForm } from "@/components/request-forms/request-form-type-form";
import { RequestExtensionDialog } from "@/components/request-forms/request-extension-dialog";
import { RequestCommentsDialog } from "@/components/request-forms/request-comments-dialog";
import { RequestAttachments } from "@/components/request-forms/request-attachments";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorBoundary } from "react-error-boundary";
import { format } from 'date-fns';

// Fallback components for Suspense and Error Boundaries
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center h-screen text-center p-4">
    <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Something went wrong!</h2>
    <p className="text-muted-foreground mb-4">{error.message}</p>
    <Button onClick={resetErrorBoundary} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
      Try again
    </Button>
  </div>
);

// Actual component content
function RequestFormsPageContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("requests");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [isEditReopenDialogOpen, setIsEditReopenDialogOpen] = useState(false); // State for edit reopen dialog
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedReopenRecord, setSelectedReopenRecord] = useState<any>(null); // State for selected reopen record
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [reopenReason, setReopenReason] = useState('');
  const [newStartDate, setNewStartDate] = useState(''); // State for new start date
  const [newEndDate, setNewEndDate] = useState(''); // State for new end date
  const queryClient = useQueryClient();

  // Fetch resource requests
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["/api/resource-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/resource-requests");
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch request form types
  const { data: requestTypes = [] } = useQuery({
    queryKey: ["/api/request-forms/types"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/request-forms/types");
      if (!res.ok) throw new Error("Failed to fetch request types");
      return res.json();
    },
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch employees for lead selection
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch audit logs for a specific request
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/resource-requests/audit-logs", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest?.id) return [];
      const res = await apiRequest("GET", `/api/resource-requests/${selectedRequest.id}/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    enabled: !!selectedRequest?.id,
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch reopen records for a specific request
  const { data: reopenRecordsData = [] } = useQuery({
    queryKey: ["/api/resource-requests/reopen-records", selectedRequest?.id],
    queryFn: async () => {
      if (!selectedRequest?.id) return [];
      const res = await apiRequest("GET", `/api/resource-requests/${selectedRequest.id}/reopen-records`);
      if (!res.ok) throw new Error("Failed to fetch reopen records");
      return res.json();
    },
    enabled: !!selectedRequest?.id,
    suspense: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Create/Update request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingRequest ? "PUT" : "POST";
      const url = editingRequest ? `/api/resource-requests/${editingRequest.id}` : "/api/resource-requests";
      const res = await apiRequest(method, url, data);
      if (!res.ok) throw new Error(`Failed to ${editingRequest ? "update" : "create"} request`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: editingRequest ? "Request updated" : "Request created",
        description: `Request has been ${editingRequest ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
      setIsFormDialogOpen(false);
      setEditingRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${editingRequest ? "update" : "create"} request`,
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments: string }) => {
      const res = await apiRequest("PUT", `/api/resource-requests/${id}/approve`, {
        status,
        comments
      });
      if (!res.ok) throw new Error("Failed to update request status");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request status updated",
        description: "Request has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalComments("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update request status",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Reopen request mutation
  const reopenMutation = useMutation({
    mutationFn: async ({ id, reason, newStartDate, newEndDate }: { id: number; reason: string; newStartDate?: string; newEndDate?: string }) => {
      const payload: any = { reason };
      if (newStartDate) payload.startDate = newStartDate;
      if (newEndDate) payload.endDate = newEndDate;
      const res = await apiRequest("POST", `/api/resource-requests/${id}/reopen`, payload);
      if (!res.ok) throw new Error("Failed to reopen request");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request reopened",
        description: "Request has been reopened successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests/reopen-records", selectedRequest?.id] });
      setIsReopenDialogOpen(false);
      setReopenReason('');
      setNewStartDate('');
      setNewEndDate('');
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reopen request",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Update reopen record mutation
  const updateReopenMutation = useMutation({
    mutationFn: async ({ id, reason, newStartDate, newEndDate }: { id: number; reason?: string; newStartDate?: string; newEndDate?: string }) => {
      const payload: any = {};
      if (reason) payload.reason = reason;
      if (newStartDate) payload.newStartDate = newStartDate;
      if (newEndDate) payload.newEndDate = newEndDate;
      const res = await apiRequest("PUT", `/api/resource-requests/reopen-records/${id}`, payload);
      if (!res.ok) throw new Error("Failed to update reopen record");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reopen record updated",
        description: "Reopen record has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests/reopen-records", selectedRequest?.id] });
      setIsEditReopenDialogOpen(false);
      setSelectedReopenRecord(null);
      setReopenReason('');
      setNewStartDate('');
      setNewEndDate('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update reopen record",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete reopen record mutation
  const deleteReopenMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/resource-requests/reopen-records/${id}`);
      if (!res.ok) throw new Error("Failed to delete reopen record");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reopen record deleted",
        description: "Reopen record has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests/reopen-records", selectedRequest?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete reopen record",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });


  // Filter requests
  const filteredRequests = requests.filter((request: any) => {
    const matchesSearch = searchTerm === "" ||
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || request.department === departmentFilter;
    const matchesRequestType = requestTypeFilter === "all" || request.requestType === requestTypeFilter;
    const matchesProject = projectFilter === "all" || request.projectId?.toString() === projectFilter;

    return matchesSearch && matchesStatus && matchesDepartment && matchesRequestType && matchesProject;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleApproval = () => {
    if (!selectedRequest) return;

    const status = approvalAction === 'approve' ? 'Approved' : 'Rejected';
    approvalMutation.mutate({
      id: selectedRequest.id,
      status,
      comments: approvalComments
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  };

  const calculateDuration = (startDate: string | null | undefined, endDate: string | null | undefined) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Ensure dates are valid before calculating difference
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // Dashboard statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === 'Pending').length,
    approved: requests.filter((r: any) => r.status === 'Approved').length,
    inProgress: requests.filter((r: any) => r.status === 'In Progress').length,
    completed: requests.filter((r: any) => r.status === 'Completed').length,
    overdue: requests.filter((r: any) => {
      const today = new Date();
      const endDate = new Date(r.endDate);
      // Ensure endDate is a valid date
      if (isNaN(endDate.getTime())) return false;
      return endDate < today && ['Pending', 'Approved', 'In Progress'].includes(r.status);
    }).length
  };

  // Show loading while essential data is being fetched
  if (requestsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <p className="ml-4">Loading request forms...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Request Forms</h1>
              <p className="text-muted-foreground">
                Manage resource requests for development, QA, DevOps, and other departments
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          startTransition(() => {
            setActiveTab(value);
          });
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approval
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Requests</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Approved</p>
                    <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center gap-3">
                  <Settings className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Latest resource requests across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.slice(0, 5).map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="font-semibold">{request.title}</div>
                          <div className="text-sm text-gray-500">{request.requestId}</div>
                        </div>
                        <Badge variant="outline">{request.department}</Badge>
                        <Badge variant="outline">{request.requestType}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resource Requests
                    </CardTitle>
                    <CardDescription>Create and manage resource requests for various departments</CardDescription>
                  </div>
                  <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => {
                          setEditingRequest(null);
                          setIsFormDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingRequest ? "Edit Request" : "Create New Request"}
                        </DialogTitle>
                      </DialogHeader>
                      <RequestFormForm
                        request={editingRequest}
                        projects={projects}
                        requestTypes={requestTypes}
                        employees={employees}
                        onSubmit={(data) => createRequestMutation.mutate(data)}
                        onCancel={() => {
                          setIsFormDialogOpen(false);
                          setEditingRequest(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Hold">Hold</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="QA">QA</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="requestType" className="text-sm font-medium">Request Type</Label>
                    <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="QA Resource Request">QA Resource</SelectItem>
                        <SelectItem value="Developer Resource Request">Developer Resource</SelectItem>
                        <SelectItem value="DevOps Resource Request">DevOps Resource</SelectItem>
                        <SelectItem value="Design Resource Request">Design Resource</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="project" className="text-sm font-medium">Project</Label>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.projectName || project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setDepartmentFilter("all");
                      setRequestTypeFilter("all");
                      setProjectFilter("all");
                    }}>
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Requests Table */}
                {requestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No requests found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first resource request to get started.
                    </p>
                    <Button
                      onClick={() => setIsFormDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Request
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request: any) => {
                          const project = projects.find((p: any) => p.id === request.projectId);
                          const duration = calculateDuration(request.startDate, request.endDate);

                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.requestId || 'N/A'}</TableCell>
                              <TableCell>{request.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{request.requestType}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{request.department}</Badge>
                              </TableCell>
                              <TableCell>{project?.projectName || project?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge className={getPriorityColor(request.priority)}>
                                  {request.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      request.status === 'Open' ? 'bg-green-500' :
                                      request.status === 'Hold' ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}
                                    title={`Status: ${request.status}`}
                                  />
                                  <Badge
                                    variant={
                                      request.status === 'Open' ? 'default' :
                                      request.status === 'Hold' ? 'secondary' : 'outline'
                                    }
                                    data-testid={`status-badge-${request.id}`}
                                  >
                                    {request.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{duration} days</TableCell>
                              <TableCell>{formatDate(request.startDate)}</TableCell>
                              <TableCell>{formatDate(request.endDate)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      startTransition(() => {
                                        setSelectedRequest(request);
                                        setIsViewDialogOpen(true);
                                      });
                                    }}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      startTransition(() => {
                                        setSelectedRequest(request);
                                        setIsCommentsDialogOpen(true);
                                      });
                                    }}
                                    title="Comments"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      startTransition(() => {
                                        setSelectedRequest(request);
                                        setIsAttachmentsDialogOpen(true);
                                      });
                                    }}
                                    title="Attachments"
                                    data-testid={`button-attachments-${request.id}`}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      startTransition(() => {
                                        setEditingRequest(request);
                                        setIsFormDialogOpen(true);
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {['Pending', 'Approved', 'In Progress'].includes(request.status) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        startTransition(() => {
                                          setSelectedRequest(request);
                                          setIsExtensionDialogOpen(true);
                                        });
                                      }}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Reopen button - only visible if request is Closed or Rejected */}
                                  {['Closed', 'Rejected'].includes(request.status) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        startTransition(() => {
                                          setSelectedRequest(request);
                                          setIsReopenDialogOpen(true);
                                        });
                                      }}
                                      title="Reopen Request"
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        // Import jsPDF dynamically with proper error handling
                                        const { jsPDF } = await import('jspdf');
                                        const jsPDFInstance = new jsPDF();

                                        // Try to import jspdf-autotable
                                        try {
                                          await import('jspdf-autotable');
                                        } catch (autoTableError) {
                                          console.warn('jspdf-autotable not available, using basic PDF generation');
                                        }

                                        const doc = jsPDFInstance;
                                        const project = projects.find((p: any) => p.id === request.projectId);

                                        // Get audit logs for this request
                                        let auditLogs: any[] = [];
                                        try {
                                          const auditResponse = await apiRequest('GET', `/api/resource-requests/${request.id}/audit-logs`);
                                          auditLogs = auditResponse.ok ? await auditResponse.json() : [];
                                        } catch (error) {
                                          console.warn('Could not fetch audit logs:', error);
                                        }

                                        // Title and Header
                                        doc.setFontSize(18);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text('Resource Request Report', 105, 20, { align: 'center' });

                                        doc.setFontSize(12);
                                        doc.setFont('helvetica', 'normal');
                                        doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 105, 30, { align: 'center' });

                                        // Request Summary
                                        let yPos = 50;
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text('Request Summary', 20, yPos);

                                        yPos += 10;
                                        doc.setFontSize(10);
                                        doc.setFont('helvetica', 'normal');

                                        const summaryItems = [
                                          ['Request ID:', request.requestId || `REQ-${request.id}`],
                                          ['Title:', request.title],
                                          ['Type:', request.requestType],
                                          ['Department:', request.department],
                                          ['Project:', project?.projectName || project?.name || 'N/A'],
                                          ['Priority:', request.priority],
                                          ['Status:', request.status],
                                          ['Estimated Hours:', `${request.estimatedHours} hours`],
                                          ['Duration:', `${calculateDuration(request.startDate, request.endDate)} days`],
                                        ];

                                        summaryItems.forEach(([label, value]) => {
                                          doc.text(label, 20, yPos);
                                          doc.text(String(value), 80, yPos);
                                          yPos += 8;
                                        });

                                        // Timeline Information
                                        yPos += 10;
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text('Timeline Information', 20, yPos);

                                        yPos += 10;
                                        doc.setFontSize(10);
                                        doc.setFont('helvetica', 'normal');

                                        const timelineItems = [
                                          ['Planned Start Date:', formatDate(request.startDate)],
                                          ['Planned End Date:', formatDate(request.endDate)],
                                          ['Created Date:', formatDate(request.createdAt)],
                                          ['Last Updated:', formatDate(request.updatedAt)],
                                        ];

                                        if (request.reopenedDate) {
                                          timelineItems.push(['Reopened Date:', formatDate(request.reopenedDate)]);
                                          timelineItems.push(['Reopen Reason:', request.reopenReason || 'Not specified']);
                                        }

                                        timelineItems.forEach(([label, value]) => {
                                          doc.text(label, 20, yPos);
                                          doc.text(String(value), 80, yPos);
                                          yPos += 8;
                                        });

                                        // Description
                                        if (request.description) {
                                          yPos += 10;
                                          doc.setFontSize(14);
                                          doc.setFont('helvetica', 'bold');
                                          doc.text('Description', 20, yPos);
                                          yPos += 10;
                                          doc.setFontSize(10);
                                          doc.setFont('helvetica', 'normal');
                                          const splitDescription = doc.splitTextToSize(request.description, 170);
                                          doc.text(splitDescription, 20, yPos);
                                          yPos += splitDescription.length * 5 + 10;
                                        }

                                        // Deliverables
                                        if (request.deliverables) {
                                          if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 20;
                                          }
                                          doc.setFontSize(14);
                                          doc.setFont('helvetica', 'bold');
                                          doc.text('Deliverables', 20, yPos);
                                          yPos += 10;
                                          doc.setFontSize(10);
                                          doc.setFont('helvetica', 'normal');
                                          const splitDeliverables = doc.splitTextToSize(request.deliverables, 170);
                                          doc.text(splitDeliverables, 20, yPos);
                                          yPos += splitDeliverables.length * 5 + 10;
                                        }

                                        // Acceptance Criteria
                                        if (request.acceptanceCriteria) {
                                          if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 20;
                                          }
                                          doc.setFontSize(14);
                                          doc.setFont('helvetica', 'bold');
                                          doc.text('Acceptance Criteria', 20, yPos);
                                          yPos += 10;
                                          doc.setFontSize(10);
                                          doc.setFont('helvetica', 'normal');
                                          const splitCriteria = doc.splitTextToSize(request.acceptanceCriteria, 170);
                                          doc.text(splitCriteria, 20, yPos);
                                        }

                                        // Save the PDF
                                        doc.save(`${request.requestId || `REQ-${request.id}`}_report.pdf`);
                                        toast({ title: "PDF Export", description: "Request report downloaded successfully." });
                                      } catch (error: any) {
                                        console.error("PDF Export Error:", error);
                                        toast({
                                          title: "PDF Export Failed",
                                          description: error.message || "Failed to generate PDF report",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    title="Export PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approval Tab */}
          <TabsContent value="approval" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Request Approval
                </CardTitle>
                <CardDescription>Review and approve/reject pending requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.filter((r: any) => r.status === 'Pending').map((request: any) => {
                    const project = projects.find((p: any) => p.id === request.projectId);
                    const duration = calculateDuration(request.startDate, request.endDate);

                    return (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{request.title}</h3>
                              <Badge variant="outline">{request.requestId}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{request.requestType}</span>
                              <span>•</span>
                              <span>{request.department}</span>
                              <span>•</span>
                              <span>{project?.projectName || project?.name}</span>
                              <span>•</span>
                              <span>{duration} days</span>
                            </div>
                            <p className="text-sm text-gray-600">{request.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              <span className="text-sm">
                                {formatDate(request.startDate)} - {formatDate(request.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                startTransition(() => {
                                  setSelectedRequest(request);
                                  setIsViewDialogOpen(true);
                                });
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedRequest(request);
                                setApprovalAction("reject");
                                setIsApprovalDialogOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedRequest(request);
                                setApprovalAction("approve");
                                setIsApprovalDialogOpen(true);
                              }}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {requests.filter((r: any) => r.status === 'Pending').length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No pending requests
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        All requests have been processed.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Request Form Settings
                    </CardTitle>
                    <CardDescription>Manage request form types and custom dropdown options</CardDescription>
                  </div>
                  <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Form Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Form Type</DialogTitle>
                      </DialogHeader>
                      <RequestFormTypeForm
                        onSubmit={(data) => {
                          apiRequest("POST", "/api/request-forms/types", data)
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: ["/api/request-forms/types"] });
                              setIsTypeDialogOpen(false);
                              toast({ title: "Success", description: "Request type created successfully." });
                            })
                            .catch((error) => {
                              toast({ title: "Error", description: error.message || "Failed to create request type", variant: "destructive" });
                            });
                        }}
                        onCancel={() => setIsTypeDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requestTypes.map((type: any) => (
                    <Card key={type.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{type.name}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                          <Badge variant="outline" className="mt-1">{type.department}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedRequest && (
          <>
            <RequestExtensionDialog
              open={isExtensionDialogOpen}
              onOpenChange={setIsExtensionDialogOpen}
              request={selectedRequest}
              onSuccess={() => {
                refetchRequests();
                setIsExtensionDialogOpen(false);
              }}
            />

            <RequestCommentsDialog
              open={isCommentsDialogOpen}
              onOpenChange={setIsCommentsDialogOpen}
              request={selectedRequest}
            />

            {/* Request Attachments Dialog */}
            <Dialog open={isAttachmentsDialogOpen} onOpenChange={setIsAttachmentsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request Attachments</DialogTitle>
                  <DialogDescription>
                    Manage attachments for this request
                  </DialogDescription>
                </DialogHeader>
                {selectedRequest && (
                  <RequestAttachments
                    requestId={selectedRequest.id}
                    onClose={() => setIsAttachmentsDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Request View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request Details</DialogTitle>
                </DialogHeader>
                {selectedRequest && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Request ID</label>
                            <p className="mt-1">{selectedRequest.requestId}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Title</label>
                            <p className="mt-1">{selectedRequest.title}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="mt-1">{selectedRequest.description}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department</label>
                            <Badge variant="secondary">{selectedRequest.department}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Request Type</label>
                            <Badge variant="outline">{selectedRequest.requestType}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Timeline & Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Priority</label>
                            <Badge className={getPriorityColor(selectedRequest.priority)}>
                              {selectedRequest.priority}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <Badge className={getStatusColor(selectedRequest.status)}>
                              {selectedRequest.status}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Start Date</label>
                            <p className="mt-1">{formatDate(selectedRequest.startDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">End Date</label>
                            <p className="mt-1">{formatDate(selectedRequest.endDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                            <p className="mt-1">{selectedRequest.estimatedHours} hours</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Duration</label>
                            <p className="mt-1">{calculateDuration(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {(selectedRequest.deliverables || selectedRequest.acceptanceCriteria || selectedRequest.additionalNotes) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Additional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedRequest.deliverables && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Deliverables</label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedRequest.deliverables}</p>
                            </div>
                          )}
                          {selectedRequest.acceptanceCriteria && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Acceptance Criteria</label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedRequest.acceptanceCriteria}</p>
                            </div>
                          )}
                          {selectedRequest.additionalNotes && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedRequest.additionalNotes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {(selectedRequest.skillsRequired?.length > 0 || selectedRequest.technologies?.length > 0) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Skills & Technologies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedRequest.skillsRequired?.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Required Skills</label>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedRequest.skillsRequired.map((skill: string, index: number) => (
                                  <Badge key={index} variant="outline">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedRequest.technologies?.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Technologies</label>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedRequest.technologies.map((tech: string, index: number) => (
                                  <Badge key={index} variant="secondary">{tech}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {(selectedRequest.reopenedDate || selectedRequest.reopenReason) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-orange-600">Reopen Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {selectedRequest.reopenedDate && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Reopened Date</label>
                              <p className="mt-1">{formatDate(selectedRequest.reopenedDate)}</p>
                            </div>
                          )}
                          {selectedRequest.reopenReason && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Reopen Reason</label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedRequest.reopenReason}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>


            {/* Reopen Request Dialog */}
            <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reopen Request</DialogTitle>
                  <DialogDescription>
                    Provide a reason for reopening this request and optionally update the timeline.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reopenReason">Reason for Reopening *</Label>
                    <Textarea
                      id="reopenReason"
                      placeholder="Explain why this request needs to be reopened..."
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newStartDate">New Start Date</Label>
                      <Input
                        id="newStartDate"
                        type="date"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newEndDate">New End Date</Label>
                      <Input
                        id="newEndDate"
                        type="date"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Show existing reopen records */}
                  {reopenRecordsData.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Previous Reopen Records</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {reopenRecordsData.map((record: any) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{record.reason}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(record.reopenedDate)}
                                {record.newStartDate && record.newEndDate &&
                                  ` • ${formatDate(record.newStartDate)} - ${formatDate(record.newEndDate)}`
                                }
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReopenRecord(record);
                                  setIsEditReopenDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this reopen record?')) {
                                    deleteReopenMutation.mutate(record.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsReopenDialogOpen(false);
                      setReopenReason('');
                      setNewStartDate('');
                      setNewEndDate('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedRequest && reopenReason.trim() && newStartDate && newEndDate) {
                        reopenMutation.mutate({
                          id: selectedRequest.id,
                          reason: reopenReason,
                          newStartDate,
                          newEndDate
                        });
                      }
                    }}
                    disabled={!reopenReason.trim() || !newStartDate || !newEndDate || reopenMutation.isPending}
                  >
                    {reopenMutation.isPending ? "Reopening..." : "Reopen Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Reopen Record Dialog */}
            <Dialog open={isEditReopenDialogOpen} onOpenChange={setIsEditReopenDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Reopen Record</DialogTitle>
                  <DialogDescription>
                    Update the reopen reason and timeline information.
                  </DialogDescription>
                </DialogHeader>
                {selectedReopenRecord && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editReopenReason">Reason for Reopening *</Label>
                      <Textarea
                        id="editReopenReason"
                        placeholder="Explain why this request was reopened..."
                        defaultValue={selectedReopenRecord.reason}
                        rows={3}
                        onChange={(e) => setReopenReason(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="editNewStartDate">New Start Date</Label>
                        <Input
                          id="editNewStartDate"
                          type="date"
                          defaultValue={selectedReopenRecord.newStartDate ?
                            new Date(selectedReopenRecord.newStartDate).toISOString().split('T')[0] : ''
                          }
                          onChange={(e) => setNewStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editNewEndDate">New End Date</Label>
                        <Input
                          id="editNewEndDate"
                          type="date"
                          defaultValue={selectedReopenRecord.newEndDate ?
                            new Date(selectedReopenRecord.newEndDate).toISOString().split('T')[0] : ''
                          }
                          onChange={(e) => setNewEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditReopenDialogOpen(false);
                      setSelectedReopenRecord(null);
                      setReopenReason('');
                      setNewStartDate('');
                      setNewEndDate('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedReopenRecord) {
                        updateReopenMutation.mutate({
                          id: selectedReopenRecord.id,
                          reason: reopenReason || selectedReopenRecord.reason,
                          newStartDate: newStartDate || selectedReopenRecord.newStartDate,
                          newEndDate: newEndDate || selectedReopenRecord.newEndDate
                        });
                      }
                    }}
                    disabled={updateReopenMutation.isPending}
                  >
                    {updateReopenMutation.isPending ? "Updating..." : "Update Record"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Request: {selectedRequest?.title}</Label>
                <p className="text-sm text-gray-600">{selectedRequest?.requestId}</p>
              </div>
              <div>
                <Label>Comments</Label>
                <Textarea
                  placeholder={`Add ${approvalAction} comments...`}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApproval}
                  className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  disabled={approvalMutation.isPending}
                >
                  {approvalMutation.isPending ? 'Processing...' :
                   approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default function RequestFormsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <Suspense fallback={<LoadingFallback />}>
        <RequestFormsPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}