
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash, 
  Github, 
  ExternalLink,
  Reply,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Comment {
  id: number;
  bugId: number;
  content: string;
  authorId: number;
  author: {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  parentId?: number;
  githubCommentId?: string;
  githubUrl?: string;
  reactions?: CommentReaction[];
  isPrivate: boolean;
}

interface CommentReaction {
  id: number;
  commentId: number;
  userId: number;
  type: 'like' | 'dislike' | 'heart' | 'laugh' | 'confused' | 'hooray' | 'rocket' | 'eyes';
  user: {
    id: number;
    name: string;
  };
}

interface BugCommentsProps {
  bugId: number;
  githubIssueNumber?: string;
  githubRepoUrl?: string;
}

export function BugComments({ bugId, githubIssueNumber, githubRepoUrl }: BugCommentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showPrivateComments, setShowPrivateComments] = useState(true);
  const [selectedCommentForSync, setSelectedCommentForSync] = useState<Comment | null>(null);

  // Fetch comments
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/bugs/${bugId}/comments`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bugs/${bugId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch GitHub comments if integrated
  const { data: githubComments } = useQuery({
    queryKey: [`/api/github/issues/${githubIssueNumber}/comments`],
    queryFn: async () => {
      if (!githubIssueNumber || !githubRepoUrl) return [];
      const response = await apiRequest("GET", `/api/github/issues/${githubIssueNumber}/comments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!githubIssueNumber && !!githubRepoUrl,
    refetchInterval: 60000, // Refetch GitHub comments every minute
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      parentId?: number; 
      isPrivate?: boolean;
      syncToGithub?: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/bugs/${bugId}/comments`, {
        content: data.content,
        parentId: data.parentId,
        isPrivate: data.isPrivate || false,
        syncToGithub: data.syncToGithub || false,
        githubIssueNumber: data.syncToGithub ? githubIssueNumber : undefined,
        githubRepoUrl: data.syncToGithub ? githubRepoUrl : undefined,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/bugs/${bugId}/comments/${data.id}`, {
        content: data.content,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      setEditingComment(null);
      setEditContent("");
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update comment: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("DELETE", `/api/bugs/${bugId}/comments/${commentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (data: { commentId: number; type: string }) => {
      const response = await apiRequest("POST", `/api/bugs/${bugId}/comments/${data.commentId}/reactions`, {
        type: data.type,
      });
      
      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
    },
  });

  // Sync comment to GitHub mutation
  const syncToGithubMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("POST", `/api/bugs/${bugId}/comments/${commentId}/sync-github`, {
        githubIssueNumber,
        githubRepoUrl,
      });
      
      if (!response.ok) {
        throw new Error("Failed to sync to GitHub");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      setSelectedCommentForSync(null);
      
      toast({
        title: "Synced to GitHub",
        description: "Comment has been synced to GitHub successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Error",
        description: `Failed to sync to GitHub: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle comment submission
  const handleSubmitComment = (syncToGithub: boolean = false) => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      content: newComment,
      syncToGithub,
    });
  };

  // Handle reply submission
  const handleSubmitReply = (parentId: number, syncToGithub: boolean = false) => {
    if (!replyContent.trim()) return;
    
    createCommentMutation.mutate({
      content: replyContent,
      parentId,
      syncToGithub,
    });
  };

  // Handle edit submission
  const handleSubmitEdit = () => {
    if (!editContent.trim() || !editingComment) return;
    
    updateCommentMutation.mutate({
      id: editingComment,
      content: editContent,
    });
  };

  // Render comment reactions
  const renderReactions = (comment: Comment) => {
    const reactionCounts = comment.reactions?.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const reactionEmojis = {
      like: '👍',
      dislike: '👎',
      heart: '❤️',
      laugh: '😄',
      confused: '😕',
      hooray: '🎉',
      rocket: '🚀',
      eyes: '👀',
    };

    return (
      <div className="flex items-center gap-1 mt-2">
        {Object.entries(reactionCounts).map(([type, count]) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() => addReactionMutation.mutate({ commentId: comment.id, type })}
          >
            {reactionEmojis[type as keyof typeof reactionEmojis]} {count}
          </Button>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <MessageSquare className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Object.entries(reactionEmojis).map(([type, emoji]) => (
              <DropdownMenuItem
                key={type}
                onClick={() => addReactionMutation.mutate({ commentId: comment.id, type })}
              >
                {emoji} {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Render comment
  const renderComment = (comment: Comment, level: number = 0) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const replies = comments?.filter(c => c.parentId === comment.id) || [];

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.profilePicture} />
                  <AvatarFallback>
                    {comment.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author.name}</span>
                    {comment.isPrivate && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {comment.githubUrl && (
                      <a 
                        href={comment.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Github className="h-3 w-3" />
                        GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    {comment.updatedAt !== comment.createdAt && ' (edited)'}
                  </span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setReplyingTo(comment.id)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setEditingComment(comment.id);
                    setEditContent(comment.content);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {githubIssueNumber && !comment.githubUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedCommentForSync(comment)}>
                        <Github className="h-4 w-4 mr-2" />
                        Sync to GitHub
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmitEdit}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                {renderReactions(comment)}
              </>
            )}
            
            {isReplying && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  {githubIssueNumber && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSubmitReply(comment.id, true)}
                    >
                      <Github className="h-4 w-4 mr-1" />
                      Reply & Sync
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Render replies */}
        {replies.map(reply => renderComment(reply, level + 1))}
      </div>
    );
  };

  // Filter comments based on privacy settings
  const filteredComments = comments?.filter(comment => {
    if (!showPrivateComments && comment.isPrivate) return false;
    return !comment.parentId; // Only top-level comments
  }) || [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({filteredComments.length})
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPrivateComments(!showPrivateComments)}
          >
            {showPrivateComments ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showPrivateComments ? 'Hide' : 'Show'} Private
          </Button>
          
          {githubIssueNumber && githubRepoUrl && (
            <a
              href={`${githubRepoUrl}/issues/${githubIssueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Github className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* GitHub Comments Section */}
      {githubComments && githubComments.length > 0 && (
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Comments ({githubComments.length})
          </h4>
          {githubComments.slice(0, 3).map((ghComment: any) => (
            <Card key={ghComment.id} className="mb-2 bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ghComment.user.avatar_url} />
                    <AvatarFallback>{ghComment.user.login[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{ghComment.user.login}</span>
                  <Badge variant="outline" className="text-xs">GitHub</Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(ghComment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {ghComment.body.length > 200 
                    ? `${ghComment.body.substring(0, 200)}...` 
                    : ghComment.body}
                </div>
              </CardContent>
            </Card>
          ))}
          {githubComments.length > 3 && (
            <a
              href={`${githubRepoUrl}/issues/${githubIssueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all {githubComments.length} comments on GitHub →
            </a>
          )}
        </div>
      )}

      {/* New Comment Form */}
      <Card>
        <CardContent className="p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={() => handleSubmitComment()}
              disabled={!newComment.trim() || createCommentMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Comment
            </Button>
            
            {githubIssueNumber && (
              <Button 
                variant="outline"
                onClick={() => handleSubmitComment(true)}
                disabled={!newComment.trim() || createCommentMutation.isPending}
              >
                <Github className="h-4 w-4 mr-2" />
                Comment & Sync
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => createCommentMutation.mutate({ 
                content: newComment, 
                isPrivate: true 
              })}
              disabled={!newComment.trim() || createCommentMutation.isPending}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Private Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map(comment => renderComment(comment))}
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* Sync to GitHub Dialog */}
      <Dialog open={!!selectedCommentForSync} onOpenChange={() => setSelectedCommentForSync(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Comment to GitHub</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              This will post the comment to the GitHub issue: 
              <a 
                href={`${githubRepoUrl}/issues/${githubIssueNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                #{githubIssueNumber}
              </a>
            </p>
            
            {selectedCommentForSync && (
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedCommentForSync.content}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => selectedCommentForSync && syncToGithubMutation.mutate(selectedCommentForSync.id)}
                disabled={syncToGithubMutation.isPending}
              >
                <Github className="h-4 w-4 mr-2" />
                {syncToGithubMutation.isPending ? 'Syncing...' : 'Sync to GitHub'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedCommentForSync(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
