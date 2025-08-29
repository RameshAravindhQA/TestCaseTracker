
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TestTube, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface TestCaseNodeData {
  label: string;
  description?: string;
  linkedItemId?: number;
  linkedItemType?: string;
  category?: string;
  status?: string;
  priority?: string;
}

export function TestCaseNode({ data }: NodeProps<TestCaseNodeData>) {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'Pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Blocked':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'Pass':
        return 'border-green-500 bg-green-50';
      case 'Fail':
        return 'border-red-500 bg-red-50';
      case 'Blocked':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-md border-2 min-w-[150px] ${getStatusColor()}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <TestTube className="h-4 w-4 text-blue-600" />
        {getStatusIcon()}
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {data.label}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}
      
      {data.priority && (
        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
          data.priority === 'High' ? 'bg-red-100 text-red-800' :
          data.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {data.priority}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
