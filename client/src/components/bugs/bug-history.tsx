import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  User, 
  GitBranch, 
  MessageSquare, 
  AlertTriangle,
  ArrowRight,
  Github,
  Edit,
  UserPlus
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface BugHistoryProps {
  bugId: number;
}

interface BugHistoryEntry {
  id: number;
  bugId: number;
  userId: number;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function BugHistory({ bugId }: BugHistoryProps) {
  const { data: history, isLoading } = useQuery<BugHistoryEntry[]>({
    queryKey: [`/api/bugs/${bugId}/history`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/bugs/${bugId}/history`);
      if (!response.ok) throw new Error('Failed to fetch bug history');
      return response.json();
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <AlertTriangle className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'status_changed':
        return <ArrowRight className="h-4 w-4 text-orange-600" />;
      case 'assigned':
        return <UserPlus className="h-4 w-4 text-indigo-600" />;
      case 'github_synced':
        return <Github className="h-4 w-4 text-gray-800" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'commented':
        return 'bg-purple-100 text-purple-800';
      case 'status_changed':
        return 'bg-orange-100 text-orange-800';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'github_synced':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {history?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No activity recorded yet.
              </p>
            ) : (
              history?.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getActionColor(entry.action)}>
                        {entry.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy at h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                    {entry.user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {entry.user.firstName} {entry.user.lastName}
                      </p>
                    )}
                    {entry.field && entry.oldValue && entry.newValue && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <span className="font-medium">{entry.field}:</span>{' '}
                        <span className="text-red-600">{entry.oldValue}</span>{' '}
                        <ArrowRight className="h-3 w-3 inline mx-1" />{' '}
                        <span className="text-green-600">{entry.newValue}</span>
                      </div>
                    )}
                    {entry.metadata?.githubIssueNumber && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <Github className="h-3 w-3 inline mr-1" />
                        GitHub Issue #{entry.metadata.githubIssueNumber}
                      </div>
                    )}
                  </div>
                  {index < (history?.length || 0) - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}