
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Save, Users, Settings } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const permissionsData: Permission[] = [
  // Projects
  { id: "projects.view", name: "View Projects", description: "View project list and details", category: "Projects" },
  { id: "projects.create", name: "Create Projects", description: "Create new projects", category: "Projects" },
  { id: "projects.update", name: "Update Projects", description: "Edit existing projects", category: "Projects" },
  { id: "projects.delete", name: "Delete Projects", description: "Delete projects", category: "Projects" },
  
  // Test Cases
  { id: "testcases.view", name: "View Test Cases", description: "View test cases", category: "Test Cases" },
  { id: "testcases.create", name: "Create Test Cases", description: "Create new test cases", category: "Test Cases" },
  { id: "testcases.update", name: "Update Test Cases", description: "Edit test cases", category: "Test Cases" },
  { id: "testcases.delete", name: "Delete Test Cases", description: "Delete test cases", category: "Test Cases" },
  { id: "testcases.execute", name: "Execute Test Cases", description: "Run and update test case status", category: "Test Cases" },
  
  // Bug Reports
  { id: "bugs.view", name: "View Bugs", description: "View bug reports", category: "Bug Reports" },
  { id: "bugs.create", name: "Create Bugs", description: "Report new bugs", category: "Bug Reports" },
  { id: "bugs.update", name: "Update Bugs", description: "Edit bug reports", category: "Bug Reports" },
  { id: "bugs.delete", name: "Delete Bugs", description: "Delete bug reports", category: "Bug Reports" },
  { id: "bugs.assign", name: "Assign Bugs", description: "Assign bugs to team members", category: "Bug Reports" },
  
  // Reports
  { id: "reports.view", name: "View Reports", description: "Access reports and analytics", category: "Reports" },
  { id: "reports.export", name: "Export Reports", description: "Export reports to various formats", category: "Reports" },
  { id: "reports.generate", name: "Generate Reports", description: "Create custom reports", category: "Reports" },
  
  // Users
  { id: "users.view", name: "View Users", description: "View user list", category: "User Management" },
  { id: "users.create", name: "Create Users", description: "Add new users", category: "User Management" },
  { id: "users.update", name: "Update Users", description: "Edit user details", category: "User Management" },
  { id: "users.delete", name: "Delete Users", description: "Remove users", category: "User Management" },
  
  // Settings
  { id: "settings.view", name: "View Settings", description: "Access system settings", category: "Settings" },
  { id: "settings.update", name: "Update Settings", description: "Modify system configuration", category: "Settings" },
  
  // Timesheets
  { id: "timesheets.view", name: "View Timesheets", description: "View time tracking data", category: "Timesheets" },
  { id: "timesheets.create", name: "Create Timesheets", description: "Log time entries", category: "Timesheets" },
  { id: "timesheets.update", name: "Update Timesheets", description: "Edit time entries", category: "Timesheets" },
  
  // Documents
  { id: "documents.view", name: "View Documents", description: "Access document management", category: "Documents" },
  { id: "documents.upload", name: "Upload Documents", description: "Upload new documents", category: "Documents" },
  { id: "documents.delete", name: "Delete Documents", description: "Remove documents", category: "Documents" }
];

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access with all permissions",
    permissions: permissionsData.map(p => p.id)
  },
  {
    id: "project_manager",
    name: "Project Manager",
    description: "Manage projects, test cases, and team members",
    permissions: [
      "projects.view", "projects.create", "projects.update",
      "testcases.view", "testcases.create", "testcases.update", "testcases.execute",
      "bugs.view", "bugs.create", "bugs.update", "bugs.assign",
      "reports.view", "reports.export", "reports.generate",
      "users.view", "timesheets.view", "documents.view", "documents.upload"
    ]
  },
  {
    id: "test_lead",
    name: "Test Lead",
    description: "Lead testing activities and manage test cases",
    permissions: [
      "projects.view",
      "testcases.view", "testcases.create", "testcases.update", "testcases.execute",
      "bugs.view", "bugs.create", "bugs.update",
      "reports.view", "reports.export",
      "timesheets.view", "timesheets.create", "timesheets.update",
      "documents.view", "documents.upload"
    ]
  },
  {
    id: "tester",
    name: "Tester",
    description: "Execute test cases and report bugs",
    permissions: [
      "projects.view",
      "testcases.view", "testcases.execute",
      "bugs.view", "bugs.create", "bugs.update",
      "reports.view",
      "timesheets.view", "timesheets.create", "timesheets.update",
      "documents.view"
    ]
  },
  {
    id: "developer",
    name: "Developer",
    description: "View test results and manage assigned bugs",
    permissions: [
      "projects.view",
      "testcases.view",
      "bugs.view", "bugs.update",
      "reports.view",
      "documents.view"
    ]
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to projects and reports",
    permissions: [
      "projects.view",
      "testcases.view",
      "bugs.view",
      "reports.view",
      "documents.view"
    ]
  }
];

export default function PermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Get the current role's permissions
  useEffect(() => {
    const role = defaultRoles.find(r => r.id === selectedRole);
    setRolePermissions(role?.permissions || []);
  }, [selectedRole]);

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string, permissions: string[] }) => {
      return apiRequest(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "Role permissions have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update role permissions.",
        variant: "destructive",
      });
    }
  });

  const handlePermissionToggle = (permissionId: string) => {
    const updatedPermissions = rolePermissions.includes(permissionId)
      ? rolePermissions.filter(p => p !== permissionId)
      : [...rolePermissions, permissionId];
    
    setRolePermissions(updatedPermissions);
  };

  const handleSavePermissions = () => {
    updatePermissionMutation.mutate({
      roleId: selectedRole,
      permissions: rolePermissions
    });
  };

  const groupedPermissions = permissionsData.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const selectedRoleData = defaultRoles.find(r => r.id === selectedRole);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
              <p className="text-gray-600">Manage permissions for different user roles</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedRoleData && (
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        {selectedRoleData.name}
                      </Badge>
                      <p className="text-sm text-gray-600 text-center">
                        {selectedRoleData.description}
                      </p>
                      <div className="text-center">
                        <span className="text-xs text-gray-500">
                          {rolePermissions.length} permissions enabled
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSavePermissions} 
                    className="w-full"
                    disabled={updatePermissionMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePermissionMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Grid */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                              {permission.name}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {permission.description}
                            </p>
                          </div>
                          <Switch
                            id={permission.id}
                            checked={rolePermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
