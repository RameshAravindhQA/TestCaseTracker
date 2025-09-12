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

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: "up" | "down";
  };
  icon: "projects" | "testCases" | "bugs" | "passRate";
  className?: string;
}

export function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
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
}