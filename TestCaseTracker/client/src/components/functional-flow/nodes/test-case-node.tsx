
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Play, MoreVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface TestCaseNodeData {
  label: string;
  description?: string;
  testCaseId?: number | string;
  feature?: string;
  priority?: string;
  status?: string;
  preConditions?: string;
  testSteps?: string;
  expectedResult?: string;
  isTestCase?: boolean;
  isCenter?: boolean;
  isFeature?: boolean;
  testCases?: any[];
}

export function TestCaseNode({ data, selected }: NodeProps<TestCaseNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'passed':
        return 'bg-green-500';
      case 'fail':
      case 'failed':
        return 'bg-red-500';
      case 'not executed':
      case 'pending':
        return 'bg-gray-500';
      case 'blocked':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = () => {
    setViewDialogOpen(true);
  };

  const handleEdit = () => {
    if (data.testCaseId) {
      // Navigate to test cases page and open edit form
      navigate(`/test-cases?edit=${data.testCaseId}`);
    }
  };

  const handleExecute = () => {
    if (data.testCaseId) {
      // Navigate to test cases page and execute the test
      navigate(`/test-cases?execute=${data.testCaseId}`);
    }
  };

  if (data.isTestCase) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Handle type="target" position={Position.Left} className="w-3 h-3" />
        
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg min-w-[120px] p-3">
          <div className="text-xs font-medium text-gray-900 text-center">
            {data.label}
          </div>
          {data.status && (
            <div className="mt-1 flex justify-center">
              <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(data.status)} text-white`}>
                {data.status}
              </Badge>
            </div>
          )}
        </div>

        {isHovered && data.testCaseId && (
          <div className="absolute top-0 right-0 z-50 transform translate-x-full ml-2">
            <Card className="w-80 shadow-xl border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-blue-600">
                    Test Case Details
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="h-6 w-6 p-0"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Test Objective:</span>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {data.description || 'No description provided'}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="font-medium text-gray-700">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0.5">
                        {data.feature || 'General'}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0.5">
                        {data.status || 'Not Executed'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <div className="mt-1">
                      <Badge className={`text-xs px-2 py-0.5 ${getPriorityColor(data.priority || 'Medium')}`}>
                        {data.priority || 'Medium'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className="mt-1">
                    <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(data.status || 'Not Executed')} text-white`}>
                      {data.status || 'Not Executed'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Pre-Conditions:</span>
                  <p className="text-gray-600 text-xs mt-1">
                    {data.preConditions || 'None specified'}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Test Steps:</span>
                  <div className="text-gray-600 text-xs mt-1 max-h-16 overflow-y-auto">
                    {data.testSteps ? (
                      <ol className="list-decimal list-inside space-y-0.5">
                        {data.testSteps.split('\n').map((step, index) => (
                          <li key={index} className="text-xs">{step.replace(/^\d+\.\s*/, '')}</li>
                        ))}
                      </ol>
                    ) : (
                      'No steps defined'
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Expected Result:</span>
                  <p className="text-gray-600 text-xs mt-1">
                    {data.expectedResult || 'Not specified'}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Actual Result:</span>
                  <p className="text-gray-600 text-xs mt-1 italic">
                    Not executed
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Comments:</span>
                  <p className="text-gray-600 text-xs mt-1 italic">
                    Generated by AI testing team template.
                  </p>
                </div>

                <div className="flex gap-1 mt-3 pt-2 border-t">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs h-7" 
                    variant="outline"
                    onClick={handleView}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs h-7" 
                    variant="outline"
                    onClick={handleEdit}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs h-7" 
                    variant="default"
                    onClick={handleExecute}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Handle type="source" position={Position.Right} className="w-3 h-3" />
      </div>
    );
  }

  // Center node
  if (data.isCenter) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-xl flex items-center justify-center min-w-[120px] min-h-[120px] border-4 border-purple-500">
        <Handle type="source" position={Position.Right} className="w-4 h-4 bg-purple-400 border-purple-300" />
        <div className="text-center">
          <div className="font-bold text-sm">{data.label}</div>
          <div className="text-xs opacity-90">{data.description}</div>
        </div>
      </div>
    );
  }

  // Feature/Module node
  if (data.isFeature) {
    return (
      <>
        <div className="relative">
          <Handle type="target" position={Position.Left} className="w-4 h-4 bg-green-400 border-green-300" />
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-green-400">
            <div className="text-center">
              <div className="font-semibold text-sm">{data.label}</div>
              <div className="text-xs opacity-90 mt-1">{data.description}</div>
            </div>
          </div>

          <Handle type="source" position={Position.Right} className="w-4 h-4 bg-green-400 border-green-300" />
        </div>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Test Case Details - {data.label}</DialogTitle>
              <DialogDescription>
                View complete test case information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Test Case ID</h3>
                <p className="text-sm text-gray-700 mt-1">{data.testCaseId || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Feature</h3>
                <p className="text-sm text-gray-700 mt-1">{data.feature || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-gray-700 mt-1">{data.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <Badge className={`text-xs px-2 py-0.5 ${getPriorityColor(data.priority || 'Medium')}`}>
                    {data.priority || 'Medium'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(data.status || 'Not Executed')} text-white`}>
                    {data.status || 'Not Executed'}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Pre-Conditions</h3>
                <p className="text-sm text-gray-700 mt-1">{data.preConditions || 'None specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Test Steps</h3>
                <div className="text-sm text-gray-700 mt-1">
                  {data.testSteps ? (
                    <ol className="list-decimal list-inside space-y-1">
                      {data.testSteps.split('\n').map((step, index) => (
                        <li key={index}>{step.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  ) : (
                    'No steps defined'
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Expected Result</h3>
                <p className="text-sm text-gray-700 mt-1">{data.expectedResult || 'Not specified'}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => { setViewDialogOpen(false); handleEdit(); }}>
                  Edit Test Case
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default node
  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg p-3 min-w-[100px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="text-xs font-medium text-center">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}
