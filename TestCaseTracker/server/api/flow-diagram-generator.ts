
import { Request, Response } from 'express';
import { storage } from '../storage';

interface TestCaseNode {
  id: string;
  type: 'LINKED_TESTCASE';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    linkedItemId: number;
    linkedItemType: 'testCase';
    category?: string;
  };
}

interface CategoryNode {
  id: string;
  type: 'STEP';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    category: string;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  style?: any;
}

// Test case categorization based on common testing types
const categorizeTestCase = (testCase: any): string => {
  const title = testCase.title?.toLowerCase() || '';
  const feature = testCase.feature?.toLowerCase() || '';
  const description = testCase.description?.toLowerCase() || '';
  
  const text = `${title} ${feature} ${description}`;
  
  if (text.includes('functional') || text.includes('business') || text.includes('requirement')) {
    return 'Functional Tests';
  }
  if (text.includes('usability') || text.includes('ui') || text.includes('user interface')) {
    return 'Usability Tests';
  }
  if (text.includes('security') || text.includes('authentication') || text.includes('authorization')) {
    return 'Security Tests';
  }
  if (text.includes('performance') || text.includes('load') || text.includes('stress')) {
    return 'Performance Tests';
  }
  if (text.includes('scalability') || text.includes('volume') || text.includes('capacity')) {
    return 'Scalability Tests';
  }
  if (text.includes('upgrade') || text.includes('migration') || text.includes('version')) {
    return 'Upgrade Tests';
  }
  if (text.includes('compatibility') || text.includes('browser') || text.includes('device')) {
    return 'Compatibility Tests';
  }
  if (text.includes('integration') || text.includes('api') || text.includes('service')) {
    return 'Integration Tests';
  }
  if (text.includes('regression') || text.includes('smoke') || text.includes('sanity')) {
    return 'Regression Tests';
  }
  
  return 'General Tests';
};

export const generateFlowDiagram = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { moduleId, viewType = 'project' } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Fetch project details
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Fetch test cases based on view type
    let testCases = [];
    if (viewType === 'module' && moduleId) {
      testCases = await storage.getTestCasesByModule(moduleId);
    } else {
      testCases = await storage.getTestCasesByProject(projectId);
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No test cases found to generate flow diagram' 
      });
    }

    // Group test cases by category
    const categorizedTests: { [key: string]: any[] } = {};
    testCases.forEach(testCase => {
      const category = categorizeTestCase(testCase);
      if (!categorizedTests[category]) {
        categorizedTests[category] = [];
      }
      categorizedTests[category].push(testCase);
    });

    // Generate nodes and edges
    const nodes: (TestCaseNode | CategoryNode)[] = [];
    const edges: FlowEdge[] = [];

    // Create central feature node
    const centralNode: CategoryNode = {
      id: 'central-feature',
      type: 'STEP',
      position: { x: 400, y: 300 },
      data: {
        label: `${project.name} Features`,
        description: 'Central feature hub',
        category: 'central'
      }
    };
    nodes.push(centralNode);

    // Create category nodes and test case nodes
    const categories = Object.keys(categorizedTests);
    const angleStep = (2 * Math.PI) / categories.length;
    const categoryRadius = 300;
    const testCaseRadius = 150;

    categories.forEach((category, categoryIndex) => {
      const categoryAngle = categoryIndex * angleStep;
      const categoryX = 400 + Math.cos(categoryAngle) * categoryRadius;
      const categoryY = 300 + Math.sin(categoryAngle) * categoryRadius;

      // Create category node
      const categoryNodeId = `category-${categoryIndex}`;
      const categoryNode: CategoryNode = {
        id: categoryNodeId,
        type: 'STEP',
        position: { x: categoryX, y: categoryY },
        data: {
          label: category,
          description: `${categorizedTests[category].length} test cases`,
          category: category.toLowerCase().replace(/\s+/g, '-')
        }
      };
      nodes.push(categoryNode);

      // Create edge from central to category
      edges.push({
        id: `central-to-${categoryNodeId}`,
        source: 'central-feature',
        target: categoryNodeId,
        type: 'default'
      });

      // Create test case nodes for this category
      const testCases = categorizedTests[category];
      testCases.forEach((testCase, testIndex) => {
        const testAngle = categoryAngle + ((testIndex - (testCases.length - 1) / 2) * 0.3);
        const testX = categoryX + Math.cos(testAngle) * testCaseRadius;
        const testY = categoryY + Math.sin(testAngle) * testCaseRadius;

        const testNodeId = `test-${testCase.id}`;
        const testNode: TestCaseNode = {
          id: testNodeId,
          type: 'LINKED_TESTCASE',
          position: { x: testX, y: testY },
          data: {
            label: testCase.title || `Test Case ${testCase.testCaseId}`,
            description: testCase.feature,
            linkedItemId: testCase.id,
            linkedItemType: 'testCase',
            category: category.toLowerCase().replace(/\s+/g, '-')
          }
        };
        nodes.push(testNode);

        // Create edge from category to test case
        edges.push({
          id: `${categoryNodeId}-to-${testNodeId}`,
          source: categoryNodeId,
          target: testNodeId,
          type: 'default'
        });
      });
    });

    // Create flow diagram
    const diagramName = moduleId 
      ? `${project.name} - Module Flow Diagram`
      : `${project.name} - Project Flow Diagram`;

    const diagramData = {
      nodes,
      edges,
      metadata: {
        name: diagramName,
        description: `Auto-generated flow diagram for ${viewType === 'module' ? 'module' : 'project'} test cases`,
        version: '1.0',
        createdBy: req.session?.userId,
        createdAt: new Date().toISOString()
      }
    };

    const diagram = await storage.createFlowDiagram({
      name: diagramName,
      description: `Auto-generated flow diagram showing test case organization`,
      projectId: parseInt(projectId),
      data: diagramData,
      createdById: req.session?.userId || 1
    });

    res.json({
      success: true,
      message: 'Flow diagram generated successfully',
      diagramId: diagram.id,
      diagram
    });

  } catch (error) {
    console.error('Error generating flow diagram:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flow diagram',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
