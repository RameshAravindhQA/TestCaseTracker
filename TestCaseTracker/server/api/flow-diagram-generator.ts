
import { Request, Response } from 'express';
import { storage } from '../storage';

export async function generateFlowDiagram(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    console.log(`🔄 Generating Mermaid flow diagram for project ${projectId}`);

    // Get project details
    const project = await storage.getProject(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get test cases for the project with all details
    const testCases = await storage.getTestCasesByProject(parseInt(projectId));
    
    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test cases found for this project. Please add test cases first.'
      });
    }

    console.log(`📋 Found ${testCases.length} test cases for Mermaid flow diagram generation`);

    // Generate Mermaid diagram definition
    let mermaidDef = "graph TD;\n";
    mermaidDef += `    Start([${project.name} Test Flow]);\n`;
    
    testCases.forEach((testCase, i) => {
      const nodeId = `TC${i}`;
      const label = `${testCase.testCaseId}: ${testCase.feature || testCase.testObjective || 'Test Case'}`;
      mermaidDef += `    ${nodeId}["${label}"];\n`;
      
      if (i === 0) {
        mermaidDef += `    Start --> ${nodeId};\n`;
      } else {
        mermaidDef += `    TC${i-1} --> ${nodeId};\n`;
      }
    });
    
    mermaidDef += `    TC${testCases.length - 1} --> End([Test Complete]);\n`;

    // Group test cases by feature for mind map layout
    const featureGroups = {};
    testCases.forEach(testCase => {
      const feature = testCase.feature || 'General Tests';
      if (!featureGroups[feature]) {
        featureGroups[feature] = [];
      }
      featureGroups[feature].push(testCase);
    });

    const nodes = [];
    const edges = [];
    
    // Central node
    const centerX = 400;
    const centerY = 300;
    nodes.push({
      id: 'center-1',
      type: 'testCaseNode',
      data: { 
        label: project.name,
        description: 'Central test execution hub',
        isCenter: true
      },
      position: { x: centerX, y: centerY },
      style: {
        backgroundColor: '#8B5CF6',
        color: 'white',
        border: '3px solid #7C3AED',
        borderRadius: '50%',
        padding: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        minWidth: '120px',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });

    // Create feature branch nodes in a radial pattern
    const features = Object.keys(featureGroups);
    const angleStep = (2 * Math.PI) / features.length;
    const branchRadius = 250;

    features.forEach((feature, featureIndex) => {
      const angle = featureIndex * angleStep;
      const featureX = centerX + Math.cos(angle) * branchRadius;
      const featureY = centerY + Math.sin(angle) * branchRadius;
      const featureNodeId = `feature-${featureIndex}`;

      // Feature node
      nodes.push({
        id: featureNodeId,
        type: 'testCaseNode',
        data: {
          label: feature,
          description: `${featureGroups[feature].length} test cases`,
          isFeature: true,
          testCases: featureGroups[feature]
        },
        position: { x: featureX, y: featureY },
        style: {
          backgroundColor: '#10B981',
          color: 'white',
          border: '2px solid #059669',
          borderRadius: '12px',
          padding: '15px',
          fontSize: '14px',
          fontWeight: '600',
          minWidth: '140px',
          textAlign: 'center',
        },
      });

      // Edge from center to feature
      edges.push({
        id: `e-center-${featureNodeId}`,
        source: 'center-1',
        target: featureNodeId,
        type: 'smoothstep',
        style: { stroke: '#10B981', strokeWidth: 3 },
        markerEnd: { type: 'ArrowClosed', color: '#10B981' },
      });

      // Create test case nodes for each feature
      const testCases = featureGroups[feature];
      const testCaseRadius = 120;
      const testCaseAngleStep = Math.PI / (testCases.length + 1);

      testCases.forEach((testCase, testIndex) => {
        const testAngle = angle + (testIndex - (testCases.length - 1) / 2) * testCaseAngleStep * 0.3;
        const testX = featureX + Math.cos(testAngle) * testCaseRadius;
        const testY = featureY + Math.sin(testAngle) * testCaseRadius;
        const testNodeId = `testcase-${testCase.id}`;

        // Determine node color based on status
        let backgroundColor = '#6B7280'; // Default gray for 'Not Executed'
        let borderColor = '#4B5563';
        
        if (testCase.status === 'Pass') {
          backgroundColor = '#10B981';
          borderColor = '#059669';
        } else if (testCase.status === 'Fail') {
          backgroundColor = '#EF4444';
          borderColor = '#DC2626';
        }

        nodes.push({
          id: testNodeId,
          type: 'testCaseNode',
          data: {
            label: testCase.testCaseId,
            description: testCase.testObjective || 'Test case execution',
            testCaseId: testCase.id,
            feature: testCase.feature,
            priority: testCase.priority,
            status: testCase.status,
            preConditions: testCase.preConditions,
            testSteps: testCase.testSteps,
            expectedResult: testCase.expectedResult,
            isTestCase: true
          },
          position: { x: testX, y: testY },
          style: {
            backgroundColor,
            color: 'white',
            border: `2px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '100px',
            textAlign: 'center',
            cursor: 'pointer',
          },
        });

        // Edge from feature to test case
        edges.push({
          id: `e-${featureNodeId}-${testNodeId}`,
          source: featureNodeId,
          target: testNodeId,
          type: 'smoothstep',
          style: { stroke: backgroundColor, strokeWidth: 2 },
          markerEnd: { type: 'ArrowClosed', color: backgroundColor },
        });
      });
    });

    // Create flow diagram name
    const timestamp = new Date().toLocaleString();
    const diagramName = `${project.name} - Test Flow (${timestamp})`;
    const diagramDescription = `Auto-generated flow diagram for ${project.name} containing ${testCases.length} test cases`;

    console.log(`📊 Generated ${nodes.length} nodes and ${edges.length} edges`);
    console.log('First few nodes:', nodes.slice(0, 3));

    // Save the flow diagram
    const flowDiagramData = {
      name: diagramName,
      description: diagramDescription,
      projectId: parseInt(projectId),
      data: {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 0.8 },
        mermaidDefinition: mermaidDef
      },
      version: '1.0',
      createdById: (req as any).session?.userId || 1
    };

    const savedDiagram = await storage.createFlowDiagram(flowDiagramData);

    console.log(`✅ Mermaid flow diagram generated successfully with ID: ${savedDiagram.id}`);

    res.json({
      success: true,
      message: `Mermaid flow diagram generated successfully with ${testCases.length} test cases`,
      diagramId: savedDiagram.id,
      diagram: savedDiagram,
      testCasesCount: testCases.length,
      mermaidDefinition: mermaidDef
    });

  } catch (error) {
    console.error('❌ Mermaid flow diagram generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Mermaid flow diagram',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
