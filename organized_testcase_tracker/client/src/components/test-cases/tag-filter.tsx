import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tag } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface TagFilterProps {
  onTagSelect: (selectedTags: Tag[]) => void;
  projectId?: number | string;
  selectedTags: Tag[];
  className?: string;
}

export function TagFilter({
  onTagSelect,
  projectId,
  selectedTags,
  className,
}: TagFilterProps) {
  const [open, setOpen] = useState(false);

  // Fetch all available tags from backend
  const { data: allTags, isLoading, refetch } = useQuery<Tag[]>({
    queryKey: [projectId ? `/api/projects/${projectId}/tags` : `/api/tags`],
    queryFn: () => {
      const endpoint = projectId ? `/api/projects/${projectId}/tags` : `/api/tags`;
      return fetch(endpoint)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tags');
          return res.json();
        });
    },
    enabled: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
  
  // Listen for tag creator events (when new tags are created)
  useEffect(() => {
    const handleTagsUpdated = () => {
      console.log("Tags updated, refetching...");
      refetch();
    };
    
    window.addEventListener('tagsUpdated', handleTagsUpdated);
    
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdated);
    };
  }, [refetch]);

  // Handle tag selection/deselection
  const handleTagSelect = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    
    if (isSelected) {
      // Remove tag if already selected
      onTagSelect(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      // Add tag if not already selected
      onTagSelect([...selectedTags, tag]);
    }
  };

  // Clear all selected tags
  const clearSelectedTags = () => {
    onTagSelect([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
              : "Filter by tags"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {isLoading ? (
                <div className="p-2 text-sm text-center text-muted-foreground">
                  Loading tags...
                </div>
              ) : allTags && allTags.length > 0 ? (
                allTags.map((tag) => {
                  const isSelected = selectedTags.some((t) => t.id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleTagSelect(tag)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          isSelected ? "bg-primary border-primary" : "opacity-50"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </CommandItem>
                  );
                })
              ) : (
                <div className="p-2 text-sm text-center text-muted-foreground">
                  No tags available. Click the button below to create a new tag.
                </div>
              )}
              <div className="border-t p-2">
                {selectedTags.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={clearSelectedTags}
                  >
                    Clear selection
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setOpen(false);
                      // Using setTimeout to avoid React state update conflicts
                      setTimeout(() => {
                        const tagCreateEvent = new CustomEvent('openTagCreator', {
                          detail: { location: 'tagFilter' }
                        });
                        window.dispatchEvent(tagCreateEvent);
                      }, 100);
                    }}
                  >
                    Create new tag
                  </Button>
                )}
              </div>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs font-normal cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: tag.color,
                    color: getContrastColor(tag.color),
                    borderColor: "transparent",
                  }}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag.name}
                  <span className="ml-1">×</span>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Use white text on dark backgrounds, black text on light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}