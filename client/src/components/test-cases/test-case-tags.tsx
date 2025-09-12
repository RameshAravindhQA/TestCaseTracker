import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";

interface TestCaseTagsProps {
  tags: Tag[];
  onClick?: (tag: Tag) => void;
  className?: string;
  animate?: boolean;
  limit?: number;
  size?: "sm" | "md" | "lg";
}

export function TestCaseTags({ 
  tags, 
  onClick, 
  className = "", 
  animate = true,
  limit,
  size = "md"
}: TestCaseTagsProps) {
  if (!tags || tags.length === 0) {
    return (
      <span className="text-xs text-gray-500 italic">
        No tags
      </span>
    );
  }
  
  // Normalize and filter out completely invalid tags
  const validTags = tags
    .filter(tag => tag && (tag.id || tag.name)) // Keep tags that have at least id or name
    .map(tag => ({
      ...tag,
      id: tag.id || `temp-${Math.random()}`,
      name: tag.name || 'Unknown',
      color: tag.color || '#cccccc'
    }));
  
  // If no valid tags after filtering, return null or a placeholder
  if (validTags.length === 0) {
    return null;
  }

  const TagComponent = animate ? motion.div : "div";
  const displayTags = limit ? validTags.slice(0, limit) : validTags;
  const hasMoreTags = limit && validTags.length > limit;
  
  // Determine size styles
  const sizeStyles = {
    sm: "px-1.5 py-0 h-5 text-[10px] font-medium",
    md: "px-2 py-0.5 h-auto text-xs font-medium",
    lg: "px-2.5 py-1 h-auto text-sm font-medium"
  };
  
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag) => (
        <TagComponent
          key={tag.id}
          initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={animate ? { type: "spring", stiffness: 500, damping: 30 } : undefined}
          className="inline-flex"
        >
          <Badge
            variant="outline"
            className={`${sizeStyles[size]} font-normal ${onClick ? 'cursor-pointer' : 'cursor-default'} transition-all ${onClick ? 'hover:scale-105 hover:shadow-sm' : ''}`}
            style={{ 
              backgroundColor: tag.color,
              color: getContrastColor(tag.color),
              borderColor: 'transparent'
            }}
            onClick={onClick ? () => onClick(tag) : undefined}
          >
            {tag.name}
          </Badge>
        </TagComponent>
      ))}
      
      {hasMoreTags && (
        <Badge 
          variant="outline" 
          className={`${sizeStyles[size]} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-normal cursor-default`}
        >
          +{validTags.length - limit} more
        </Badge>
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
  // Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Use white text on dark backgrounds, black text on light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}