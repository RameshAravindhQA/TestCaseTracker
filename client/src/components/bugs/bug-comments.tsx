import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Send, Github, ExternalLink, Sync, AlertCircle } from "lucide-react";

interface BugComment {
  id: number;
  bugId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  githubCommentId?: number;
  syncedFromGithub?: boolean;
  syncedToGithub?: boolean;
  githubUrl?: string;
}

interface BugCommentsProps {
  bugId: number;
  githubIssueNumber?: number;
  projectId?: number;
}

export default function BugComments({ bugId, githubIssueNumber, projectId }: BugCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncToGithub, setSyncToGithub] = useState(true);
  const [isSyncingFromGithub, setIsSyncingFromGithub] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<BugComment[]>({
    queryKey: [`/api/bugs/${bugId}/comments`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bugs/${bugId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Add comment mutation with GitHub sync
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/bugs/${bugId}/comments`, {
        content,
        userId: 1, // TODO: Get from auth context
        syncToGithub: syncToGithub && !!githubIssueNumber,
        githubIssueNumber,
        projectId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setNewComment("");
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });

      if (data.syncedToGithub) {
        toast({
          title: "Comment added and synced",
          description: "Your comment has been added and synced to GitHub.",
        });
      } else {
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        });
      }
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Sync from GitHub mutation
  const syncFromGithubMutation = useMutation({
    mutationFn: async () => {
      if (!githubIssueNumber || !projectId) {
        throw new Error("GitHub issue number and project ID required");
      }

      const res = await apiRequest("POST", `/api/bugs/${bugId}/sync-comments-from-github`, {
        githubIssueNumber,
        projectId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsSyncingFromGithub(false);
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bugId}/comments`] });
      toast({
        title: "Comments synced",
        description: `Synced ${data.syncedCount || 0} comments from GitHub.`,
      });
    },
    onError: (error: Error) => {
      setIsSyncingFromGithub(false);
      toast({
        title: "Sync failed",
        description: `Failed to sync from GitHub: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    addCommentMutation.mutate(newComment);
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments?.length || 0})
          </CardTitle>

          {githubIssueNumber && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSyncingFromGithub(true);
                  syncFromGithubMutation.mutate();
                }}
                disabled={isSyncingFromGithub}
              >
                <Sync className={`h-4 w-4 mr-1 ${isSyncingFromGithub ? 'animate-spin' : ''}`} />
                Sync from GitHub
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Github className="h-3 w-3" />
                Issue #{githubIssueNumber}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <p className="text-gray-500">No comments yet.</p>
              </div>
            ) : (
              comments?.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.email} />
                        <AvatarFallback>
                          {comment.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {comment.user?.name || "Unknown User"}
                          {comment.syncedFromGithub && (
                            <Badge variant="secondary" className="text-xs">
                              <Github className="h-3 w-3 mr-1" />
                              From GitHub
                            </Badge>
                          )}
                          {comment.syncedToGithub && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Synced
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          {comment.githubUrl && (
                            <a
                              href={comment.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              View on GitHub
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-11">
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))
            )}

            <div className="space-y-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />

              <div className="flex items-center justify-between">
                {githubIssueNumber && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sync-github"
                      checked={syncToGithub}
                      onCheckedChange={setSyncToGithub}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="sync-github" className="text-sm flex items-center gap-1">
                      <Github className="h-4 w-4" />
                      Sync to GitHub
                    </Label>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}