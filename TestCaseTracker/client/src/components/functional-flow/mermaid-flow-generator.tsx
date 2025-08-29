
import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';

interface TestCase {
  id: string;
  testId: string;
  feature: string;
  objective: string;
  status: string;
  priority: string;
}

interface MermaidFlowGeneratorProps {
  projectId: string;
  onFlowGenerated?: (mermaidCode: string) => void;
}

export const MermaidFlowGenerator: React.FC<MermaidFlowGeneratorProps> = ({
  projectId,
  onFlowGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, []);

  useEffect(() => {
    if (mermaidCode && mermaidRef.current) {
      renderMermaidDiagram();
    }
  }, [mermaidCode]);

  const fetchTestCases = async () => {
    try {
      const response = await apiRequest('GET', `/api/test-cases?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      const data = await response.json();
      setTestCases(data);
      return data;
    } catch (error) {
      console.error('Error fetching test cases:', error);
      throw error;
    }
  };

  const generateMermaidCode = (testCases: TestCase[]) => {
    if (testCases.length === 0) {
      return `flowchart TD
        A[No Test Cases Available] --> B[Please add test cases first]
        style A fill:#ff9999
        style B fill:#ffcc99`;
    }

    let mermaidCode = 'flowchart TD\n';
    
    // Start node
    mermaidCode += '    Start([Test Execution Start]) --> TestPlan[Test Plan Review]\n';
    
    // Group test cases by feature
    const featureGroups = testCases.reduce((groups, testCase) => {
      const feature = testCase.feature || 'General';
      if (!groups[feature]) groups[feature] = [];
      groups[feature].push(testCase);
      return groups;
    }, {} as Record<string, TestCase[]>);

    let nodeCounter = 1;
    let prevNode = 'TestPlan';

    Object.entries(featureGroups).forEach(([feature, cases], featureIndex) => {
      const featureNodeId = `Feature${featureIndex + 1}`;
      const featureName = feature.replace(/[^a-zA-Z0-9]/g, '');
      
      // Feature node
      mermaidCode += `    ${prevNode} --> ${featureNodeId}[${feature}]\n`;
      
      let featurePrevNode = featureNodeId;
      
      cases.forEach((testCase, index) => {
        const testNodeId = `Test${nodeCounter}`;
        const testLabel = testCase.testId || `Test ${nodeCounter}`;
        const objective = testCase.objective?.substring(0, 30) || 'Test execution';
        
        mermaidCode += `    ${featurePrevNode} --> ${testNodeId}["${testLabel}<br/>${objective}..."]\n`;
        
        // Add decision node for test result
        const decisionNodeId = `Decision${nodeCounter}`;
        mermaidCode += `    ${testNodeId} --> ${decisionNodeId}{Pass/Fail?}\n`;
        
        // Add result nodes
        const passNodeId = `Pass${nodeCounter}`;
        const failNodeId = `Fail${nodeCounter}`;
        mermaidCode += `    ${decisionNodeId} -->|Pass| ${passNodeId}[Test Passed]\n`;
        mermaidCode += `    ${decisionNodeId} -->|Fail| ${failNodeId}[Test Failed - Bug Report]\n`;
        
        // Set styles based on status and priority
        if (testCase.status === 'Passed') {
          mermaidCode += `    style ${testNodeId} fill:#90EE90\n`;
        } else if (testCase.status === 'Failed') {
          mermaidCode += `    style ${testNodeId} fill:#FFB6C1\n`;
        } else {
          mermaidCode += `    style ${testNodeId} fill:#87CEEB\n`;
        }
        
        if (testCase.priority === 'High') {
          mermaidCode += `    style ${decisionNodeId} fill:#FF6B6B\n`;
        } else if (testCase.priority === 'Medium') {
          mermaidCode += `    style ${decisionNodeId} fill:#FFE66D\n`;
        }
        
        featurePrevNode = passNodeId;
        nodeCounter++;
      });
      
      prevNode = featurePrevNode;
    });
    
    // End node
    mermaidCode += `    ${prevNode} --> End([Test Execution Complete])\n`;
    
    // Add styling
    mermaidCode += `    style Start fill:#98FB98\n`;
    mermaidCode += `    style End fill:#98FB98\n`;
    mermaidCode += `    style TestPlan fill:#87CEEB\n`;
    
    return mermaidCode;
  };

  const renderMermaidDiagram = async () => {
    if (!mermaidRef.current || !mermaidCode) return;
    
    try {
      mermaidRef.current.innerHTML = '';
      const { svg } = await mermaid.render('mermaid-diagram', mermaidCode);
      mermaidRef.current.innerHTML = svg;
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      mermaidRef.current.innerHTML = '<p>Error rendering diagram</p>';
    }
  };

  const handleGenerateFlow = async () => {
    setIsGenerating(true);
    try {
      const fetchedTestCases = await fetchTestCases();
      const generatedCode = generateMermaidCode(fetchedTestCases);
      setMermaidCode(generatedCode);
      
      if (onFlowGenerated) {
        onFlowGenerated(generatedCode);
      }
      
      toast({
        title: 'Success',
        description: `Flow diagram generated with ${fetchedTestCases.length} test cases`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate flow diagram',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDiagram = () => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-diagram-project-${projectId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Flow Generator</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateFlow} 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating...' : 'Generate Mermaid Flow'}
            </Button>
            {mermaidCode && (
              <Button onClick={downloadDiagram} variant="outline">
                Download SVG
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mermaidCode && (
            <div className="space-y-4">
              <div 
                ref={mermaidRef} 
                className="border rounded-lg p-4 bg-white min-h-[400px] overflow-auto"
              />
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">View Mermaid Code</summary>
                <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto text-sm">
                  {mermaidCode}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MermaidFlowGenerator;
