import { Request, Response } from 'express';
import { storage } from '../storage';

export async function generateFlowDiagram(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { moduleId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    console.log(`🔄 Generating Mermaid flow diagram for project ${projectId}${moduleId ? ` and module ${moduleId}` : ''}`);

    // Get project details
    const project = await storage.getProject(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get test cases for the project with all details
    let testCases;
    if (moduleId && moduleId !== 'all') {
      testCases = await storage.getTestCases(parseInt(projectId), parseInt(moduleId as string));
    } else {
      testCases = await storage.getTestCasesByProject(parseInt(projectId));
    }

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

    // Group test cases by module for mind map layout
    const featureGroups = {};
    testCases.forEach(testCase => {
      // Use module name if available, otherwise fall back to feature, then to a generic category
      let moduleName = testCase.moduleName || testCase.feature || 'General Tests';

      // For better grouping, if we have a testCaseId with module prefix, extract proper module name
      if (testCase.testCaseId && testCase.testCaseId.includes('-')) {
        const parts = testCase.testCaseId.split('-');
        if (parts.length >= 4 && parts[2] === 'TC') {
          // Extract module prefix from new format: BEG-REG-TC-001 -> REG
          const modulePrefix = parts[1];
          // Map common prefixes to full names
          const prefixToName = {
            'REG': 'User Registration Module',
            'LOG': 'User Login Module', 
            'PROF': 'User Profile Module',
            'DASH': 'Dashboard Module',
            'MENU': 'Menu Management Module',
            'ORD': 'Order Management Module',
            'PAY': 'Payment Processing Module',
            'INV': 'Inventory Management Module',
            'AUTH': 'Authentication Module',
            'USER': 'User Management Module',
            'PROD': 'Product Management Module',
            'CART': 'Shopping Cart Module'
          };
          moduleName = prefixToName[modulePrefix] || `${modulePrefix} Module`;
        } else if (parts.length >= 3 && parts[1] === 'TC') {
          // Handle old format: BEG-TC-001 -> use feature or generic name
          moduleName = testCase.feature || 'General Tests';
        }
      }

      if (!featureGroups[moduleName]) {
        featureGroups[moduleName] = [];
      }
      featureGroups[moduleName].push(testCase);
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

    // Create module branch nodes in a tree-like vertical pattern
    const modules = Object.keys(featureGroups);
    const moduleSpacing = 250; // Increased vertical spacing between modules
    const startY = centerY - ((modules.length - 1) * moduleSpacing) / 2; // Center the modules vertically

    modules.forEach((module, moduleIndex) => {
      const moduleX = centerX + 350; // Increased horizontal distance from center
      const moduleY = startY + moduleIndex * moduleSpacing;
      const moduleNodeId = `module-${moduleIndex}`;

      // Module node (green nodes representing test modules/categories)
      nodes.push({
        id: moduleNodeId,
        type: 'testCaseNode',
        data: {
          label: module === 'User Registration' ? 'User Registration Module' : module,
          description: `${featureGroups[module].length} test cases`,
          isFeature: true,
          testCases: featureGroups[module]
        },
        position: { x: moduleX, y: moduleY },
        style: {
          backgroundColor: '#10B981',
          color: 'white',
          border: '2px solid #059669',
          borderRadius: '12px',
          padding: '15px',
          fontSize: '14px',
          fontWeight: '600',
          minWidth: '180px',
          textAlign: 'center',
        },
      });

      // Edge from center to module (horizontal line)
      edges.push({
        id: `e-center-${moduleNodeId}`,
        source: 'center-1',
        target: moduleNodeId,
        type: 'straight',
        style: { stroke: '#10B981', strokeWidth: 3 },
        markerEnd: { type: 'ArrowClosed', color: '#10B981' },
      });

      // Create test case nodes in a vertical tree structure for each module
      const testCases = featureGroups[module];
      const testCaseSpacing = 100; // Increased vertical spacing between test cases
      const testCaseStartY = moduleY - ((testCases.length - 1) * testCaseSpacing) / 2;

      testCases.forEach((testCase, testIndex) => {
        const testX = moduleX + 300; // Increased horizontal distance from module
        const testY = testCaseStartY + testIndex * testCaseSpacing;
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

        const testNode = {
          id: testNodeId,
          type: 'testCaseNode',
          data: {
            label: testCase.testCaseId || `TC-${String(testIndex + 1).padStart(3, '0')}`, // Use actual testCaseId from database
            description: testCase.title || testCase.description || 'No description available',
            testCaseId: testCase.id,
            feature: testCase.feature || 'General',
            priority: testCase.priority || 'Medium',
            status: testCase.status || 'Not Executed',
            preConditions: testCase.preConditions || 'None specified',
            testSteps: testCase.testSteps || 'No steps defined',
            expectedResult: testCase.expectedResult || 'Not specified',
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
        };
        nodes.push(testNode);

        // Edge from module to test case (straight line)
        edges.push({
          id: `e-${moduleNodeId}-${testNodeId}`,
          source: moduleNodeId,
          target: testNodeId,
          type: 'straight',
          style: { stroke: backgroundColor, strokeWidth: 2 },
          markerEnd: { type: 'ArrowClosed', color: backgroundColor },
        });
      });
    });

    // Create flow diagram name
    const timestamp = new Date().toLocaleString();
    let diagramName = `${project.name} - Test Flow`;
    let diagramDescription = `Auto-generated flow diagram for ${project.name}`;

    if (moduleId && moduleId !== 'all') {
      const module = await storage.getModule(parseInt(moduleId as string));
      if (module) {
        diagramName += ` - ${module.name} Module`;
        diagramDescription += ` - ${module.name} module`;
      }
    }

    diagramName += ` (${timestamp})`;
    diagramDescription += ` containing ${testCases.length} test cases`;

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