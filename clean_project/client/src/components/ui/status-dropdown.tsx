
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface StatusDropdownProps {
  currentStatus: string;
  statusOptions: string[];
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function StatusDropdown({
  currentStatus,
  statusOptions,
  onStatusChange,
  disabled = false
}: StatusDropdownProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
      case 'active':
      case 'approved':
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'rejected':
      case 'open':
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'in progress':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-7 px-2 text-xs font-medium border",
            getStatusColor(currentStatus)
          )}
        >
          {currentStatus}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(status)}
            className="text-sm"
          >
            <div className="flex items-center">
              {currentStatus === status && (
                <Check className="h-3 w-3 mr-2" />
              )}
              <span className={cn(
                "px-2 py-1 rounded text-xs",
                getStatusColor(status)
              )}>
                {status}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
