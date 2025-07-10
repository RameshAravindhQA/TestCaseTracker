import { useState, useTransition } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bug, User } from "@/types";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BugForm } from "@/components/bugs/bug-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function BugViewPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { 
    data: bug, 
    isLoading: isBugLoading,
    error: bugError,
    refetch: refetchBug
  } = useQuery({
    queryKey: ["bug", id],
    queryFn: () => apiRequest<Bug>(`/api/bugs/${id}`),
    enabled: !!id
  });

  const { 
    data: users = [],
    isLoading: isUsersLoading
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<User[]>("/api/users"),
  });

  if (isBugLoading || isUsersLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading bug details...</p>
        </div>
      </MainLayout>
    );
  }

  if (bugError || !bug) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg text-red-500 mb-4">Error loading bug details</p>
          <Button onClick={() => navigate("/bugs")}>Back to Bugs</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Try to get the referrer info from sessionStorage
              const referrer = sessionStorage.getItem('bugReferrer');

              startTransition(() => {
                if (referrer && referrer.startsWith('/projects/')) {
                  // If coming from a project page, go back to that project's bugs tab
                  navigate(`${referrer}?tab=bugs`);
                } else {
                  // Default to the bugs list
                  navigate("/bugs");
                }
              });
            }}
            disabled={isPending}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isPending ? "Loading..." : "Back"}
          </Button>

          <Button 
            onClick={() => startTransition(() => setEditDialogOpen(true))}
            disabled={isPending}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isPending ? "Loading..." : "Edit Bug"}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{bug.title}</h2>
                <p className="text-sm text-gray-500">ID: {bug.bugId}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={
                  bug.severity === "Critical" ? "destructive" :
                  bug.severity === "Major" ? "default" :
                  bug.severity === "Minor" ? "secondary" : "outline"
                }>
                  {bug.severity}
                </Badge>
                <Badge variant={
                  bug.priority === "High" ? "destructive" :
                  bug.priority === "Medium" ? "default" : "secondary"
                }>
                  {bug.priority}
                </Badge>
                <Badge variant={
                  bug.status === "Open" ? "destructive" :
                  bug.status === "In Progress" ? "default" :
                  bug.status === "Resolved" ? "secondary" : "outline"
                }>
                  {bug.status}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 pt-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-gray-700">{bug.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Steps to Reproduce</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-md">
                  {bug.stepsToReproduce}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Expected Result</h3>
                <p className="text-sm text-gray-700">{bug.expectedResult}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Actual Result</h3>
                <p className="text-sm text-gray-700">{bug.actualResult}</p>
              </div>

              {bug.environment && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Environment</h3>
                  <p className="text-sm text-gray-700">{bug.environment}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Assigned To</h3>
                  <p className="text-sm text-gray-700">
                    {users.find(u => u.id === bug.assignedTo)?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Reported By</h3>
                  <p className="text-sm text-gray-700">
                    {users.find(u => u.id === bug.reportedBy)?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bug</DialogTitle>
              <DialogDescription>
                Update the bug details and click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <BugForm 
              bug={bug}
              projectId={bug.projectId}
              onSuccess={() => {
                setEditDialogOpen(false);
                refetchBug();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}