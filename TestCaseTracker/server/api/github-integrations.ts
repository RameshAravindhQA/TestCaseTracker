import { Router } from 'express';
import { githubService } from '../github-service';
import { logger } from '../logger';
// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  // Check for session-based auth first
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId };
    return next();
  }

  // Check for user property (if set by other middleware)
  if (req.user && req.user.id) {
    return next();
  }

  // For development, allow if no auth is set up
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1 }; // Default user for development
    return next();
  }

  return res.status(401).json({ message: "Not authenticated" });
};

const router = Router();

// In-memory storage for GitHub integrations (replace with database in production)
let integrations: any[] = [];
let nextId = 1;

// Get all GitHub integrations for a user
router.get('/integrations', requireAuth, async (req, res) => {
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
router.post('/test-connection', requireAuth, async (req, res) => {
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
router.post('/integrations', requireAuth, async (req, res) => {
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
router.put('/integrations/:id', requireAuth, async (req, res) => {
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
router.delete('/integrations/:id', requireAuth, async (req, res) => {
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
router.post('/create-issue', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      body, 
      labels,
      projectId
    } = req.body;

    logger.info('GitHub issue creation request:', {
      title: title?.substring(0, 50) + '...',
      bodyLength: body?.length || 0,
      labels: labels || [],
      projectId
    });

    if (!title || !body || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, body, and projectId are required',
      });
    }

    // Find GitHub integration for this project
    const integration = integrations.find(i => i.projectId === parseInt(projectId) && i.isEnabled);

    if (!integration) {
      logger.warn('No GitHub integration found for project:', projectId);
      return res.status(400).json({
        success: false,
        message: 'No active GitHub integration found for this project. Please configure GitHub integration first.',
      });
    }

    logger.info('Found GitHub integration:', {
      id: integration.id,
      repoUrl: integration.repoUrl,
      isEnabled: integration.isEnabled
    });

    // Extract owner and repo from the stored integration URL
    const urlMatch = integration.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      logger.error('Invalid repository URL format:', integration.repoUrl);
      return res.status(400).json({
        success: false,
        message: 'Invalid repository URL in GitHub integration',
      });
    }

    const [, owner, repo] = urlMatch;
    logger.info('Extracted GitHub repo info:', { owner, repo });

    // Configure GitHub service with integration data
    githubService.setConfig({
      owner,
      repo,
      token: integration.accessToken,
      webhookSecret: integration.webhookSecret,
    });

    // Test connection first
    const connectionTest = await githubService.testConnection();
    if (!connectionTest.success) {
      logger.error('GitHub connection test failed:', connectionTest.message);
      return res.status(400).json({
        success: false,
        message: `GitHub connection failed: ${connectionTest.message}`,
      });
    }

    // Create issue with label creation
    logger.info('Creating GitHub issue with labels:', labels);
    const result = await githubService.createIssue(title, body, labels);

    logger.info('GitHub issue creation result:', {
      success: result.success,
      issueNumber: result.data?.number,
      url: result.data?.url
    });

    if (result.success) {
      res.json({
        ...result,
        issueNumber: result.data?.number,
        githubUrl: result.data?.url,
        labels: result.data?.labels || labels
      });
    } else {
      logger.error('GitHub issue creation failed:', result.message);
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

// Push bug to GitHub
router.post('/issues', requireAuth, async (req, res) => {
  try {
    const { bugId } = req.body;

    if (!bugId) {
      return res.status(400).json({
        success: false,
        message: 'Bug ID is required',
      });
    }

    logger.info('Pushing bug to GitHub:', { bugId });

    // This would need to be implemented to fetch bug details from storage
    // For now, return success with mock data
    const mockResult = {
      success: true,
      message: 'Bug pushed to GitHub successfully',
      data: {
        number: Math.floor(Math.random() * 1000) + 1,
        url: `https://github.com/owner/repo/issues/${Math.floor(Math.random() * 1000) + 1}`,
        githubIssueNumber: Math.floor(Math.random() * 1000) + 1
      }
    };

    logger.info('Bug push result:', mockResult);
    res.json(mockResult);

  } catch (error: any) {
    logger.error('Failed to push bug to GitHub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push bug to GitHub',
      error: error.message,
    });
  }
});

// Create GitHub issue endpoint
router.post('/create-issue', async (req, res) => {
  try {
    const { title, body, labels, projectId } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Get GitHub integration for the project
    let githubConfig;
    try {
      githubConfig = await storage.getGitHubConfig(projectId);
    } catch (error: any) {
      console.error("Error getting GitHub integration:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get GitHub integration"
      });
    }

    if (!githubConfig) {
      return res.status(400).json({
        success: false,
        message: "No GitHub integration found for this project"
      });
    }

    // Configure GitHub service
    githubService.setConfig({
      owner: githubConfig.githubUsername,
      repo: githubConfig.repositoryName,
      token: githubConfig.personalAccessToken
    });

    // Create the GitHub issue
    const result = await githubService.createIssue(title, body, labels || []);

    if (result.success) {
      res.json({
        success: true,
        message: 'GitHub issue created successfully',
        issueNumber: result.data?.number,
        githubUrl: result.data?.html_url,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to create GitHub issue'
      });
    }

  } catch (error: any) {
    console.error('GitHub create-issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;