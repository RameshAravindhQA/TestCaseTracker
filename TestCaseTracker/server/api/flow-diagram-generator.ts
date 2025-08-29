
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

    // Get test cases for the project
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

    // Convert Mermaid to ReactFlow nodes and edges for display
    const nodes = [];
    const edges = [];
    let yPosition = 100;
    const xPosition = 400;
    const nodeSpacing = 150;

    // Start node
    nodes.push({
      id: 'start-1',
      type: 'default',
      data: { 
        label: `${project.name} Test Flow`,
        description: 'Start of test execution flow'
      },
      position: { x: xPosition, y: yPosition },
      style: {
        backgroundColor: '#10B981',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
      },
    });

    let previousNodeId = 'start-1';
    yPosition += nodeSpacing;

    // Create nodes for each test case
    testCases.forEach((testCase, index) => {
      const nodeId = `testcase-${testCase.id}`;
      
      nodes.push({
        id: nodeId,
        type: 'default',
        data: {
          label: testCase.testCaseId,
          description: testCase.feature || testCase.testObjective || 'Test case execution',
          testCaseId: testCase.id,
          priority: testCase.priority,
          status: testCase.status
        },
        position: { x: xPosition, y: yPosition },
        style: {
          backgroundColor: '#3B82F6',
          color: 'white',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '10px',
        },
      });

      // Create edge from previous node to current node
      edges.push({
        id: `e-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        markerEnd: { type: 'ArrowClosed' },
        label: `Step ${index + 1}`,
      });

      previousNodeId = nodeId;
      yPosition += nodeSpacing;
    });

    // End node
    const endNodeId = 'end-1';
    nodes.push({
      id: endNodeId,
      type: 'default',
      data: { 
        label: 'Test Complete',
        description: 'All test cases completed'
      },
      position: { x: xPosition, y: yPosition },
      style: {
        backgroundColor: '#EF4444',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
      },
    });

    // Edge to end node
    edges.push({
      id: `e-${previousNodeId}-${endNodeId}`,
      source: previousNodeId,
      target: endNodeId,
      markerEnd: { type: 'ArrowClosed' },
      label: 'Complete',
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
