import { Module } from "@/types";
import { 
  Select,
  SelectContent, 
  SelectTrigger, 
  SelectValue,
  SelectItem
} from "./select";
import { StatusBadge } from "./status-badge";

interface ModuleSelectProps {
  modules: Module[] | undefined;
  isLoading: boolean;
  selectedModuleId: number | string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
}

export function ModuleSelect({
  modules,
  isLoading,
  selectedModuleId,
  onChange,
  className,
  placeholder = "Select a module",
  disabled = false,
  includeAllOption = false
}: ModuleSelectProps) {
  return (
    <Select
      value={selectedModuleId?.toString() || ""}
      onValueChange={onChange}
      disabled={disabled || isLoading}
      data-testid="module-select"
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading modules...
          </SelectItem>
        ) : modules && modules.length > 0 ? (
          <>
            {includeAllOption && (
              <SelectItem value="all">All modules</SelectItem>
            )}
            {modules.map((module) => (
              <SelectItem 
                key={module.id} 
                value={module.id.toString()} 
                className="flex items-center justify-between pr-8"
              >
                <span>{module.name}</span>
                <StatusBadge status={module.status} className="ml-2" />
              </SelectItem>
            ))}
          </>
        ) : (
          <SelectItem value="empty" disabled>
            No modules found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}