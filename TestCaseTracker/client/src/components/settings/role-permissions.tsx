
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Settings, Save } from "lucide-react";

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

// Default roles configuration
const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access with all permissions",
    permissions: [
      "projects.create", "projects.read", "projects.update", "projects.delete",
      "testcases.create", "testcases.read", "testcases.update", "testcases.delete",
      "bugs.create", "bugs.read", "bugs.update", "bugs.delete",
      "users.create", "users.read", "users.update", "users.delete",
      "reports.create", "reports.read", "reports.update", "reports.delete",
      "settings.manage", "github.manage", "automation.manage"
    ]
  },
  {
    id: "manager",
    name: "Project Manager",
    description: "Manage projects and team members",
    permissions: [
      "projects.create", "projects.read", "projects.update",
      "testcases.create", "testcases.read", "testcases.update",
      "bugs.read", "bugs.update",
      "users.read", "users.update",
      "reports.read", "reports.create"
    ]
  },
  {
    id: "tester",
    name: "QA Tester",
    description: "Execute tests and report bugs",
    permissions: [
      "projects.read",
      "testcases.read", "testcases.update",
      "bugs.create", "bugs.read", "bugs.update",
      "reports.read"
    ]
  },
  {
    id: "developer",
    name: "Developer",
    description: "View and update assigned bugs",
    permissions: [
      "projects.read",
      "testcases.read",
      "bugs.read", "bugs.update",
      "reports.read"
    ]
  }
];

// Available permissions
const availablePermissions: Permission[] = [
  // Project permissions
  { id: "projects.create", name: "Create Projects", description: "Create new projects", category: "Projects" },
  { id: "projects.read", name: "View Projects", description: "View project details", category: "Projects" },
  { id: "projects.update", name: "Edit Projects", description: "Modify project settings", category: "Projects" },
  { id: "projects.delete", name: "Delete Projects", description: "Remove projects", category: "Projects" },
  
  // Test Case permissions
  { id: "testcases.create", name: "Create Test Cases", description: "Create new test cases", category: "Test Cases" },
  { id: "testcases.read", name: "View Test Cases", description: "View test case details", category: "Test Cases" },
  { id: "testcases.update", name: "Edit Test Cases", description: "Modify test cases", category: "Test Cases" },
  { id: "testcases.delete", name: "Delete Test Cases", description: "Remove test cases", category: "Test Cases" },
  
  // Bug permissions
  { id: "bugs.create", name: "Create Bugs", description: "Report new bugs", category: "Bug Reports" },
  { id: "bugs.read", name: "View Bugs", description: "View bug details", category: "Bug Reports" },
  { id: "bugs.update", name: "Edit Bugs", description: "Modify bug reports", category: "Bug Reports" },
  { id: "bugs.delete", name: "Delete Bugs", description: "Remove bug reports", category: "Bug Reports" },
  
  // User permissions
  { id: "users.create", name: "Create Users", description: "Add new users", category: "User Management" },
  { id: "users.read", name: "View Users", description: "View user profiles", category: "User Management" },
  { id: "users.update", name: "Edit Users", description: "Modify user accounts", category: "User Management" },
  { id: "users.delete", name: "Delete Users", description: "Remove user accounts", category: "User Management" },
  
  // Reports permissions
  { id: "reports.create", name: "Create Reports", description: "Generate new reports", category: "Reports" },
  { id: "reports.read", name: "View Reports", description: "Access report data", category: "Reports" },
  { id: "reports.update", name: "Edit Reports", description: "Modify existing reports", category: "Reports" },
  { id: "reports.delete", name: "Delete Reports", description: "Remove reports", category: "Reports" },
  
  // System permissions
  { id: "settings.manage", name: "Manage Settings", description: "Configure system settings", category: "System" },
  { id: "github.manage", name: "GitHub Integration", description: "Manage GitHub integrations", category: "Integrations" },
  { id: "automation.manage", name: "Test Automation", description: "Manage automation scripts", category: "Automation" }
];

export function RolePermissions() {
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
      // For now, we'll just simulate the API call
      // In a real implementation, this would call your API
      return new Promise(resolve => setTimeout(resolve, 1000));
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

  const groupedPermissions = availablePermissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const selectedRoleData = defaultRoles.find(r => r.id === selectedRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Role Permissions</h2>
            <p className="text-gray-600">Manage permissions for different user roles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
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
  );
}
