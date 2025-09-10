import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TestCase } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RotateCcw, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface DeletedTestCaseTableProps {
  projectId: number;
  onBack: () => void;
}

export function DeletedTestCaseTable({
  projectId,
  onBack
}: DeletedTestCaseTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: deletedTestCases = [], isLoading } = useQuery<TestCase[]>({
    queryKey: ['deleted-test-cases', projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}/deleted-test-cases`);
      if (!response.ok) throw new Error('Failed to fetch deleted test cases');
      return response.json();
    },
  });

  // Restore test case mutation
  const restoreTestCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/test-cases/${id}/restore`);
      if (!response.ok) throw new Error('Failed to restore test case');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      toast({
        title: "Test case restored",
        description: "Test case has been restored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Restore failed",
        description: "Failed to restore test case.",
        variant: "destructive",
      });
    },
  });

  // Hard delete test case mutation
  const hardDeleteTestCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/test-cases/${id}?hardDelete=true`);
      if (!response.ok) throw new Error('Failed to permanently delete test case');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-test-cases'] });
      toast({
        title: "Test case permanently deleted",
        description: "Test case has been permanently removed from the database.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to permanently delete test case.",
        variant: "destructive",
      });
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Project Details</span>
        </Button>
        <h1 className="text-xl font-semibold">Deleted Test Cases</h1>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {(!deletedTestCases || deletedTestCases.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center space-y-2"
                    >
                      <Trash2 className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">No deleted test cases found</p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                deletedTestCases.map((testCase) => (
                  <motion.tr
                    key={testCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {testCase.testCaseId}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={testCase.feature}>
                        {testCase.feature}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={testCase.testObjective}>
                        {testCase.testObjective}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusBadgeColor(testCase.status)}
                      >
                        {testCase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getPriorityBadgeColor(testCase.priority)}
                      >
                        {testCase.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {testCase.deletedAt 
                            ? format(new Date(testCase.deletedAt), "MMM dd, yyyy")
                            : "Unknown"
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreTestCaseMutation.mutate(testCase.id)}
                          disabled={restoreTestCaseMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={hardDeleteTestCaseMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Forever
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Permanently Delete Test Case
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the test case 
                                "{testCase.feature}" and remove all its data from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => hardDeleteTestCaseMutation.mutate(testCase.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </>
  );
}