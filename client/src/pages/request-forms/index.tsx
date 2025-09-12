import React, { useState, useEffect, Suspense, startTransition } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle, FileText, Settings, History, MessageSquare, Eye, Edit, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { RequestFormForm } from "@/components/request-forms/request-form-form";
import { RequestFormTypeForm } from "@/components/request-forms/request-form-type-form";
import { RequestExtensionDialog } from "@/components/request-forms/request-extension-dialog";
import { RequestCommentsDialog } from "@/components/request-forms/request-comments-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorBoundary } from "react-error-boundary";

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
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComments, setApprovalComments] = useState("");

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

  // Create/Update request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingRequest ? "PUT" : "POST";
      const url = editingRequest ? `/api/resource-requests/${editingRequest.id}` : "/api/resource-requests";
      const res = await apiRequest(method, url, data);
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
    onError: (error) => {
      toast({
        title: `Failed to ${editingRequest ? "update" : "create"} request`,
        description: `${error}`,
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
    onError: (error) => {
      toast({
        title: "Failed to update request",
        description: `${error}`,
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
    const matchesProject = projectFilter === "all" || request.projectId.toString() === projectFilter;

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
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
                                        setIsCommentsDialogOpen(true);
                                      });
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
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
                                  setIsCommentsDialogOpen(true);
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
                        onSubmit={() => setIsTypeDialogOpen(false)}
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