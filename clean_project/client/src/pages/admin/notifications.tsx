
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Plus, Send, Edit, Trash, Eye, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "update";
  priority: "low" | "medium" | "high";
  targetAudience: "all" | "admins" | "managers" | "testers" | "developers";
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
}

const notificationTypes = [
  { value: "info", label: "Information", color: "bg-blue-100 text-blue-800" },
  { value: "success", label: "Success", color: "bg-green-100 text-green-800" },
  { value: "warning", label: "Warning", color: "bg-yellow-100 text-yellow-800" },
  { value: "update", label: "Update", color: "bg-purple-100 text-purple-800" }
];

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" }
];

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "admins", label: "Administrators" },
  { value: "managers", label: "Project Managers" },
  { value: "testers", label: "Testers" },
  { value: "developers", label: "Developers" }
];

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as AdminNotification["type"],
    priority: "medium" as AdminNotification["priority"],
    targetAudience: "all" as AdminNotification["targetAudience"],
    isActive: true,
    expiresAt: ""
  });

  // Mock data for now - in real app, this would come from API
  const mockNotifications: AdminNotification[] = [
    {
      id: "1",
      title: "System Maintenance Scheduled",
      message: "Scheduled maintenance will occur this weekend from 2 AM to 6 AM EST. Please save your work before this time.",
      type: "warning",
      priority: "high",
      targetAudience: "all",
      isActive: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdBy: "Admin User"
    },
    {
      id: "2", 
      title: "New Test Automation Features",
      message: "We've released new AI-powered test case generation features. Check out the enhanced capabilities in the Test Cases section.",
      type: "update",
      priority: "medium",
      targetAudience: "testers",
      isActive: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      createdBy: "Admin User"
    },
    {
      id: "3",
      title: "Monthly Testing Excellence Award",
      message: "Congratulations to the QA team for achieving 99% test coverage this month! Your dedication to quality is outstanding.",
      type: "success",
      priority: "low",
      targetAudience: "all",
      isActive: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdBy: "Admin User"
    }
  ];

  const { data: notifications = mockNotifications } = useQuery<AdminNotification[]>({
    queryKey: ["/api/admin/notifications"],
    staleTime: 30 * 1000
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notification: Partial<AdminNotification>) => {
      return apiRequest("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification)
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Created",
        description: "The notification has been created and will be visible to users on their next login."
      });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create the notification.",
        variant: "destructive"
      });
    }
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, ...notification }: Partial<AdminNotification> & { id: string }) => {
      return apiRequest(`/api/admin/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification)
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Updated",
        description: "The notification has been successfully updated."
      });
      setEditingNotification(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/notifications/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Deleted",
        description: "The notification has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "medium", 
      targetAudience: "all",
      isActive: true,
      expiresAt: ""
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required.",
        variant: "destructive"
      });
      return;
    }

    const notificationData = {
      ...formData,
      createdBy: "Current Admin User", // This would come from auth context
      createdAt: new Date(),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
    };

    if (editingNotification) {
      updateNotificationMutation.mutate({ 
        id: editingNotification.id, 
        ...notificationData 
      });
    } else {
      createNotificationMutation.mutate(notificationData);
    }
  };

  const handleEdit = (notification: AdminNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      targetAudience: notification.targetAudience,
      isActive: notification.isActive,
      expiresAt: notification.expiresAt ? notification.expiresAt.toISOString().split('T')[0] : ""
    });
    setIsCreateDialogOpen(true);
  };

  const getTypeStyle = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.color || "bg-gray-100 text-gray-800";
  };

  const getPriorityStyle = (priority: string) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    return priorityConfig?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
              <p className="text-gray-600">Create and manage system-wide notifications for users</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingNotification(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNotification ? "Edit Notification" : "Create New Notification"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter notification title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter notification message"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: AdminNotification["type"]) => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: AdminNotification["priority"]) =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={formData.targetAudience} onValueChange={(value: AdminNotification["targetAudience"]) =>
                    setFormData(prev => ({ ...prev, targetAudience: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map(audience => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="expires">Expiration Date (Optional)</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createNotificationMutation.isPending || updateNotificationMutation.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {editingNotification ? "Update" : "Create"} Notification
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getTypeStyle(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge variant="outline" className={getPriorityStyle(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {audienceOptions.find(a => a.value === notification.targetAudience)?.label}
                      </Badge>
                      {notification.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(notification)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{notification.message}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created by {notification.createdBy}</span>
                  <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</span>
                </div>
                {notification.expiresAt && (
                  <div className="text-sm text-orange-600 mt-1">
                    Expires: {notification.expiresAt.toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
