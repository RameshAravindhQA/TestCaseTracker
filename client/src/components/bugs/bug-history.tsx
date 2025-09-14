
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  User, 
  Tag, 
  MessageSquare, 
  GitBranch, 
  CheckCircle, 
  XCircle,
  Edit,
  UserPlus,
  ExternalLink
} from 'lucide-react';

interface BugHistoryProps {
  bugId: number;
}

interface BugHistoryEntry {
  id: number;
  bugId: number;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  userId: number;
  githubEventId?: string;
  githubUrl?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'updated':
    case 'status_changed':
      return <Edit className="h-4 w-4 text-blue-500" />;
    case 'assigned':
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'commented':
      return <MessageSquare className="h-4 w-4 text-orange-500" />;
    case 'label_changed':
      return <Tag className="h-4 w-4 text-yellow-500" />;
    case 'github_synced':
    case 'github_activity':
      return <GitBranch className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'bg-green-100 text-green-800';
    case 'updated':
    case 'status_changed':
      return 'bg-blue-100 text-blue-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'commented':
      return 'bg-orange-100 text-orange-800';
    case 'label_changed':
      return 'bg-yellow-100 text-yellow-800';
    case 'github_synced':
    case 'github_activity':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function BugHistory({ bugId }: BugHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: [`/api/bugs/${bugId}/history`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/bugs/${bugId}/history`);
      if (!response.ok) throw new Error('Failed to fetch bug history');
      return response.json();
    },
  });

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
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
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
          Activity Timeline ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No activity recorded for this bug yet.
            </p>
          ) : (
            history.map((entry: BugHistoryEntry, index: number) => (
              <div key={entry.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                  {getActionIcon(entry.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={getActionColor(entry.action)}>
                      {entry.action.replace('_', ' ')}
                    </Badge>
                    
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                    
                    {entry.githubUrl && (
                      <a
                        href={entry.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="View on GitHub"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">
                    {entry.description}
                  </p>
                  
                  {entry.user && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>
                        {entry.user.firstName} {entry.user.lastName}
                      </span>
                    </div>
                  )}
                  
                  {entry.field && entry.oldValue && entry.newValue && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">{entry.field}:</span>
                      <span className="text-red-600 line-through mx-1">{entry.oldValue}</span>
                      →
                      <span className="text-green-600 mx-1">{entry.newValue}</span>
                    </div>
                  )}
                </div>
                
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" 
                       style={{ marginLeft: '15px', marginTop: '32px' }} />
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
