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
import { TestCase, Tag } from "@/types";
import { Edit, Trash, Bug, Eye, ArrowUpDown, Check, ChevronLeft, ChevronRight, Video, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TestCaseTags } from "./test-case-tags";
import { TagFilter } from "./tag-filter";
import { X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestCaseTableProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  onDelete: (testCase: TestCase) => void;
  onView: (testCase: TestCase) => void;
  onReportBug: (testCase: TestCase) => void;
  onDeleteMultiple?: (ids: number[]) => void;
  onStartRecording?: (testCase: TestCase) => void;
  isLoading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  // Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use white text on dark backgrounds, black text on light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function TestCaseTable({ testCases, onEdit, onDelete, onView, onReportBug, onDeleteMultiple }: TestCaseTableProps) {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Default to 25 rows per page

  // Get all unique tags across test cases
  const allTags = useMemo(() => {
    const tagsMap = new Map<string, Tag>();

    testCases.forEach(testCase => {
      const testCaseTags = testCase.tags as Tag[] || [];
      testCaseTags.forEach(tag => {
        if (!tagsMap.has(tag.id)) {
          tagsMap.set(tag.id, tag);
        }
      });
    });

    return Array.from(tagsMap.values());
  }, [testCases]);

  // Filter test cases by selected tags
  const filteredTestCases = useMemo(() => {
    if (selectedTags.length === 0) return testCases;

    return testCases.filter(testCase => {
      const testCaseTags = testCase.tags as Tag[] || [];
      return selectedTags.some(selectedTag => 
        testCaseTags.some(tag => tag.id === selectedTag.id)
      );
    });
  }, [testCases, selectedTags]);

  // Toggle tag selection for filtering
  const toggleTagSelection = (tag: Tag) => {
    setSelectedTags(prev => 
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  // Clear all selected tags
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  // Sort test cases by ID
  const sortedTestCases = [...filteredTestCases].sort((a, b) => {
    // Extract numeric parts for natural sorting
    const aMatch = a.testCaseId.match(/(\d+)$/);
    const bMatch = b.testCaseId.match(/(\d+)$/);

    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[0], 10);
      const bNum = parseInt(bMatch[0], 10);

      // If same module, sort by number
      if (a.testCaseId.split('-')[0] === b.testCaseId.split('-')[0]) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
    }

    // Otherwise sort by full ID string
    return sortDirection === 'asc' 
      ? a.testCaseId.localeCompare(b.testCaseId) 
      : b.testCaseId.localeCompare(a.testCaseId);
  });

  // Handle sort toggle
  const toggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Handle checkbox selection
  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === testCases.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(testCases.map(tc => tc.id));
    }
  };

  // Handle multiple delete
  const handleDeleteSelected = () => {
    if (onDeleteMultiple && selectedItems.length > 0) {
      onDeleteMultiple(selectedItems);
      setSelectedItems([]);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(sortedTestCases.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedTestCases.length);
  const currentItems = sortedTestCases.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    const newRowsPerPage = parseInt(value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handleStartRecording = (testCase: TestCase) => {
    //Implementation for starting recording
    console.log("Start recording for test case:", testCase);
    //Add your recording logic here.  This might involve calling onStartRecording if it's available,
    // or using a different recording mechanism.  This is a placeholder.
  };


  return (
    <div>
      {/* Tag filters */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by tags</span>
          </div>

          {/* TagFilter dropdown component */}
          {testCases.length > 0 ? (
            <TagFilter 
              selectedTags={selectedTags}
              onTagSelect={setSelectedTags}
              projectId={testCases[0]?.projectId}
              className="w-full"
            />
          ) : (
            <div className="text-sm text-muted-foreground p-2 border rounded-md">
              No test cases available to filter.
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span>Showing {filteredTestCases.length} of {testCases.length} test cases</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-9">
          {/* Show selected tags as badges for quick removal */}
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Active filters:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearTagFilters} 
                  className="h-7 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <AnimatePresence>
                  {selectedTags.map((tag) => (
                    <motion.div
                      key={tag.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="inline-flex"
                    >
                      <Badge
                        variant="outline"
                        className="px-2 py-1 h-auto text-xs cursor-pointer transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: tag.color,
                          color: getContrastColor(tag.color),
                          borderColor: 'transparent'
                        }}
                        onClick={() => toggleTagSelection(tag)}
                      >
                        {tag.name}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected items actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteSelected}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={selectedItems.length === testCases.length && testCases.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={toggleSort}>
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <ArrowUpDown className="h-4 w-4" />
                  {sortDirection === 'asc' ? 
                    <span className="text-xs text-gray-400">ASC</span> : 
                    <span className="text-xs text-gray-400">DESC</span>
                  }
                </div>
              </TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Robot</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTestCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center space-y-2"
                  >
                    <p className="text-muted-foreground">No test cases found.</p>
                    {selectedTags.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearTagFilters}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </motion.div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="wait">
                {currentItems.map((testCase, index) => (
                  <motion.tr
                    key={testCase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.03, duration: 0.2 } 
                    }}
                    exit={{ opacity: 0, y: -10 }}
                    className={selectedItems.includes(testCase.id) ? "bg-gray-50 dark:bg-gray-800/50" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedItems.includes(testCase.id)}
                        onCheckedChange={() => toggleItemSelection(testCase.id)}
                        aria-label={`Select ${testCase.testCaseId}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div 
                        className="cursor-pointer hover:text-primary hover:underline"
                        onClick={() => onView?.(testCase)}
                      >
                        {testCase.testCaseId}
                      </div>
                    </TableCell>
                    <TableCell>{testCase.feature}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {testCase.testObjective}
                    </TableCell>
                    <TableCell>
                      <TestCaseTags 
                        tags={(testCase.tags || []).map(tag => ({
                          id: tag.id || `temp-${Math.random()}`,
                          name: tag.name || 'Unknown',
                          color: tag.color || '#cccccc',
                          projectId: tag.projectId || testCase.projectId
                        }))} 
                        limit={2} 
                        size="sm"
                        onClick={toggleTagSelection}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        testCase.status === "Pass" 
                          ? "border-green-200 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700" 
                          : testCase.status === "Fail" 
                          ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700" 
                          : testCase.status === "Blocked"
                          ? "border-orange-200 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-white dark:border-orange-700"
                          : "border-gray-200 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      }>
                        {testCase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        testCase.priority === "High" 
                          ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700" 
                          : testCase.priority === "Medium" 
                          ? "border-yellow-200 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-white dark:border-yellow-700" 
                          : "border-green-200 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700"
                      }>
                        {testCase.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartRecording(testCase)}
                          title="Start Recording"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView && onView(testCase)}
                          title="Play Recording"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
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
                          <DropdownMenuItem onClick={() => onView(testCase)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(testCase)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReportBug(testCase)}>
                            <Bug className="mr-2 h-4 w-4" />
                            <span>Report Bug</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(testCase)}>
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {sortedTestCases.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {sortedTestCases.length} entries
            </p>

            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={handleRowsPerPageChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={rowsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="25" value="25">25</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                  <SelectItem key="100" value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="flex items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="hidden sm:flex"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}