
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type UserRole = "Admin" | "Developer" | "Tester";

export interface Permission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface ModulePermissions {
  projects: Permission;
  testCases: Permission;
  bugs: Permission;
  users: Permission;
  reports: Permission;
  documents: Permission;
  timeSheets: Permission;
  automation: Permission;
  kanban: Permission;
  traceability: Permission;
}

const DEFAULT_PERMISSIONS: Permission = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canManage: false,
};

const FULL_PERMISSIONS: Permission = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
  canManage: true,
};

const READ_ONLY_PERMISSIONS: Permission = {
  canCreate: false,
  canRead: true,
  canUpdate: false,
  canDelete: false,
  canManage: false,
};

const READ_UPDATE_PERMISSIONS: Permission = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: false,
  canManage: false,
};

export function getPermissionsForRole(role: UserRole): ModulePermissions {
  switch (role) {
    case "Admin":
      return {
        projects: FULL_PERMISSIONS,
        testCases: FULL_PERMISSIONS,
        bugs: FULL_PERMISSIONS,
        users: FULL_PERMISSIONS,
        reports: FULL_PERMISSIONS,
        documents: FULL_PERMISSIONS,
        timeSheets: FULL_PERMISSIONS,
        automation: FULL_PERMISSIONS,
        kanban: FULL_PERMISSIONS,
        traceability: FULL_PERMISSIONS,
      };

    case "Developer":
      return {
        projects: READ_ONLY_PERMISSIONS,
        testCases: READ_UPDATE_PERMISSIONS,
        bugs: {
          canCreate: false,
          canRead: true,
          canUpdate: true, // Can update bugs assigned to them
          canDelete: false,
          canManage: false,
        },
        users: READ_ONLY_PERMISSIONS,
        reports: READ_ONLY_PERMISSIONS,
        documents: READ_UPDATE_PERMISSIONS,
        timeSheets: READ_UPDATE_PERMISSIONS,
        automation: READ_UPDATE_PERMISSIONS,
        kanban: READ_UPDATE_PERMISSIONS,
        traceability: READ_ONLY_PERMISSIONS,
      };

    case "Tester":
      return {
        projects: READ_ONLY_PERMISSIONS,
        testCases: READ_UPDATE_PERMISSIONS,
        bugs: READ_UPDATE_PERMISSIONS,
        users: READ_ONLY_PERMISSIONS,
        reports: READ_ONLY_PERMISSIONS,
        documents: READ_UPDATE_PERMISSIONS,
        timeSheets: READ_UPDATE_PERMISSIONS,
        automation: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        },
        kanban: READ_UPDATE_PERMISSIONS,
        traceability: READ_ONLY_PERMISSIONS,
      };

    default:
      return {
        projects: DEFAULT_PERMISSIONS,
        testCases: DEFAULT_PERMISSIONS,
        bugs: DEFAULT_PERMISSIONS,
        users: DEFAULT_PERMISSIONS,
        reports: DEFAULT_PERMISSIONS,
        documents: DEFAULT_PERMISSIONS,
        timeSheets: DEFAULT_PERMISSIONS,
        automation: DEFAULT_PERMISSIONS,
        kanban: DEFAULT_PERMISSIONS,
        traceability: DEFAULT_PERMISSIONS,
      };
  }
}

export function usePermissions() {
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/user");
      return response.json();
    },
  });

  const userRole = currentUser?.role as UserRole;
  const permissions = userRole ? getPermissionsForRole(userRole) : getPermissionsForRole("Tester");

  return {
    currentUser,
    userRole,
    permissions,
    hasPermission: (module: keyof ModulePermissions, action: keyof Permission) => {
      return permissions[module][action];
    },
    isAdmin: userRole === "Admin",
    isDeveloper: userRole === "Developer",
    isTester: userRole === "Tester",
  };
}

