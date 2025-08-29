
import React from 'react';
import { Handle, Position } from 'reactflow';

interface TestCaseNodeData {
  label: string;
  description?: string;
  testCaseId?: number;
  priority?: string;
  status?: string;
}

interface TestCaseNodeProps {
  data: TestCaseNodeData;
  isConnectable: boolean;
}

export function TestCaseNode({ data, isConnectable }: TestCaseNodeProps) {
  return (
    <div className="test-case-node bg-blue-50 border-2 border-blue-300 rounded-lg p-3 min-w-[200px] shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
      
      <div className="test-case-content">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-800 text-sm">{data.label}</h4>
          {data.testCaseId && (
            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
              TC-{data.testCaseId}
            </span>
          )}
        </div>
        
        {data.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {data.description}
          </p>
        )}
        
        <div className="flex gap-2 text-xs">
          {data.priority && (
            <span className={`px-2 py-1 rounded ${
              data.priority === 'High' ? 'bg-red-100 text-red-700' :
              data.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {data.priority}
            </span>
          )}
          
          {data.status && (
            <span className={`px-2 py-1 rounded ${
              data.status === 'Pass' ? 'bg-green-100 text-green-700' :
              data.status === 'Fail' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {data.status}
            </span>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
    </div>
  );
}
