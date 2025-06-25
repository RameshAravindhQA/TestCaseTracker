
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BugComment } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { MessageCircle, Edit2, Save, X, Plus } from "lucide-react";

interface BugCommentsProps {
  bugId: number;
}

export function BugComments({ bugId }: BugCommentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<BugComment[]>({
    queryKey: [`/api/bugs/${bugId}/comments`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bugs/${bugId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/bugs/${bugId}/comments`, {
        content: content.trim(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create comment: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/bugs/${bugId}/comments/${commentId}`, {
        content: content.trim(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update comment: ${errorText}`);
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  const handleCreateComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const handleEditComment = (comment: BugComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = (commentId: number) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editContent });
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        <div className="text-center py-4 text-gray-500">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <Badge variant="secondary">{comments.length}</Badge>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.name || 'User'}`} />
                      <AvatarFallback>
                        {comment.author?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{comment.author?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">
                        {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                          <span className="ml-2">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditComment(comment)}
                    disabled={editingComment === comment.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Update your comment..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={updateCommentMutation.isPending || !editContent.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCommentMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add New Comment */}
      <Card>
        <CardHeader>
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add a comment
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px]"
          />
          <Button
            onClick={handleCreateComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {createCommentMutation.isPending ? "Adding comment..." : "Add Comment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
