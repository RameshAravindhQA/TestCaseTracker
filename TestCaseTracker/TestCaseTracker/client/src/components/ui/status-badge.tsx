import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: string;
  className?: string;
  animate?: boolean;
}

export function StatusBadge({ status, className, animate = true }: StatusBadgeProps) {
  // Define colors for different statuses with enhanced background colors
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Project and module statuses with more vibrant background colors
    if (statusLower === 'completed') return "border-green-300 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700";
    if (statusLower === 'on hold') return "border-yellow-300 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-white dark:border-yellow-700";
    if (statusLower === 'active') return "border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-white dark:border-blue-700";
    
    // Test case statuses
    if (statusLower === 'pass' || statusLower === 'passed') return "border-green-300 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700";
    if (statusLower === 'fail' || statusLower === 'failed') return "border-red-300 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700";
    if (statusLower === 'blocked') return "border-orange-300 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-white dark:border-orange-700";
    if (statusLower === 'not executed') return "border-gray-300 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    
    // Bug statuses
    if (statusLower === 'open') return "border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-white dark:border-blue-700";
    if (statusLower === 'in progress') return "border-purple-300 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-white dark:border-purple-700";
    if (statusLower === 'resolved') return "border-green-300 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700";
    if (statusLower === 'closed') return "border-gray-300 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    
    // Default
    return "border-gray-300 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600";
  };

  if (!animate) {
    return (
      <Badge 
        variant="outline" 
        className={cn("px-2 py-0.5 text-xs font-medium border", getStatusColor(status), className)}
      >
        {status}
      </Badge>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Badge 
        variant="outline" 
        className={cn("px-2 py-0.5 text-xs font-medium border", getStatusColor(status), className)}
      >
        {status}
      </Badge>
    </motion.div>
  );
}