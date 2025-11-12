import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Settings, Save, Loader2, User } from "lucide-react";

interface FeaturePermission {
  module: string;
  feature: string;
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface RolePermissions {
  [key: string]: FeaturePermission[];
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
}

interface RolePermissionsProps {
  rolePermissions: RolePermissions;
  setRolePermissions: (permissions: RolePermissions) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}

const systemFeatures: FeaturePermission[] = [
  { module: "Dashboard", feature: "Dashboard View", view: false, create: false, update: false, delete: false },
  { module: "Projects", feature: "Project Management", view: false, create: false, update: false, delete: false },
  { module: "Projects", feature: "Project Members", view: false, create: false, update: false, delete: false },
  { module: "Kanban Board", feature: "Kanban Management", view: false, create: false, update: false, delete: false },
  { module: "Test Cases", feature: "Test Case Management", view: false, create: false, update: false, delete: false },
  { module: "Test Cases", feature: "Test Execution", view: false, create: false, update: false, delete: false },
  { module: "AI Generator", feature: "AI Test Generation", view: false, create: false, update: false, delete: false },
  { module: "Bug Reports", feature: "Bug Management", view: false, create: false, update: false, delete: false },
  { module: "Bug Reports", feature: "Bug Assignment", view: false, create: false, update: false, delete: false },
  { module: "Messenger", feature: "Chat Management", view: false, create: false, update: false, delete: false },
  { module: "GitHub", feature: "GitHub Integration", view: false, create: false, update: false, delete: false },
  { module: "Functional Flow", feature: "Flow Diagrams", view: false, create: false, update: false, delete: false },
  { module: "Timesheets", feature: "Time Tracking", view: false, create: false, update: false, delete: false },
  { module: "Documents", feature: "Document Management", view: false, create: false, update: false, delete: false },
  { module: "Reports", feature: "Generate Reports", view: false, create: false, update: false, delete: false },
  { module: "Reports", feature: "Export Data", view: false, create: false, update: false, delete: false },
  { module: "Test Sheets", feature: "Test Sheet Management", view: false, create: false, update: false, delete: false },
  { module: "Traceability Matrix", feature: "Matrix Management", view: false, create: false, update: false, delete: false },
  { module: "Notebooks", feature: "Note Management", view: false, create: false, update: false, delete: false },
  { module: "Todo List", feature: "Todo Management", view: false, create: false, update: false, delete: false },
  { module: "Test Automation", feature: "Automation Scripts", view: false, create: false, update: false, delete: false },
  { module: "Catalyst Management", feature: "Employee Management", view: false, create: false, update: false, delete: false },
  { module: "Navadhiti Projects", feature: "Navadhiti Management", view: false, create: false, update: false, delete: false },
  { module: "Users", feature: "User Management", view: false, create: false, update: false, delete: false },
  { module: "Settings", feature: "System Configuration", view: false, create: false, update: false, delete: false },
  { module: "Profile", feature: "Profile Management", view: false, create: false, update: false, delete: false },
];

export function RolePermissions({ 
  rolePermissions, 
  setRolePermissions, 
  selectedRole, 
  setSelectedRole 
}: RolePermissionsProps) {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [permissionType, setPermissionType] = useState<"role" | "employee">("role");

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.json();
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: FeaturePermission[] }) => {
      const response = await apiRequest("PUT", `/api/roles/${role}/permissions`, { permissions });
      if (!response.ok) throw new Error("Failed to update permissions");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions updated",
        description: "Role permissions have been successfully updated.",
      });
    },
  });

  // Update employee permissions mutation
  const updateEmployeePermissionsMutation = useMutation({
    mutationFn: async ({ employeeId, permissions }: { employeeId: string; permissions: FeaturePermission[] }) => {
      const response = await apiRequest("PUT", `/api/employees/${employeeId}/permissions`, { permissions });
      if (!response.ok) throw new Error("Failed to update employee permissions");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Employee permissions updated",
        description: "Employee permissions have been successfully updated.",
      });
    },
  });

  const availableRoles = ["Admin", "Tester", "Developer"];
  const currentRolePermissions = rolePermissions[selectedRole] || systemFeatures;
  const currentEmployeePermissions = selectedEmployee ? rolePermissions[`employee_${selectedEmployee}`] || systemFeatures : systemFeatures;

  const handlePermissionToggle = (featureIndex: number, action: 'view' | 'create' | 'update' | 'delete', checked: boolean) => {
    const updatedPermissions = { ...rolePermissions };
    const targetKey = permissionType === "role" ? selectedRole : `employee_${selectedEmployee}`;
    
    if (!updatedPermissions[targetKey]) {
      updatedPermissions[targetKey] = [...systemFeatures];
    }

    updatedPermissions[targetKey][featureIndex] = {
      ...updatedPermissions[targetKey][featureIndex],
      [action]: checked
    };

    setRolePermissions(updatedPermissions);
  };

  const handleSavePermissions = () => {
    if (permissionType === "role" && !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role first",
        variant: "destructive",
      });
      return;
    }

    if (permissionType === "employee" && !selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee first",
        variant: "destructive",
      });
      return;
    }

    if (permissionType === "role") {
      updatePermissionsMutation.mutate({
        role: selectedRole,
        permissions: currentRolePermissions
      });
    } else {
      updateEmployeePermissionsMutation.mutate({
        employeeId: selectedEmployee,
        permissions: currentEmployeePermissions
      });
    }
  };

  const currentPermissions = permissionType === "role" ? currentRolePermissions : currentEmployeePermissions;
  
  const groupedFeatures = currentPermissions.reduce((acc, feature, index) => {
    if (!acc[feature.module]) {
      acc[feature.module] = [];
    }
    acc[feature.module].push({ ...feature, index });
    return acc;
  }, {} as Record<string, (FeaturePermission & { index: number })[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Permissions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Permission Type</label>
              <Select value={permissionType} onValueChange={(value: "role" | "employee") => setPermissionType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose permission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Role-based Permissions
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee-specific Permissions
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {permissionType === "role" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a role to configure permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {permissionType === "employee" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an employee to configure permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {employee.firstName} {employee.lastName} ({employee.employeeId})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {((permissionType === "role" && selectedRole) || (permissionType === "employee" && selectedEmployee)) && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Configure permissions for: {permissionType === "role" 
                      ? selectedRole 
                      : employees.find(emp => emp.id.toString() === selectedEmployee)?.firstName + " " + employees.find(emp => emp.id.toString() === selectedEmployee)?.lastName
                    }
                  </h3>
                  <Button 
                    onClick={handleSavePermissions}
                    disabled={updatePermissionsMutation.isPending || updateEmployeePermissionsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {(updatePermissionsMutation.isPending || updateEmployeePermissionsMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Permissions
                  </Button>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedFeatures).map(([module, features]) => (
                    <Card key={module}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {module}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-4 font-medium text-sm text-gray-600 border-b pb-2">
                            <div>Feature</div>
                            <div className="text-center">View</div>
                            <div className="text-center">Create</div>
                            <div className="text-center">Update</div>
                            <div className="text-center">Delete</div>
                          </div>

                          {features.map((feature) => (
                            <div key={feature.index} className="grid grid-cols-5 gap-4 items-center py-2 border-b last:border-b-0">
                              <div className="font-medium">{feature.feature}</div>
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={feature.view}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(feature.index, 'view', !!checked)
                                  }
                                />
                              </div>
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={feature.create}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(feature.index, 'create', !!checked)
                                  }
                                />
                              </div>
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={feature.update}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(feature.index, 'update', !!checked)
                                  }
                                />
                              </div>
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={feature.delete}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(feature.index, 'delete', !!checked)
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}