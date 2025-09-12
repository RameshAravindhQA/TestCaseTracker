import { Activity, FormattedActivity } from "@/types";
import { formatDistance } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  Edit, 
  Trash,
  FilePlus,
  FileEdit,
  UserPlus,
  UserMinus,
  Bug
} from "lucide-react";

interface RecentActivityProps {
  activities: FormattedActivity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const iconMap: Record<string, JSX.Element> = {
    created: <PlusCircle className="h-4 w-4" />,
    updated: <Edit className="h-4 w-4" />,
    deleted: <Trash className="h-4 w-4" />,
    added: <UserPlus className="h-4 w-4" />,
    removed: <UserMinus className="h-4 w-4" />,
    reported: <Bug className="h-4 w-4" />,
    "marked as Open": <AlertCircle className="h-4 w-4" />,
    "marked as In Progress": <AlertCircle className="h-4 w-4" />,
    "marked as Resolved": <CheckCircle className="h-4 w-4" />,
    "marked as Closed": <CheckCircle className="h-4 w-4" />,
    pass: <CheckCircle className="h-4 w-4" />,
    fail: <XCircle className="h-4 w-4" />,
  };

  const getIcon = (activity: FormattedActivity) => {
    // Try to find a direct match first
    if (iconMap[activity.action]) {
      return iconMap[activity.action];
    }
    
    // Try partial matches
    const action = Object.keys(iconMap).find(key => activity.action.includes(key));
    if (action && iconMap[action]) {
      return iconMap[action];
    }
    
    // Default fallback
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.iconColor}`}
            >
              {getIcon(activity)}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: activity.formattedMessage }} />
            <p className="mt-1 text-xs text-gray-500">{activity.timeAgo}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
