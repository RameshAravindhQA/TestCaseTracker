
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

interface TestCaseNodeData {
  label: string;
  description?: string;
  testCaseId?: number;
  feature?: string;
  priority?: string;
  status?: string;
  preConditions?: string;
  testSteps?: string;
  expectedResult?: string;
  isCenter?: boolean;
  isFeature?: boolean;
  isTestCase?: boolean;
  testCases?: any[];
}

interface TestCaseNodeProps {
  data: TestCaseNodeData;
  isConnectable: boolean;
}

export function TestCaseNode({ data, isConnectable }: TestCaseNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass':
        return '✅';
      case 'Fail':
        return '❌';
      case 'Not Executed':
        return '⏳';
      default:
        return '⚪';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div 
      className="test-case-node relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {!data.isCenter && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-2 h-2"
        />
      )}
      
      <div className="node-content relative">
        <div className="flex items-center gap-2">
          {data.isTestCase && data.status && (
            <span className="text-lg">{getStatusIcon(data.status)}</span>
          )}
          <div className="flex-1">
            <div className="font-medium">{data.label}</div>
            {data.isFeature && data.testCases && (
              <div className="text-xs opacity-80">
                {data.testCases.length} test cases
              </div>
            )}
          </div>
        </div>
        
        {data.priority && (
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: getPriorityColor(data.priority) }}
            title={`Priority: ${data.priority}`}
          />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && data.isTestCase && (
        <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] -top-2 left-full ml-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">{data.label}</span>
                <span className="text-lg">{getStatusIcon(data.status || '')}</span>
              </div>
              <div className="flex gap-2">
                <span 
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: getPriorityColor(data.priority || '') }}
                >
                  {data.priority}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  data.status === 'Pass' ? 'bg-green-100 text-green-800' :
                  data.status === 'Fail' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {data.status}
                </span>
              </div>
            </div>

            {/* Feature */}
            {data.feature && (
              <div>
                <span className="font-semibold text-sm text-gray-700">Feature:</span>
                <p className="text-sm text-gray-600">{data.feature}</p>
              </div>
            )}

            {/* Description */}
            {data.description && (
              <div>
                <span className="font-semibold text-sm text-gray-700">Objective:</span>
                <p className="text-sm text-gray-600">{data.description}</p>
              </div>
            )}

            {/* Pre-conditions */}
            {data.preConditions && (
              <div>
                <span className="font-semibold text-sm text-gray-700">Pre-conditions:</span>
                <p className="text-sm text-gray-600">{data.preConditions}</p>
              </div>
            )}

            {/* Test Steps */}
            {data.testSteps && (
              <div>
                <span className="font-semibold text-sm text-gray-700">Test Steps:</span>
                <p className="text-sm text-gray-600 max-h-20 overflow-y-auto">{data.testSteps}</p>
              </div>
            )}

            {/* Expected Result */}
            {data.expectedResult && (
              <div>
                <span className="font-semibold text-sm text-gray-700">Expected Result:</span>
                <p className="text-sm text-gray-600">{data.expectedResult}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!data.isCenter && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-2 h-2"
        />
      )}
    </div>
  );
}
