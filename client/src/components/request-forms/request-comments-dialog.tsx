
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, User, Clock, FileText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RequestCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
}

export function RequestCommentsDialog({ 
  open, 
  onOpenChange, 
  request 
}: RequestCommentsDialogProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("General");

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/resource-requests/${request?.id}/comments`],
    queryFn: async () => {
      if (!request?.id) return [];
      const res = await apiRequest("GET", `/api/resource-requests/${request.id}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!request?.id && open,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { comment: string; commentType: string }) => {
      const res = await apiRequest("POST", `/api/resource-requests/${request.id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resource-requests/${request.id}/comments`] });
      setNewComment("");
      setCommentType("General");
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast({
        title: "Missing comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    createCommentMutation.mutate({
      comment: newComment.trim(),
      commentType,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'Status Update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Extension Request': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approval': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejection': return 'bg-red-100 text-red-800 border-red-200';
      case 'General': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'Status Update': return <FileText className="h-4 w-4" />;
      case 'Extension Request': return <Clock className="h-4 w-4" />;
      case 'Approval': return <CheckCircle2 className="h-4 w-4" />;
      case 'Rejection': return <XCircle className="h-4 w-4" />;
      case 'General': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getUserInitials = (userId: number) => {
    // In a real app, you'd fetch user data
    return `U${userId}`;
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request Details & Comments - {request.requestId}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Details */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Request Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Title</Label>
                    <p className="font-semibold">{request.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm">{request.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <Badge variant="outline">{request.requestType}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <Badge variant="secondary">{request.department}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {request.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    <Badge className={
                      request.priority === 'Critical' ? 'bg-red-500 text-white' :
                      request.priority === 'High' ? 'bg-orange-500 text-white' :
                      request.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }>
                      {request.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                    <p className="text-sm">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                  </div>
                  {request.estimatedHours && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estimated Hours</Label>
                      <p className="text-sm">{request.estimatedHours} hours</p>
                    </div>
                  )}
                  {request.skillsRequired && request.skillsRequired.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Skills Required</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.skillsRequired.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {request.technologies && request.technologies.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Technologies</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.technologies.map((tech: string) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comments Section */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Comments List */}
                  <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No comments yet</p>
                        <p className="text-sm text-gray-400">Be the first to add a comment</p>
                      </div>
                    ) : (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(comment.userId)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">User {comment.userId}</span>
                                <Badge className={getCommentTypeColor(comment.commentType)} size="sm">
                                  <div className="flex items-center gap-1">
                                    {getCommentTypeIcon(comment.commentType)}
                                    {comment.commentType}
                                  </div>
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <Label htmlFor="commentType">Comment Type</Label>
                      <Select value={commentType} onValueChange={setCommentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              General
                            </div>
                          </SelectItem>
                          <SelectItem value="Status Update">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Status Update
                            </div>
                          </SelectItem>
                          <SelectItem value="Extension Request">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Extension Request
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="newComment">Add Comment</Label>
                      <Textarea
                        id="newComment"
                        placeholder="Type your comment here..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createCommentMutation.isPending || !newComment.trim()}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {createCommentMutation.isPending ? "Adding..." : "Add Comment"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
