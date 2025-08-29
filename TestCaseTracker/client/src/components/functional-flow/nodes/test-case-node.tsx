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
  const [isMinimized, setIsMinimized] = useState(false);

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

  const formatTestSteps = (steps: string) => {
    if (!steps) return '';

    // Split by line breaks and number each step
    const stepLines = steps.split('\n').filter(line => line.trim());
    return stepLines.map((step, index) => {
      // Remove existing numbering if present
      const cleanStep = step.replace(/^\d+\.\s*/, '').trim();
      return `${index + 1}. ${cleanStep}`;
    }).join('\n');
  };

  const renderTooltipContent = () => {
    if (data.isCenter) {
      return (
        <div className="p-3 max-w-xs">
          <h3 className="font-bold text-sm mb-2">{data.label}</h3>
          <p className="text-xs text-gray-600">{data.description}</p>
        </div>
      );
    }

    if (data.isFeature) {
      return (
        <div className="p-3 max-w-xs">
          <h3 className="font-bold text-sm mb-2">{data.label}</h3>
          <p className="text-xs text-gray-600">{data.description}</p>
          {data.testCases && data.testCases.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold">Test Cases:</p>
              <ul className="text-xs text-gray-600 mt-1">
                {data.testCases.slice(0, 3).map((tc: any) => (
                  <li key={tc.id}>• {tc.testCaseId}</li>
                ))}
                {data.testCases.length > 3 && (
                  <li>• ... and {data.testCases.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (data.isTestCase) {
      return (
        <div className={`transition-all duration-200 ${isMinimized ? 'w-80 max-h-60' : 'w-96 max-h-80'} overflow-hidden`}>
          {/* Header with minimize/maximize button */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border-b">
            <h3 className="font-bold text-sm text-blue-600">{data.label}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? '⬆️' : '⬇️'}
            </button>
          </div>
          
          {/* Content area with scroll */}
          <div className="p-3 overflow-y-auto" style={{ maxHeight: isMinimized ? '200px' : '280px' }}>
            {data.description && (
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-800">Test Objective:</p>
                <p className="text-xs text-gray-600 mt-1">{data.description}</p>
              </div>
            )}

            <div className="space-y-2">
              {data.feature && (
                <div>
                  <span className="text-xs font-bold text-gray-800">Feature:</span>
                  <span className="text-xs text-gray-600 ml-1">{data.feature}</span>
                </div>
              )}
              {data.priority && (
                <div>
                  <span className="text-xs font-bold text-gray-800">Priority:</span>
                  <span className="text-xs text-gray-600 ml-1">{data.priority}</span>
                </div>
              )}
              {data.status && (
                <div>
                  <span className="text-xs font-bold text-gray-800">Status:</span>
                  <span className={`text-xs ml-1 ${
                    data.status === 'Pass' ? 'text-green-600 font-semibold' :
                    data.status === 'Fail' ? 'text-red-600 font-semibold' :
                    'text-gray-600'
                  }`}>{data.status}</span>
                </div>
              )}
            </div>

            {!isMinimized && (
              <>
                {data.preConditions && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-800">Pre-conditions:</p>
                    <p className="text-xs text-gray-600 mt-1">{data.preConditions}</p>
                  </div>
                )}

                {data.testSteps && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-800">Steps to Reproduce:</p>
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-line font-mono bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                      {formatTestSteps(data.testSteps)}
                    </div>
                  </div>
                )}

                {data.expectedResult && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-800">Expected Result:</p>
                    <p className="text-xs text-gray-600 mt-1 bg-green-50 p-2 rounded border">{data.expectedResult}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };


  return (
    <div className="test-case-node relative">
      {!data.isCenter && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-2 h-2"
        />
      )}

      <div 
        className="node-content relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
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
      {showTooltip && (
        <div 
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl -top-2 left-full ml-3 transform"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{ pointerEvents: 'auto' }}
        >
          {renderTooltipContent()}
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