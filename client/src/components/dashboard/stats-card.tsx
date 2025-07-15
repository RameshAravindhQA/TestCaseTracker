import { cn } from "@/lib/utils";
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  FolderKanban,
  CheckSquare,
  BugPlay,
  CheckCircle
} from "lucide-react";
import { EnhancedLottie } from "@/components/ui/enhanced-lottie";

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
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
                {change && (
                  <div 
                    className={cn(
                      "ml-3 flex items-center text-sm font-semibold rounded-full px-2 py-0.5",
                      change.trend === "up" 
                        ? "text-green-600 bg-green-50" 
                        : "text-red-600 bg-red-50"
                    )}
                  >
                    {change.trend === "up" ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span>{change.value}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}