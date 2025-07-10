import { forwardRef } from "react";
import { SelectItem, SelectItemProps } from "./select";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

interface StatusSelectItemProps extends SelectItemProps {
  showStatus?: boolean;
  status?: string;
}

export const StatusSelectItem = forwardRef<HTMLDivElement, StatusSelectItemProps>(
  ({ children, className, showStatus = true, status, ...props }, ref) => {
    return (
      <SelectItem ref={ref} className={cn("flex items-center justify-between pr-8", className)} {...props}>
        <span>{children}</span>
        {showStatus && status && (
          <StatusBadge status={status} className="ml-2" />
        )}
      </SelectItem>
    );
  }
);

StatusSelectItem.displayName = "StatusSelectItem";