import { Router } from 'express';
import { githubService } from '../github-service';
import { logger } from '../logger';
import { requireAuth } from '../auth-middleware';

const router = Router();

// Get all GitHub integrations for a user
router.get('/integrations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // For now, return empty array as we don't have persistent storage
    // In a real implementation, you'd fetch from database
    res.json([]);
  } catch (error) {
    logger.error('Failed to get GitHub integrations:', error);
    res.status(500).json({ message: 'Failed to get GitHub integrations' });
  }
});

// Test GitHub connection
router.post('/test-connection', requireAuth, async (req, res) => {
  try {
    const { githubUsername, repositoryName, personalAccessToken } = req.body;

    // Validate required fields
    if (!githubUsername || !repositoryName || !personalAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: githubUsername, repositoryName, and personalAccessToken are required',
      });
    }

    // Validate token format
    if (!personalAccessToken.startsWith('ghp_') && !personalAccessToken.startsWith('github_pat_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Please use a GitHub Personal Access Token starting with "ghp_" or "github_pat_"',
      });
    }

    logger.info('Testing GitHub connection:', {
      owner: githubUsername,
      repo: repositoryName,
      tokenLength: personalAccessToken.length,
    });

    // Configure GitHub service
    githubService.setConfig({
      owner: githubUsername,
      repo: repositoryName,
      token: personalAccessToken,
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
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { 
      projectId,
      project,
      githubUsername, 
      repositoryName, 
      personalAccessToken,
      webhookSecret,
      enableIntegration 
    } = req.body;

    // Validate required fields - check for both projectId and project
    const projectIdentifier = projectId || project;
    if (!projectIdentifier || !githubUsername || !repositoryName || !personalAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId (or project), githubUsername, repositoryName, and personalAccessToken are required',
      });
    }

    logger.info('Creating GitHub integration:', {
      project,
      owner: githubUsername,
      repo: repositoryName,
      enabled: enableIntegration,
    });

    // Configure GitHub service
    githubService.setConfig({
      owner: githubUsername,
      repo: repositoryName,
      token: personalAccessToken,
      webhookSecret,
    });

    // Test connection first
    const testResult = await githubService.testConnection();

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `GitHub connection failed: ${testResult.message}`,
      });
    }

    // In a real implementation, you'd save this to database
    // For now, we'll just return success
    const integration = {
      id: Date.now(),
      projectId: projectIdentifier,
      projectName: project || projectIdentifier,
      githubUsername,
      repositoryName,
      personalAccessToken: personalAccessToken.substring(0, 10) + '...',
      webhookSecret: webhookSecret ? '***' : undefined,
      isEnabled: enableIntegration || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info('GitHub integration created successfully:', {
      id: integration.id,
      project: integration.projectName,
      repo: `${githubUsername}/${repositoryName}`,
    });

    res.json({
      success: true,
      message: 'GitHub integration created successfully',
      data: integration,
    });

  } catch (error: any) {
    logger.error('Failed to create GitHub integration:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating GitHub integration',
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