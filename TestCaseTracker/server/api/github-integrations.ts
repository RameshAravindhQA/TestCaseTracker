
import { Router } from 'express';
import { githubService } from '../github-service';
import { logger } from '../logger';
import { authenticateToken } from '../auth-middleware';

const router = Router();

// In-memory storage for GitHub integrations (replace with database in production)
let integrations: any[] = [];
let nextId = 1;

// Get all GitHub integrations for a user
router.get('/integrations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Filter integrations for the current user (in production, this would be database query)
    const userIntegrations = integrations.map(integration => ({
      ...integration,
      // Don't expose full access token in responses
      accessToken: integration.accessToken.substring(0, 10) + '...',
      connectionStatus: 'connected' // Default status
    }));

    res.json(userIntegrations);
  } catch (error) {
    logger.error('Failed to get GitHub integrations:', error);
    res.status(500).json({ message: 'Failed to get GitHub integrations' });
  }
});

// Test GitHub connection
router.post('/test-connection', authenticateToken, async (req, res) => {
  try {
    const { username, repository, accessToken } = req.body;

    // Validate required fields
    if (!username || !repository || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, repository, and accessToken are required',
      });
    }

    // Validate token format
    if (!accessToken.startsWith('ghp_') && !accessToken.startsWith('github_pat_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Please use a GitHub Personal Access Token starting with "ghp_" or "github_pat_"',
      });
    }

    logger.info('Testing GitHub connection:', {
      owner: username,
      repo: repository,
      tokenLength: accessToken.length,
    });

    // Configure GitHub service
    githubService.setConfig({
      owner: username,
      repo: repository,
      token: accessToken,
    });

    // Test connection
    const result = await githubService.testConnection();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    logger.error('GitHub connection test error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while testing GitHub connection',
      error: error.message,
    });
  }
});

// Create GitHub integration
router.post('/integrations', authenticateToken, async (req, res) => {
  try {
    const { 
      projectId,
      repoUrl,
      accessToken,
      webhookSecret,
      isActive,
      webhookUrl 
    } = req.body;

    // Validate required fields
    if (!projectId || !repoUrl || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, repoUrl, and accessToken are required',
      });
    }

    // Extract username and repository from URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository URL format',
      });
    }

    const [, username, repository] = urlMatch;

    // Test connection first
    githubService.setConfig({
      owner: username,
      repo: repository,
      token: accessToken,
      webhookSecret,
    });

    const testResult = await githubService.testConnection();
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `GitHub connection failed: ${testResult.message}`,
      });
    }

    // Create integration
    const integration = {
      id: nextId++,
      projectId: parseInt(projectId),
      projectName: `Project ${projectId}`, // In production, fetch from database
      repoUrl,
      accessToken,
      webhookUrl: webhookUrl || '',
      webhookSecret,
      isEnabled: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectionStatus: 'connected',
      userId: req.user?.id
    };

    integrations.push(integration);

    logger.info('GitHub integration created successfully:', {
      id: integration.id,
      project: integration.projectName,
      repo: repoUrl,
    });

    // Return integration without exposing full access token
    const safeIntegration = {
      ...integration,
      accessToken: accessToken.substring(0, 10) + '...'
    };

    res.status(201).json(safeIntegration);

  } catch (error: any) {
    logger.error('Failed to create GitHub integration:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating GitHub integration',
      error: error.message,
    });
  }
});

// Update GitHub integration
router.put('/integrations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      projectId,
      repoUrl,
      accessToken,
      webhookSecret,
      isActive,
      webhookUrl 
    } = req.body;

    // Find integration
    const integrationIndex = integrations.findIndex(i => i.id === parseInt(id));
    if (integrationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'GitHub integration not found',
      });
    }

    const integration = integrations[integrationIndex];

    // Validate required fields
    if (!projectId || !repoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId and repoUrl are required',
      });
    }

    // Extract username and repository from URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository URL format',
      });
    }

    const [, username, repository] = urlMatch;

    // If access token is provided, test connection
    if (accessToken) {
      githubService.setConfig({
        owner: username,
        repo: repository,
        token: accessToken,
        webhookSecret,
      });

      const testResult = await githubService.testConnection();
      if (!testResult.success) {
        return res.status(400).json({
          success: false,
          message: `GitHub connection failed: ${testResult.message}`,
        });
      }
    }

    // Update integration
    const updatedIntegration = {
      ...integration,
      projectId: parseInt(projectId),
      repoUrl,
      accessToken: accessToken || integration.accessToken, // Keep existing if not provided
      webhookUrl: webhookUrl || integration.webhookUrl,
      webhookSecret: webhookSecret || integration.webhookSecret,
      isEnabled: isActive !== undefined ? isActive : integration.isEnabled,
      updatedAt: new Date().toISOString(),
    };

    integrations[integrationIndex] = updatedIntegration;

    logger.info('GitHub integration updated successfully:', {
      id: updatedIntegration.id,
      repo: repoUrl,
    });

    // Return integration without exposing full access token
    const safeIntegration = {
      ...updatedIntegration,
      accessToken: updatedIntegration.accessToken.substring(0, 10) + '...'
    };

    res.json(safeIntegration);

  } catch (error: any) {
    logger.error('Failed to update GitHub integration:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating GitHub integration',
      error: error.message,
    });
  }
});

// Delete GitHub integration
router.delete('/integrations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find integration
    const integrationIndex = integrations.findIndex(i => i.id === parseInt(id));
    if (integrationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'GitHub integration not found',
      });
    }

    // Remove integration
    const deletedIntegration = integrations.splice(integrationIndex, 1)[0];

    logger.info('GitHub integration deleted successfully:', {
      id: deletedIntegration.id,
      repo: deletedIntegration.repoUrl,
    });

    res.json({
      success: true,
      message: 'GitHub integration deleted successfully',
    });

  } catch (error: any) {
    logger.error('Failed to delete GitHub integration:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting GitHub integration',
      error: error.message,
    });
  }
});

// Create GitHub issue
router.post('/create-issue', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      body, 
      labels,
      githubUsername,
      repositoryName,
      personalAccessToken 
    } = req.body;

    if (!title || !body || !githubUsername || !repositoryName || !personalAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for issue creation',
      });
    }

    // Configure GitHub service
    githubService.setConfig({
      owner: githubUsername,
      repo: repositoryName,
      token: personalAccessToken,
    });

    // Create issue
    const result = await githubService.createIssue(title, body, labels);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    logger.error('Failed to create GitHub issue:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating GitHub issue',
      error: error.message,
    });
  }
});

export default router;
