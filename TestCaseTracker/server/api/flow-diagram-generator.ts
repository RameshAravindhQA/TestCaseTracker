
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

    console.log(`🔄 Generating flow diagram for project ${projectId}`);

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

    console.log(`📋 Found ${testCases.length} test cases for flow diagram generation`);

    // Generate flow diagram nodes and edges based on test cases
    const nodes = [];
    const edges = [];
    let yPosition = 100;
    const xPosition = 400;
    const nodeSpacing = 150;

    // Start node
    nodes.push({
      id: 'start-1',
      type: 'startNode',
      data: { 
        label: `${project.name} Test Flow`,
        description: 'Start of test execution flow'
      },
      position: { x: xPosition, y: yPosition },
    });

    let previousNodeId = 'start-1';
    yPosition += nodeSpacing;

    // Create nodes for each test case
    testCases.forEach((testCase, index) => {
      const nodeId = `testcase-${testCase.id}`;
      
      nodes.push({
        id: nodeId,
        type: 'stepNode',
        data: {
          label: testCase.testCaseId,
          description: testCase.feature || testCase.testObjective || 'Test case execution',
          testCaseId: testCase.id,
          priority: testCase.priority,
          status: testCase.status
        },
        position: { x: xPosition, y: yPosition },
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
      type: 'endNode',
      data: { 
        label: 'Test Completion',
        description: 'All test cases completed'
      },
      position: { x: xPosition, y: yPosition },
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
    const diagramName = `${project.name} - Test Flow Diagram (${timestamp})`;
    const diagramDescription = `Auto-generated flow diagram for ${project.name} containing ${testCases.length} test cases`;

    // Save the flow diagram
    const flowDiagramData = {
      name: diagramName,
      description: diagramDescription,
      projectId: parseInt(projectId),
      data: {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 0.8 }
      },
      version: '1.0',
      createdById: (req as any).session?.userId || 1
    };

    const savedDiagram = await storage.createFlowDiagram(flowDiagramData);

    console.log(`✅ Flow diagram generated successfully with ID: ${savedDiagram.id}`);

    res.json({
      success: true,
      message: `Flow diagram generated successfully with ${testCases.length} test cases`,
      diagramId: savedDiagram.id,
      diagram: savedDiagram,
      testCasesCount: testCases.length
    });

  } catch (error) {
    console.error('❌ Flow diagram generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flow diagram',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
