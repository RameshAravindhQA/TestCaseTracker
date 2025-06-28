import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bug, User } from "@/types";
import { format } from "date-fns";
import { Edit, Trash, Eye, Paperclip, ClipboardCopy, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TagFilter } from "@/components/test-cases/tag-filter";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GitHubIssueButton } from "@/components/github/github-issue-button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface BugTableProps {
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
  onDelete: (bug: Bug) => void;
  onView: (bug: Bug) => void;
}

interface StatusDropdownProps {
  currentStatus: string;
  statusOptions: string[];
  onStatusChange: (status: string) => void;
}

function StatusDropdown({ currentStatus, statusOptions, onStatusChange }: StatusDropdownProps) {
  return (
    <Select onValueChange={onStatusChange} defaultValue={currentStatus}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={currentStatus} />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BugTable({ bugs, onEdit, onDelete, onView }: BugTableProps) {
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Get all project IDs from the bugs
  const projectIds = [...new Set(bugs.map(bug => bug.projectId))];
  // Use the first project ID if available
  const projectId = projectIds.length > 0 ? projectIds[0] : undefined;

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Filter bugs by selected tags
  const filteredBugs = selectedTags.length > 0
    ? bugs.filter(bug => {
        const bugTags = bug.tags || [];
        return selectedTags.some(selectedTag => 
          bugTags.some(tag => tag.id === selectedTag.id)
        );
      })
    : bugs;

  // Format a bug report for GitHub issue description
  const formatBugForGitHub = (bug: Bug): string => {
    const formatDate = (date: string | Date) => {
      return new Date(date).toISOString().split('T')[0];
    };

    // Format tags for GitHub
    const formatTags = (tags?: any[]) => {
      if (!tags || tags.length === 0) return 'None';
      return tags.map(tag => `\`${tag.name}\``).join(', ');
    };

    return `**Bug ID:** ${bug.bugId}
**Title:** ${bug.title}
**Status:** ${bug.status}
**Severity:** ${bug.severity}
**Priority:** ${bug.priority}
**Tags:** ${formatTags(bug.tags)}
**Reported Date:** ${formatDate(bug.dateReported)}

**Steps to Reproduce:**
${bug.stepsToReproduce || 'No steps provided.'}

**Expected Result:**
${bug.expectedResult || 'No expected result provided.'}

**Actual Result:**
${bug.actualResult || 'No actual result provided.'}

**Environment:**
${bug.environment || 'No environment information provided.'}

**Pre-Conditions:**
${bug.preConditions || 'No pre-conditions provided.'}

**Comments:**
${bug.comments || 'No comments provided.'}
`;
  };

  // Copy the formatted bug to clipboard
  const copyToClipboard = (bug: Bug) => {
    const formattedBug = formatBugForGitHub(bug);
    navigator.clipboard.writeText(formattedBug)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Bug details have been copied in GitHub issue format",
        });
      })
      .catch((error) => {
        console.error('Failed to copy bug details:', error);
        toast({
          title: "Copy failed",
          description: "Failed to copy bug details to clipboard",
          variant: "destructive",
        });
      });
  };

  return (
    <div>
      {/* Tag filtering section */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowTagFilter(!showTagFilter)}
          className="mb-2 flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          {showTagFilter ? 'Hide Tag Filter' : 'Filter by Tags'}
        </Button>

        {showTagFilter && projectId && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border mb-4">
            <TagFilter
              selectedTags={selectedTags}
              onTagSelect={setSelectedTags}
              projectId={projectId}
            />

            {selectedTags.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Showing {filteredBugs.length} of {bugs.length} bugs
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="max-h-96 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported By</TableHead>
                    <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBugs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center space-y-2"
                    >
                      <p className="text-muted-foreground">No bugs found.</p>
                      {selectedTags.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedTags([])}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell className="font-medium">
                      <div 
                        className="cursor-pointer hover:text-primary hover:underline"
                        onClick={() => onView(bug)}
                      >
                        {bug.bugId}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        {bug.title}
                        {bug.attachments && bug.attachments.length > 0 && (
                          <Paperclip className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AnimatePresence>
                        {bug.tags && bug.tags.length > 0 ? (
                          <TestCaseTags 
                            tags={bug.tags.map(tag => ({
                              id: tag.id || `temp-${Math.random()}`,
                              name: tag.name || 'Unknown',
                              color: tag.color || '#cccccc',
                              projectId: tag.projectId || bug.projectId
                            }))}
                            limit={3}
                            size="sm"
                          />
                        ) : (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-gray-500 italic"
                          >
                            No tags
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        bug.severity === "Critical" 
                          ? "destructive" 
                          : bug.severity === "Major" 
                          ? "default" 
                          : bug.severity === "Minor"
                          ? "secondary"
                          : "outline"
                      } className="dark:text-white">
                        {bug.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        bug.priority === "High" 
                          ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700" 
                          : bug.priority === "Medium" 
                          ? "border-yellow-200 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-white dark:border-yellow-700" 
                          : bug.priority === "Low"
                          ? "border-green-200 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700"
                          : "border-gray-200 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      }>
                        {bug.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/*<StatusDropdown
                        currentStatus={bug.status}
                        statusOptions={["Open", "In Progress", "Resolved", "Closed", "Rejected"]}
                        onStatusChange={(newStatus) => {
                          // Handle status update here
                          const updatedBug = { ...bug, status: newStatus };
                          // You can add mutation here to update the backend
                          console.log('Updating bug status:', bug.id, 'to', newStatus);
                        }}
                      />*/}
                      <Input
                        value={bug.status}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            const updatedBug = { ...bug, status: newStatus };
                            console.log('Updating bug status:', bug.id, 'to', newStatus);
                        }}
                        className="w-full"
                        placeholder="Enter status"
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const reportedByUser = users?.find(u => u.id === bug.reportedById);
                        if (!reportedByUser || !users) return <span className="text-gray-400">Unknown</span>;

                        const getInitials = (name: string) => {
                          const parts = name.trim().split(' ');
                          if (parts.length >= 2) {
                            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                          }
                          return name.substring(0, 2).toUpperCase();
                        };

                        return (
                          <div 
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium cursor-pointer hover:scale-110 transition-transform"
                            title={reportedByUser.name || `${reportedByUser.firstName} ${reportedByUser.lastName}`.trim()}
                          >
                            {getInitials(reportedByUser.name || `${reportedByUser.firstName} ${reportedByUser.lastName}`.trim())}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {bug.dateReported ? format(new Date(bug.dateReported), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(bug)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(bug)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(bug)}>
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            <span>Make a Copy</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(bug)}>
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}