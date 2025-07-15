import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TestCase } from "@/types";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/utils/sound-effects";

interface TestCaseTableProps {
  projectId?: number;
  onEdit?: (testCase: TestCase) => void;
  showProjectColumn?: boolean;
}

export function TestCaseTable({
  projectId,
  onEdit,
  showProjectColumn = false,
}: TestCaseTableProps) {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ["/api/test-cases", { projectId }],
    queryFn: async () => {
      const url = projectId 
        ? `/api/test-cases?projectId=${projectId}` 
        : "/api/test-cases";
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
  });

  const deleteTestCase = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/test-cases/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete test case");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-cases"] });
      toast({
        title: "Success",
        description: "Test case deleted successfully",
      });
      playSound('success');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive",
      });
      playSound('error');
    },
  });

  const handleDelete = (id: number) => {
    deleteTestCase.mutate(id);
  };

  const filteredTestCases = testCases.filter((testCase: TestCase) =>
    testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testCase.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading test cases...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search test cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTestCases.map((testCase: TestCase) => (
                <TableRow key={testCase.id}>
                  <TableCell>{testCase.id}</TableCell>
                  <TableCell>{testCase.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{testCase.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{testCase.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setSelectedTestCase(testCase)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(testCase)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the test case.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(testCase.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Test Case Dialog */}
      <Dialog open={!!selectedTestCase} onOpenChange={() => setSelectedTestCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTestCase?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-600">{selectedTestCase?.description}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Steps</h4>
              <p className="text-sm text-gray-600">{selectedTestCase?.steps}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Expected Result</h4>
              <p className="text-sm text-gray-600">{selectedTestCase?.expectedResult}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}