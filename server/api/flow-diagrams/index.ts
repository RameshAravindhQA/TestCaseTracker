
import { Request, Response, Router } from 'express';
import { storage } from '../../storage';

const router = Router();

// Get all flow diagrams for a project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const diagrams = await storage.getFlowDiagramsByProject(projectId as string);
    res.json(diagrams);
  } catch (error) {
    console.error('Error fetching flow diagrams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific flow diagram
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const diagram = await storage.getFlowDiagram(id);
    
    if (!diagram) {
      return res.status(404).json({ message: 'Flow diagram not found' });
    }

    res.json(diagram);
  } catch (error) {
    console.error('Error fetching flow diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new flow diagram
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, projectId, nodes, edges } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({ message: 'Name and project ID are required' });
    }

    const diagram = await storage.createFlowDiagram({
      name,
      description,
      projectId,
      nodes: nodes || [],
      edges: edges || [],
    });

    res.status(201).json(diagram);
  } catch (error) {
    console.error('Error creating flow diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a flow diagram
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges } = req.body;

    const diagram = await storage.updateFlowDiagram(id, {
      name,
      description,
      nodes,
      edges,
    });

    if (!diagram) {
      return res.status(404).json({ message: 'Flow diagram not found' });
    }

    res.json(diagram);
  } catch (error) {
    console.error('Error updating flow diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a flow diagram
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteFlowDiagram(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Flow diagram not found' });
    }

    res.json({ message: 'Flow diagram deleted successfully' });
  } catch (error) {
    console.error('Error deleting flow diagram:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
