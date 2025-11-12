import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Send, Reply, Edit, Trash, MessageSquare, AtSign } from 'lucide-react';
import { format } from 'date-fns';

interface RequestCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
}

export function RequestCommentsDialog({ open, onOpenChange, request }: RequestCommentsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/request-forms/${request?.id}/comments`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/request-forms/${request.id}/comments`);
      return res.json();
    },
    enabled: open && !!request?.id,
  });

  // Fetch employees for tagging
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/employees');
      return res.json();
    },
    enabled: open,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; taggedUsers?: string[] }) => {
      const res = await apiRequest('POST', `/api/request-forms/${request.id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/request-forms/${request?.id}/comments`] });
      setNewComment('');
      setReplyTo(null);
      toast({ title: 'Comment added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await apiRequest('PUT', `/api/request-forms/comments/${id}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/request-forms/${request?.id}/comments`] });
      setEditingComment(null);
      setEditText('');
      toast({ title: 'Comment updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update comment', variant: 'destructive' });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/request-forms/comments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/request-forms/${request?.id}/comments`] });
      toast({ title: 'Comment deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    },
  });

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(text);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const words = text.substring(0, cursorPos).split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1));
      setShowUserSuggestions(true);
    } else {
      setShowUserSuggestions(false);
    }
  };

  const insertMention = (employee: any) => {
    const beforeCursor = newComment.substring(0, cursorPosition);
    const afterCursor = newComment.substring(cursorPosition);
    const words = beforeCursor.split(' ');
    words[words.length - 1] = `@${employee.firstName} ${employee.lastName}`;
    const newText = words.join(' ') + afterCursor;
    
    setNewComment(newText);
    setShowUserSuggestions(false);
    setMentionQuery('');
  };

  const extractTaggedUsers = (text: string) => {
    const mentions = text.match(/@(\w+\s+\w+)/g) || [];
    return mentions.map(mention => {
      const name = mention.substring(1);
      const employee = employees.find((emp: any) => 
        `${emp.firstName} ${emp.lastName}` === name
      );
      return employee?.id;
    }).filter(Boolean);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const taggedUsers = extractTaggedUsers(newComment);
    addCommentMutation.mutate({
      content: newComment,
      taggedUsers,
    });
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const handleUpdateComment = () => {
    if (!editText.trim()) return;
    updateCommentMutation.mutate({
      id: editingComment!,
      content: editText,
    });
  };

  const filteredEmployees = employees.filter((emp: any) =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy at h:mm a');
  };

  const renderCommentContent = (content: string) => {
    // Replace @mentions with badges
    return content.split(/(@\w+\s+\w+)/g).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Badge key={index} variant="secondary" className="mx-1">
            {part}
          </Badge>
        );
      }
      return part;
    });
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments for {request.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{request.title}</h3>
                <Badge variant="outline">{request.requestId}</Badge>
              </div>
              <p className="text-sm text-gray-600">{request.description}</p>
            </CardHeader>
          </Card>

          <Separator />

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment: any) => (
                <Card key={comment.id} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.profilePicture} />
                        <AvatarFallback>
                          {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateComment}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingComment(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            {renderCommentContent(comment.content)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditComment(comment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Separator />

          {/* Add Comment */}
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Add a comment... Use @name to mention someone"
                value={newComment}
                onChange={handleTextareaChange}
                rows={3}
                className="pr-12"
              />
              
              {/* User Suggestions */}
              {showUserSuggestions && filteredEmployees.length > 0 && (
                <Card className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto">
                  <CardContent className="p-2">
                    {filteredEmployees.map((employee: any) => (
                      <Button
                        key={employee.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-2"
                        onClick={() => insertMention(employee)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={employee.profilePicture} />
                          <AvatarFallback>
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{employee.firstName} {employee.lastName}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <AtSign className="h-4 w-4 inline mr-1" />
                Use @name to mention team members
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {addCommentMutation.isPending ? 'Sending...' : 'Send Comment'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}