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
  isLoading?: boolean;
  selectedModuleId: number | string | null | undefined;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  value?: string | number;
  onValueChange?: (value: string) => void;
}

export function ModuleSelect({
  modules,
  isLoading = false,
  selectedModuleId,
  onChange,
  className,
  placeholder = "Select a module",
  disabled = false,
  includeAllOption = false,
  value,
  onValueChange
}: ModuleSelectProps) {
  const handleValueChange = onValueChange || onChange;
  const currentValue = value !== undefined ? value.toString() : (selectedModuleId != null) ? selectedModuleId.toString() : "";

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
      data-testid="module-select"
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} >
          {selectedModuleId ? selectedModuleId.toString() : "Select module"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading modules...
          </SelectItem>
        ) : (
          <>
            {includeAllOption && (
              <SelectItem value="all">All modules</SelectItem>
            )}
            {modules && modules.length > 0 ? (
              modules.map((module) => (
                <SelectItem
                  key={module.id}
                  value={module.id.toString()}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{module.name}</span>
                    {module.status && (
                      <StatusBadge status={module.status} className="ml-2" />
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                No modules found
              </SelectItem>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}