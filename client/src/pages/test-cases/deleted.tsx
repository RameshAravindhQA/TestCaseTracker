
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TestCase } from "@/types";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { DeletedTestCaseTable } from "@/components/test-cases/deleted-test-case-table";
import { ProjectSelect } from "@/components/ui/project-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function apiRequest(method: string, url: string, data?: any) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

export default function DeletedTestCasesPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    },
  });

  // Fetch deleted test cases for selected project
  const { data: deletedTestCases = [], isLoading: isDeletedTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${selectedProjectId}/deleted-test-cases`],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${selectedProjectId}/deleted-test-cases`);
      return res.json();
    },
  });

  // Restore test case mutation
  const restoreTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("POST", `/api/test-cases/${testCaseId}/restore`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test case restored",
        description: `Test case ${data.testCaseId} has been restored successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/deleted-test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to restore test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("DELETE", `/api/test-cases/${testCaseId}/permanent`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test case permanently deleted",
        description: "Test case has been permanently removed from the system",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/deleted-test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to permanently delete test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleRestore = (testCase: TestCase) => {
    restoreTestCaseMutation.mutate(testCase.id);
  };

  const handlePermanentDelete = (testCase: TestCase) => {
    permanentDeleteMutation.mutate(testCase.id);
  };

  const handleView = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setViewDialogOpen(true);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pass":
        return "bg-green-100 text-green-800 border-green-200";
      case "Fail":
        return "bg-red-100 text-red-800 border-red-200";
      case "Blocked":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Not Executed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deleted Test Cases</h1>
            <p className="text-muted-foreground">
              View and restore deleted test cases from your projects
            </p>
          </div>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose a project to view its deleted test cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm">
            <ProjectSelect
              projects={projects || []}
              value={selectedProjectId?.toString() || ""}
              onValueChange={(value) => setSelectedProjectId(parseInt(value) || null)}
              placeholder="Select a project..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Deleted Test Cases Table */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Deleted Test Cases</span>
                </CardTitle>
                <CardDescription>
                  {deletedTestCases.length} deleted test case(s) found
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ 
                  queryKey: [`/api/projects/${selectedProjectId}/deleted-test-cases`] 
                })}
                disabled={isDeletedTestCasesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isDeletedTestCasesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DeletedTestCaseTable
              deletedTestCases={deletedTestCases}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onView={handleView}
              isLoading={isDeletedTestCasesLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Test Case View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Test Case Details</span>
              <Badge variant="destructive">Deleted</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedTestCase?.testCaseId} - {selectedTestCase?.feature}
            </DialogDescription>
          </DialogHeader>

          {selectedTestCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge 
                    variant="outline" 
                    className={getStatusBadgeColor(selectedTestCase.status)}
                  >
                    {selectedTestCase.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <Badge 
                    variant="outline" 
                    className={getPriorityBadgeColor(selectedTestCase.priority)}
                  >
                    {selectedTestCase.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Test Objective</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedTestCase.testObjective}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Pre-Conditions</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedTestCase.preConditions || "None specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Test Steps</h3>
                <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans border border-gray-200 rounded-md p-3 bg-gray-50">{selectedTestCase.testSteps}</pre>
              </div>

              <div>
                <h3 className="text-sm font-medium">Expected Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedTestCase.expectedResult}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Actual Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedTestCase.actualResult || "Not recorded"}</p>
              </div>

              {selectedTestCase.comments && (
                <div>
                  <h3 className="text-sm font-medium">Comments</h3>
                  <p className="text-sm text-gray-700 mt-1">{selectedTestCase.comments}</p>
                </div>
              )}

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleRestore(selectedTestCase);
                    setViewDialogOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore Test Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
