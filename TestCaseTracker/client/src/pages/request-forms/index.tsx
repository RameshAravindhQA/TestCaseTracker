import React, { useState, useEffect, Suspense, startTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle, FileText, Settings, History, MessageSquare, Eye, Edit, Trash2, Download, Upload, CalendarDays, Users, RefreshCw, Edit2 } from "lucide-react";
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

// Import the new Reopen Request Dialog component
import { RequestReopenDialog } from "@/components/request-forms/request-reopen-dialog";

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
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
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
  const [editingReopenId, setEditingReopenId] = useState<number | null>(null);
  const [editingReopenData, setEditingReopenData] = useState<any>(null);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
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
                                        setSelectedRequest(request);
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

                                        // Get assigned employee details - check both leadId and assignedToId
                                        const assignedEmployee = request.leadId ? employees.find(emp => emp.id === request.leadId) : 
                                                                (request.assignedToId ? employees.find(emp => emp.id === request.assignedToId) : null);
                                        const requestedByEmployee = employees.find(emp => emp.id === request.requestedById);

                                        const summaryItems = [
                                          ['Request ID:', request.requestId || `REQ-${request.id}`],
                                          ['Title:', request.title],
                                          ['Type:', request.requestType],
                                          ['Department:', request.department],
                                          ['Project:', project?.projectName || project?.name || 'N/A'],
                                          ['Priority:', request.priority],
                                          ['Status:', request.status],
                                          ['Requested By:', requestedByEmployee ? `${requestedByEmployee.firstName} ${requestedByEmployee.lastName}` : 'Unknown'],
                                          ['Assigned To:', assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : 'Not Assigned'],
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

                                        // Audit Trail Section
                                        if (auditLogs && auditLogs.length > 0) {
                                          if (yPos > 200) {
                                            doc.addPage();
                                            yPos = 20;
                                          }
                                          doc.setFontSize(14);
                                          doc.setFont("helvetica", "bold");
                                          doc.text('Audit Trail', 20, yPos);
                                          yPos += 15;

                                          // Prepare audit trail data for table
                                          const auditTableData = auditLogs.map((log, index) => {
                                            let details = '';
                                            let actionBy = 'System';

                                            // Get user who performed the action
                                            if (log.user) {
                                              actionBy = `${log.user.firstName} ${log.user.lastName}`;
                                            } else if (log.userId) {
                                              const actionUser = employees.find(emp => emp.id === log.userId);
                                              if (actionUser) {
                                                actionBy = `${actionUser.firstName} ${actionUser.lastName}`;
                                              }
                                            }

                                            if (log.details) {
                                              let logDetails;
                                              try {
                                                logDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                              } catch (e) {
                                                logDetails = { message: log.details };
                                              }

                                              if (logDetails.reason) {
                                                details += `Reason: ${logDetails.reason}\n`;
                                              }

                                              if (logDetails.dateChanges) {
                                                const dateChanges = logDetails.dateChanges;
                                                if (dateChanges.originalStartDate !== dateChanges.newStartDate) {
                                                  details += `Start Date: ${formatDate(dateChanges.originalStartDate)} → ${formatDate(dateChanges.newStartDate)}\n`;
                                                }
                                                if (dateChanges.originalEndDate !== dateChanges.newEndDate) {
                                                  details += `End Date: ${formatDate(dateChanges.originalEndDate)} → ${formatDate(dateChanges.newEndDate)}\n`;
                                                }
                                              }

                                              if (logDetails.employeeChanges) {
                                                const empChanges = logDetails.employeeChanges;
                                                if (empChanges.previousEmployeeName !== empChanges.newEmployeeName) {
                                                  details += `Employee: ${empChanges.previousEmployeeName || 'None'} → ${empChanges.newEmployeeName || 'None'}\n`;
                                                }
                                              }

                                              if (logDetails.newStartDate && !logDetails.dateChanges) {
                                                details += `New Start Date: ${formatDate(logDetails.newStartDate)}\n`;
                                              }
                                              if (logDetails.newEndDate && !logDetails.dateChanges) {
                                                details += `New End Date: ${formatDate(logDetails.newEndDate)}\n`;
                                              }

                                              if (logDetails.message && !details) {
                                                details = logDetails.message;
                                              }

                                              // Fallback: if details is still empty but logDetails has content, stringify it
                                              if (!details && logDetails && typeof logDetails === 'object') {
                                                details = JSON.stringify(logDetails, null, 2);
                                              }
                                            }

                                            return [
                                              index + 1,
                                              log.action.toUpperCase(),
                                              formatDate(log.createdAt || log.timestamp),
                                              actionBy,
                                              details.trim() || log.details || 'No additional details'
                                            ];
                                          });

                                          // Create audit trail table using autoTable
                                          try {
                                            (doc as any).autoTable({
                                              startY: yPos,
                                              head: [['#', 'Action', 'Date', 'Performed By', 'Details']],
                                              body: auditTableData,
                                              theme: 'grid',
                                              headStyles: {
                                                fillColor: [66, 139, 202],
                                                textColor: 255,
                                                fontSize: 10,
                                                fontStyle: 'bold'
                                              },
                                              bodyStyles: {
                                                fontSize: 8,
                                                cellPadding: 2
                                              },
                                              columnStyles: {
                                                0: { cellWidth: 10 }, // # column
                                                1: { cellWidth: 25 }, // Action column
                                                2: { cellWidth: 25 }, // Date column
                                                3: { cellWidth: 30 }, // Performed By column
                                                4: { cellWidth: 100 } // Details column
                                              },
                                              margin: { left: 20, right: 20 },
                                              tableWidth: 'wrap',
                                              styles: {
                                                overflow: 'linebreak',
                                                cellPadding: 2,
                                                fontSize: 8,
                                                valign: 'top'
                                              }
                                            });
                                          } catch (tableError) {
                                            console.warn('Could not create audit trail table, falling back to text format');
                                            // Fallback to simple text format if autoTable fails
                                            doc.setFontSize(10);
                                            doc.setFont("helvetica", "normal");
                                            auditLogs.forEach((log, index) => {
                                              if (yPos > 270) {
                                                doc.addPage();
                                                yPos = 20;
                                              }
                                              doc.text(`${index + 1}. ${log.action.toUpperCase()} - ${formatDate(log.createdAt)}`, 20, yPos);
                                              yPos += 8;
                                            });
                                          }
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

            {/* View Request Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request Details - {selectedRequest?.requestId}</DialogTitle>
                  <DialogDescription>
                    Complete information about this resource request
                  </DialogDescription>
                </DialogHeader>

                {selectedRequest && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Request ID</Label>
                          <p className="font-semibold">{selectedRequest.requestId}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Title</Label>
                          <p className="font-semibold">{selectedRequest.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Description</Label>
                          <p className="text-sm">{selectedRequest.description}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Request Type</Label>
                          <Badge variant="outline">{selectedRequest.requestType}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Department</Label>
                          <Badge variant="secondary">{selectedRequest.department}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Priority</Label>
                          <Badge className={getPriorityColor(selectedRequest.priority)}>
                            {selectedRequest.priority}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <Badge className={getStatusColor(selectedRequest.status)}>
                            {selectedRequest.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline & Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5" />
                          Timeline & Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Priority</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedRequest.priority === 'Critical' ? 'bg-red-500' :
                              selectedRequest.priority === 'High' ? 'bg-orange-500' :
                              selectedRequest.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="font-medium">{selectedRequest.priority}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedRequest.status === 'Open' ? 'bg-green-500' :
                              selectedRequest.status === 'Hold' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></div>
                            <Badge variant="outline">{selectedRequest.status}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                            <p className="font-medium">{formatDate(selectedRequest.startDate)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">End Date</Label>
                            <p className="font-medium">{formatDate(selectedRequest.endDate)}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Duration</Label>
                          <p className="font-medium">{calculateDuration(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Estimated Hours</Label>
                          <p className="font-medium">{selectedRequest.estimatedHours} hours</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Project & Assignment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Project & Assignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Project</Label>
                          <p className="font-medium">
                            {projects.find(p => p.id === selectedRequest.projectId)?.projectName || 
                             projects.find(p => p.id === selectedRequest.projectId)?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Assigned Employee</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const assignedEmployee = employees.find(emp => emp.id === selectedRequest.leadId);
                              return assignedEmployee ? (
                                <>
                                  {assignedEmployee.profilePicture ? (
                                    <img
                                      src={assignedEmployee.profilePicture}
                                      alt={`${assignedEmployee.firstName} ${assignedEmployee.lastName}`}
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                      {assignedEmployee.firstName?.charAt(0)}{assignedEmployee.lastName?.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {assignedEmployee.firstName} {assignedEmployee.lastName}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {assignedEmployee.department || 'No Dept'}
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">Not Assigned</span>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Requested By</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const requestedByEmployee = employees.find(emp => emp.id === selectedRequest.requestedById);
                              return requestedByEmployee ? (
                                <>
                                  {requestedByEmployee.profilePicture ? (
                                    <img
                                      src={requestedByEmployee.profilePicture}
                                      alt={`${requestedByEmployee.firstName} ${requestedByEmployee.lastName}`}
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                      {requestedByEmployee.firstName?.charAt(0)}{requestedByEmployee.lastName?.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {requestedByEmployee.firstName} {requestedByEmployee.lastName}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {requestedByEmployee.department || 'No Dept'}
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">Unknown</span>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Additional Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedRequest.deliverables && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Deliverables</Label>
                            <p className="text-sm mt-1">{selectedRequest.deliverables}</p>
                          </div>
                        )}
                        {selectedRequest.acceptanceCriteria && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Acceptance Criteria</Label>
                            <p className="text-sm mt-1">{selectedRequest.acceptanceCriteria}</p>
                          </div>
                        )}
                        {selectedRequest.additionalNotes && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Additional Notes</Label>
                            <p className="text-sm mt-1">{selectedRequest.additionalNotes}</p>
                          </div>
                        )}
                        {selectedRequest.skillsRequired && selectedRequest.skillsRequired.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Skills Required</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedRequest.skillsRequired.map((skill: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedRequest.technologies && selectedRequest.technologies.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Technologies</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedRequest.technologies.map((tech: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Reopen Information */}
                    {selectedRequest.reopenedDate && (
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600">
                            <RefreshCw className="h-5 w-5" />
                            Reopen Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Reopened Date</Label>
                            <p className="font-medium">{formatDate(selectedRequest.reopenedDate)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Reopen Reason</Label>
                            <p className="text-sm">{selectedRequest.reopenReason || 'No reason provided'}</p>
                          </div>
                          {selectedRequest.updatedStartDate && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Updated Start Date</Label>
                                <p className="font-medium">{formatDate(selectedRequest.updatedStartDate)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Updated End Date</Label>
                                <p className="font-medium">{formatDate(selectedRequest.updatedEndDate)}</p>
                              </div>
                            </div>
                          )}
                          {selectedRequest.reassignedEmployeeId && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Reassigned To</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {(() => {
                                  const reassignedEmployee = employees.find(emp => emp.id === selectedRequest.reassignedEmployeeId);
                                  return reassignedEmployee ? (
                                    <>
                                      {reassignedEmployee.profilePicture ? (
                                        <img
                                          src={reassignedEmployee.profilePicture}
                                          alt={`${reassignedEmployee.firstName} ${reassignedEmployee.lastName}`}
                                          className="h-6 w-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-medium">
                                          {reassignedEmployee.firstName?.charAt(0)}{reassignedEmployee.lastName?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-medium">
                                        {reassignedEmployee.firstName} {reassignedEmployee.lastName}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {reassignedEmployee.department || 'No Dept'}
                                      </Badge>
                                    </>
                                  ) : (
                                    <span className="text-gray-500 italic">Employee not found</span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Edit and Delete Actions for Reopen Record */}
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Set up editing mode for this reopen record
                                setEditingReopenId(selectedRequest.id);
                                setEditingReopenData({
                                  reason: selectedRequest.reopenReason || '',
                                  newStartDate: selectedRequest.updatedStartDate ? format(new Date(selectedRequest.updatedStartDate), 'yyyy-MM-dd') : '',
                                  newEndDate: selectedRequest.updatedEndDate ? format(new Date(selectedRequest.updatedEndDate), 'yyyy-MM-dd') : '',
                                  reassignedEmployeeId: selectedRequest.reassignedEmployeeId || ''
                                });
                                // Close view dialog and open reopen dialog in edit mode
                                setIsViewDialogOpen(false);
                                setIsReopenDialogOpen(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit Reopen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this reopen record? This will revert the request to its previous state.')) {
                                  try {
                                    // Call API to delete/revert reopen
                                    const response = await apiRequest('DELETE', `/api/resource-requests/${selectedRequest.id}/reopen`);
                                    if (response.ok) {
                                      toast({
                                        title: "Reopen record deleted",
                                        description: "The reopen record has been removed and the request reverted to its previous state.",
                                      });
                                      // Refresh the data
                                      queryClient.invalidateQueries({ queryKey: ["/api/resource-requests"] });
                                      setIsViewDialogOpen(false);
                                    } else {
                                      throw new Error('Failed to delete reopen record');
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: "Failed to delete reopen record",
                                      description: error.message || "An unexpected error occurred.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete Reopen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <RequestReopenDialog
              open={isReopenDialogOpen}
              onOpenChange={setIsReopenDialogOpen}
              request={selectedRequest}
              employees={employees}
              editingReopenId={editingReopenId}
              editingReopenData={editingReopenData}
              onCancelEdit={() => {
                setEditingReopenId(null);
                setEditingReopenData(null);
              }}
              onSuccess={() => {
                refetchRequests();
                setIsReopenDialogOpen(false);
                setEditingReopenId(null);
                setEditingReopenData(null);
              }}
            />
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