
import { ReactNode } from "react";
import { usePermissions, ModulePermissions } from "@/hooks/use-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module: keyof ModulePermissions;
  action: keyof Permission;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  children, 
  module, 
  action, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to {action} {module}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

