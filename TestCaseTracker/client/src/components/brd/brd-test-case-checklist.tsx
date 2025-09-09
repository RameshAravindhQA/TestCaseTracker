
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Edit, 
  Save,
  X 
} from "lucide-react";

interface BrdTestCase {
  id: number;
  testCaseId: string;
  title: string;
  description?: string;
  expectedResult?: string;
  status: "Pass" | "Fail" | "Not Executed";
  notes?: string;
  testedById?: number;
  testedAt?: string;
}

interface BrdTestCaseChecklistProps {
  brdId: number;
  testCases: BrdTestCase[];
  onUpdateTestCase: (testCase: BrdTestCase) => void;
  onAddTestCase: (testCase: Omit<BrdTestCase, "id">) => void;
}

export function BrdTestCaseChecklist({
  brdId,
  testCases,
  onUpdateTestCase,
  onAddTestCase
}: BrdTestCaseChecklistProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    title: "",
    description: "",
    expectedResult: "",
    notes: ""
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Pass": "default",
      "Fail": "destructive", 
      "Not Executed": "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const handleStatusChange = (testCase: BrdTestCase, newStatus: "Pass" | "Fail" | "Not Executed") => {
    onUpdateTestCase({
      ...testCase,
      status: newStatus,
      testedAt: new Date().toISOString()
    });
  };

  const handleAddTestCase = () => {
    if (!newTestCase.title.trim()) return;

    const testCaseId = `TC-${String(testCases.length + 1).padStart(3, '0')}`;
    
    onAddTestCase({
      testCaseId,
      ...newTestCase,
      status: "Not Executed"
    });

    setNewTestCase({ title: "", description: "", expectedResult: "", notes: "" });
    setShowAddForm(false);
  };

  // Calculate statistics
  const stats = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === "Pass").length,
    failed: testCases.filter(tc => tc.status === "Fail").length,
    notExecuted: testCases.filter(tc => tc.status === "Not Executed").length
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Test Execution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{passRate}%</div>
              <div className="text-sm text-gray-500">Pass Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Cases</CardTitle>
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Test Case
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Test Case Form */}
            {showAddForm && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="Test case title"
                      value={newTestCase.title}
                      onChange={(e) => setNewTestCase(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newTestCase.description}
                      onChange={(e) => setNewTestCase(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                    />
                    <Textarea
                      placeholder="Expected result"
                      value={newTestCase.expectedResult}
                      onChange={(e) => setNewTestCase(prev => ({
                        ...prev,
                        expectedResult: e.target.value
                      }))}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleAddTestCase}>
                        <Save className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Cases */}
            {testCases.map((testCase) => (
              <Card key={testCase.id} className="border-l-4 border-l-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{testCase.testCaseId}</Badge>
                        {getStatusBadge(testCase.status)}
                      </div>
                      <h4 className="font-medium mb-2">{testCase.title}</h4>
                      {testCase.description && (
                        <p className="text-sm text-gray-600 mb-2">{testCase.description}</p>
                      )}
                      {testCase.expectedResult && (
                        <div className="text-sm">
                          <strong>Expected:</strong> {testCase.expectedResult}
                        </div>
                      )}
                    </div>

                    {/* Status Controls */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(testCase.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(editingId === testCase.id ? null : testCase.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Status Selection */}
                      {editingId === testCase.id && (
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`pass-${testCase.id}`}
                              checked={testCase.status === "Pass"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleStatusChange(testCase, "Pass");
                                }
                              }}
                            />
                            <label 
                              htmlFor={`pass-${testCase.id}`}
                              className="text-sm font-medium text-green-600"
                            >
                              Pass
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`fail-${testCase.id}`}
                              checked={testCase.status === "Fail"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleStatusChange(testCase, "Fail");
                                }
                              }}
                            />
                            <label 
                              htmlFor={`fail-${testCase.id}`}
                              className="text-sm font-medium text-red-600"
                            >
                              Fail
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`not-executed-${testCase.id}`}
                              checked={testCase.status === "Not Executed"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleStatusChange(testCase, "Not Executed");
                                }
                              }}
                            />
                            <label 
                              htmlFor={`not-executed-${testCase.id}`}
                              className="text-sm font-medium text-gray-600"
                            >
                              Not Executed
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {testCase.notes && (
                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-200">
                      <p className="text-sm">{testCase.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {testCases.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-gray-500">
                No test cases defined yet. Click "Add Test Case" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit,
  Trash2
} from "lucide-react";

interface TestCase {
  id: number;
  testCaseId: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Pass" | "Fail" | "Pending";
  testedAt?: string;
  testedBy?: string;
  comments?: string;
}

interface BrdTestCaseChecklistProps {
  brdId: number;
  testCases: TestCase[];
  onUpdateTestCase: (testCase: TestCase) => void;
  onAddTestCase: (testCase: Omit<TestCase, 'id'>) => void;
}

export function BrdTestCaseChecklist({ 
  brdId, 
  testCases, 
  onUpdateTestCase, 
  onAddTestCase 
}: BrdTestCaseChecklistProps) {
  const [isAddingTestCase, setIsAddingTestCase] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    testCaseId: "",
    title: "",
    description: "",
    priority: "Medium" as const,
    status: "Pending" as const
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Pass": "default",
      "Fail": "destructive",
      "Pending": "secondary"
    };
    
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "High": "destructive",
      "Medium": "default",
      "Low": "secondary"
    };
    
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  const handleAddTestCase = () => {
    if (newTestCase.title && newTestCase.testCaseId) {
      onAddTestCase({
        ...newTestCase,
        brdId
      });
      setNewTestCase({
        testCaseId: "",
        title: "",
        description: "",
        priority: "Medium",
        status: "Pending"
      });
      setIsAddingTestCase(false);
    }
  };

  const handleUpdateTestCase = (testCase: TestCase, updates: Partial<TestCase>) => {
    const updatedTestCase = { ...testCase, ...updates };
    onUpdateTestCase(updatedTestCase);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Test Case Checklist</h3>
          <p className="text-sm text-gray-600">
            Track test cases for this BRD document
          </p>
        </div>
        
        <Dialog open={isAddingTestCase} onOpenChange={setIsAddingTestCase}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Test Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Test Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Case ID</label>
                <Input
                  value={newTestCase.testCaseId}
                  onChange={(e) => setNewTestCase({ ...newTestCase, testCaseId: e.target.value })}
                  placeholder="Enter test case ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTestCase.title}
                  onChange={(e) => setNewTestCase({ ...newTestCase, title: e.target.value })}
                  placeholder="Enter test case title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTestCase.description}
                  onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                  placeholder="Enter test case description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTestCase.priority} onValueChange={(value: any) => setNewTestCase({ ...newTestCase, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingTestCase(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTestCase}>
                  Add Test Case
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        {testCases.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases</h3>
                <p className="text-gray-600 mb-4">
                  Add test cases to track validation for this BRD document
                </p>
                <Button onClick={() => setIsAddingTestCase(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Test Case
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          testCases.map((testCase) => (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-600">
                        {testCase.testCaseId}
                      </span>
                      {getPriorityBadge(testCase.priority)}
                    </div>
                    <CardTitle className="text-base">{testCase.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testCase.status)}
                    {getStatusBadge(testCase.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{testCase.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={testCase.status === "Pass" ? "default" : "outline"}
                    onClick={() => handleUpdateTestCase(testCase, { 
                      status: "Pass", 
                      testedAt: new Date().toISOString() 
                    })}
                    className="text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant={testCase.status === "Fail" ? "destructive" : "outline"}
                    onClick={() => handleUpdateTestCase(testCase, { 
                      status: "Fail", 
                      testedAt: new Date().toISOString() 
                    })}
                    className="text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Fail
                  </Button>
                  <Button
                    size="sm"
                    variant={testCase.status === "Pending" ? "default" : "outline"}
                    onClick={() => handleUpdateTestCase(testCase, { status: "Pending" })}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Button>
                </div>

                {testCase.testedAt && (
                  <div className="text-xs text-gray-500">
                    Tested on: {new Date(testCase.testedAt).toLocaleString()}
                    {testCase.testedBy && ` by ${testCase.testedBy}`}
                  </div>
                )}

                {testCase.comments && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <strong>Comments:</strong> {testCase.comments}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {testCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testCases.filter(tc => tc.status === "Pass").length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testCases.filter(tc => tc.status === "Fail").length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {testCases.filter(tc => tc.status === "Pending").length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
