import { cn } from "@/lib/utils";
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  FolderKanban,
  CheckSquare,
  BugPlay,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react"; // Imported memo for optimization

// Assuming Card and CardContent are defined elsewhere, and StatsCardProps is correctly defined
// import { Card, CardContent } from "@/components/ui/card"; // Example import

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: "up" | "down";
  };
  icon: "projects" | "testCases" | "bugs" | "passRate";
  className?: string;
  // Assuming 'icon' in the new snippet is a component, not a string key
  // If the new snippet is meant to replace the *entire* component logic,
  // the original icon and color mapping would need to be adapted.
  // For now, I'm preserving the original structure as much as possible
  // and applying memoization to the existing component.
  // If the intention was to completely change the component's structure based on the 'changes' snippet,
  // please clarify, as it seems to introduce a different component signature.
}

// Applying memo to the original StatsCard component
export const StatsCard = memo(function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
  const iconMap = {
    projects: <FolderKanban className="h-6 w-6 text-primary-600" />,
    testCases: <CheckSquare className="h-6 w-6 text-indigo-600" />,
    bugs: <BugPlay className="h-6 w-6 text-red-600" />,
    passRate: <CheckCircle className="h-6 w-6 text-green-600" />,
  };

  const bgColorMap = {
    projects: "bg-primary-100",
    testCases: "bg-indigo-100",
    bugs: "bg-red-100",
    passRate: "bg-green-100",
  };

  // The provided 'changes' snippet seems to describe a different component structure
  // (e.g., passing icon component and color as props directly).
  // Since the primary goal is optimization and the user asked to "speed up the system",
  // memoizing the *existing* component is the most direct way to address performance
  // without fundamentally altering the component's functionality based on a potentially
  // mismatched "changes" snippet.

  // If the intention was to replace the entire component with the one described in <changes>,
  // the following would be the implementation, but it's a significant departure.
  // For now, adhering to "optimize stats card rendering with memoization" on the original.

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <div className={cn(
        "bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg", 
        className
      )}>
        <div className="px-6 py-6">
          <div className="flex items-center">
            <div className={cn(
              "flex-shrink-0 rounded-xl p-4", 
              bgColorMap[icon]
            )}>
              {iconMap[icon]}
            </div>
            <div className="ml-6 w-0 flex-1">
              <dl>
                <dt className="text-base font-medium text-gray-500 dark:text-gray-300 truncate mb-1">{title}</dt>
                <dd className="flex items-baseline">
                  <motion.div 
                    className="text-3xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {value}
                  </motion.div>
                  {change && (
                    <motion.div 
                      className={cn(
                        "ml-3 flex items-center text-sm font-semibold rounded-full px-2 py-0.5",
                        change.trend === "up" 
                          ? "text-green-600 bg-green-50" 
                          : "text-red-600 bg-red-50"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      {change.trend === "up" ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      <span>{change.value}</span>
                    </motion.div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
         {/* Animated background gradient */}
         <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
});