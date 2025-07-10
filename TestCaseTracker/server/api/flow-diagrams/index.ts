import express from 'express';
import { IStorage } from '../../storage';
import { logger } from '../../logger';

// Create router for flow diagrams API
export default function createFlowDiagramsRouter(storage: IStorage) {
  const router = express.Router();

  // Get all flow diagrams
  router.get('/', async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const diagrams = await storage.getFlowDiagrams(projectId);
      res.json(diagrams);
    } catch (error) {
      logger.error('Error fetching flow diagrams:', error);
      res.status(500).json({ error: 'Failed to fetch flow diagrams' });
    }
  });

  // Get flow diagram by id
  router.get('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const diagram = await storage.getFlowDiagram(id);
      
      if (!diagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }
      
      res.json(diagram);
    } catch (error) {
      logger.error(`Error fetching flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch flow diagram' });
    }
  });

  // Create flow diagram
  router.post('/', async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Add user ID to the diagram data
      const diagramData = {
        ...req.body,
        createdById: req.session.userId
      };

      // Save the flow diagram
      const newDiagram = await storage.createFlowDiagram(diagramData);
      res.status(201).json(newDiagram);
    } catch (error) {
      logger.error('Error creating flow diagram:', error);
      res.status(500).json({ error: 'Failed to create flow diagram' });
    }
  });

  // Update flow diagram
  router.put('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the existing diagram to check permissions
      const existingDiagram = await storage.getFlowDiagram(id);
      if (!existingDiagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }

      // Update the flow diagram
      const updatedDiagram = await storage.updateFlowDiagram(id, req.body);
      res.json(updatedDiagram);
    } catch (error) {
      logger.error(`Error updating flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update flow diagram' });
    }
  });

  // Delete flow diagram
  router.delete('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the existing diagram to check permissions
      const existingDiagram = await storage.getFlowDiagram(id);
      if (!existingDiagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }

      // Delete the flow diagram
      await storage.deleteFlowDiagram(id);
      res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete flow diagram' });
    }
  });

  return router;
}