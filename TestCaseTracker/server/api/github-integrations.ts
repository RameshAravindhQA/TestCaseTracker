import { logger } from "../logger";
import { storage } from "../storage";
import { githubService } from "../github-service";
import type { InsertGitHubConfig } from "@shared/github-types";

export async function createGitHubIntegration(req: any, res: any) {
  try {
    // Set proper content type for JSON response
    res.setHeader('Content-Type', 'application/json');

    const { projectId, repoUrl, accessToken, webhookSecret, isActive } = req.body;

    if (!projectId || !repoUrl || !accessToken) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: projectId, repoUrl, accessToken" 
      });
    }

    // Parse repository URL to extract owner and name
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid GitHub repository URL format" 
      });
    }

    const [, repoOwner, repoName] = repoMatch;
    const cleanRepoName = repoName.replace(/\.git$/, '');

    // Validate GitHub connection before creating integration
    const config = {
      repoOwner,
      repoName: cleanRepoName,
      accessToken
    };

    try {
      const isValid = await githubService.validateConnection(config);
      if (!isValid) {
        return res.status(400).json({ 
          success: false,
          message: "Failed to connect to GitHub repository. Please check your access token and repository URL." 
        });
      }
    } catch (validationError) {
      logger.error('GitHub validation error:', validationError);
      return res.status(400).json({ 
        success: false,
        message: "Invalid GitHub credentials or repository access denied." 
      });
    }

    // Check if integration already exists for this project and repository
    const existingConfigs = await storage.getAllGitHubConfigs();
    const duplicateConfig = existingConfigs.find(config => 
      config.projectId === parseInt(projectId) && 
      config.repoOwner === repoOwner && 
      config.repoName === cleanRepoName &&
      config.isActive
    );

    if (duplicateConfig) {
      return res.status(409).json({ 
        success: false,
        message: "GitHub integration already exists for this project and repository" 
      });
    }

    // Create the integration
    const integrationData: InsertGitHubConfig = {
      projectId: parseInt(projectId),
      repoOwner,
      repoName: cleanRepoName,
      accessToken,
      webhookSecret: webhookSecret || null,
      isActive: isActive !== undefined ? isActive : true,
      createdById: req.user?.id || 1
    };

    const integration = await storage.createGitHubConfig(integrationData);

    logger.info(`GitHub integration created for project ${projectId}`);

    res.status(201).json({
      success: true,
      message: "GitHub integration created successfully",
      integration: {
        id: integration.id,
        projectId: integration.projectId,
        repoOwner: integration.repoOwner,
        repoName: integration.repoName,
        repoUrl,
        isEnabled: integration.isActive,
        createdAt: integration.createdAt
      }
    });
  } catch (error) {
    logger.error('Failed to create GitHub integration:', error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

export async function getGitHubIntegrations(req: any, res: any) {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const integrations = await storage.getAllGitHubConfigs(userId);

    const enrichedIntegrations = await Promise.all(
      integrations.map(async (integration) => {
        const project = await await storage.getProject(integration.projectId);

        // Test connection status
        let connectionStatus = 'unknown';
        try {
          const config = {
            repoOwner: integration.repoOwner,
            repoName: integration.repoName,
            accessToken: integration.accessToken
          };
          const isConnected = await githubService.validateConnection(config);
          connectionStatus = isConnected ? 'connected' : 'error';
        } catch (error) {
          connectionStatus = 'error';
        }

        return {
          id: integration.id,
          projectId: integration.projectId,
          projectName: project?.name || 'Unknown Project',
          repoUrl: `https://github.com/${integration.repoOwner}/${integration.repoName}`,
          accessToken: '***' + integration.accessToken.slice(-4), // Mask the token
          webhookUrl: integration.webhookSecret ? 'Configured' : 'Not configured',
          isEnabled: integration.isActive,
          createdAt: integration.createdAt,
          connectionStatus
        };
      })
    );

    res.json(enrichedIntegrations);
  } catch (error) {
    logger.error('Failed to fetch GitHub integrations:', error);
    res.status(500).json({ 
      message: 'Failed to fetch GitHub integrations' 
    });
  }
}

export async function updateGitHubIntegration(req: any, res: any) {
  try {
    const { id } = req.params;
    const { repoUrl, accessToken, webhookSecret, isActive } = req.body;

    const integration = await storage.getGitHubConfigById(parseInt(id));
    if (!integration) {
      return res.status(404).json({ message: 'GitHub integration not found' });
    }

    // Check if user has permission to update this integration
    const project = await storage.getProject(integration.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Associated project not found' });
    }

    let updateData: any = {};

    // If repo URL is being updated, parse it
    if (repoUrl && repoUrl !== `https://github.com/${integration.repoOwner}/${integration.repoName}`) {
      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        return res.status(400).json({ 
          message: "Invalid GitHub repository URL format" 
        });
      }
      const [, repoOwner, repoName] = repoMatch;
      updateData.repoOwner = repoOwner;
      updateData.repoName = repoName.replace(/\.git$/, '');
    }

    // Update access token if provided
    if (accessToken && accessToken !== '***' + integration.accessToken.slice(-4)) {
      updateData.accessToken = accessToken;
    }

    // Update webhook secret if provided
    if (webhookSecret !== undefined) {
      updateData.webhookSecret = webhookSecret;
    }

    // Update active status if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Validate connection if token or repo was updated
    if (updateData.accessToken || updateData.repoOwner || updateData.repoName) {
      const config = {
        repoOwner: updateData.repoOwner || integration.repoOwner,
        repoName: updateData.repoName || integration.repoName,
        accessToken: updateData.accessToken || integration.accessToken
      };

      const isValid = await githubService.validateConnection(config);
      if (!isValid) {
        return res.status(400).json({ 
          message: "Failed to connect to GitHub repository with updated credentials" 
        });
      }
    }

    const updatedIntegration = await storage.updateGitHubConfig(parseInt(id), updateData);

    logger.info(`GitHub integration ${id} updated`);

    res.json({
      success: true,
      integration: updatedIntegration
    });
  } catch (error) {
    logger.error('Failed to update GitHub integration:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

export async function deleteGitHubIntegration(req: any, res: any) {
  try {
    const { id } = req.params;

    const integration = await storage.getGitHubConfigById(parseInt(id));
    if (!integration) {
      return res.status(404).json({ message: 'GitHub integration not found' });
    }

    // Check if user has permission to delete this integration
    const project = await storage.getProject(integration.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Associated project not found' });
    }

    await storage.deleteGitHubConfig(parseInt(id));

    logger.info(`GitHub integration ${id} deleted`);

    res.json({
      success: true,
      message: 'GitHub integration deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete GitHub integration:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

export async function testGitHubConnection(req: Request, res: Response) {
  try {
    const { repoUrl, accessToken } = req.body;

    logger.info('GitHub connection test request:', { 
      repoUrl: repoUrl ? repoUrl.replace(/\/\/.*@/, '//***@') : 'missing', 
      hasToken: !!accessToken,
      tokenLength: accessToken ? accessToken.length : 0
    });

    if (!repoUrl || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Repository URL and access token are required'
      });
    }

    // Extract owner and repo from URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      logger.error('Invalid GitHub URL format:', repoUrl);
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo'
      });
    }

    const [, repoOwner, repoName] = urlMatch;
    const cleanRepoName = repoName.replace(/\.git$/, '');

    logger.info(`Testing GitHub connection for ${repoOwner}/${cleanRepoName}`);

    // Test connection to GitHub API
    try {
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${cleanRepoName}`;
      logger.info('Making request to GitHub API:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'TestCaseTracker',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      logger.info('GitHub API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const repoData = await response.json();
        logger.info('Successfully connected to repository:', {
          name: repoData.name,
          fullName: repoData.full_name,
          private: repoData.private
        });

        return res.json({
          success: true,
          message: 'Connection successful',
          repository: `${repoOwner}/${cleanRepoName}`,
          repoData: {
            name: repoData.name,
            fullName: repoData.full_name,
            private: repoData.private,
            hasIssues: repoData.has_issues
          }
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        logger.error('GitHub API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        let errorMessage = `Failed to connect to repository (${response.status})`;

        if (response.status === 401) {
          errorMessage = 'Invalid access token or token has expired. Please regenerate your token.';
        } else if (response.status === 404) {
          errorMessage = 'Repository not found or you do not have access. Check repository name and token permissions.';
        } else if (response.status === 403) {
          if (errorData.message && errorData.message.includes('rate limit')) {
            errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
          } else {
            errorMessage = 'Access forbidden. Ensure your token has "repo" permissions.';
          }
        }

        return res.status(400).json({
          success: false,
          message: errorMessage,
          details: errorData.message || 'No additional details'
        });
      }
    } catch (networkError) {
      logger.error('GitHub API network error:', networkError);
      return res.status(400).json({
        success: false,
        message: 'Network error connecting to GitHub. Please check your internet connection.',
        details: networkError instanceof Error ? networkError.message : 'Unknown network error'
      });
    }
  } catch (error) {
    logger.error('GitHub connection test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during connection test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}