
import { logger } from "../logger";
import { storage } from "../storage";
import { githubService } from "../github-service";
import type { InsertGitHubConfig } from "@shared/github-types";

export async function createGitHubIntegration(req: any, res: any) {
  try {
    const { projectId, repoUrl, accessToken, webhookSecret } = req.body;
    
    if (!projectId || !repoUrl || !accessToken) {
      return res.status(400).json({ 
        message: "Missing required fields: projectId, repoUrl, accessToken" 
      });
    }

    // Parse repository URL to extract owner and name
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return res.status(400).json({ 
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

    const isValid = await githubService.validateConnection(config);
    if (!isValid) {
      return res.status(400).json({ 
        message: "Failed to connect to GitHub repository. Please check your access token and repository URL." 
      });
    }

    // Check if integration already exists for this project
    const existingConfig = await storage.getGitHubConfig(projectId);
    if (existingConfig) {
      return res.status(409).json({ 
        message: "GitHub integration already exists for this project" 
      });
    }

    // Create the integration
    const integrationData: InsertGitHubConfig = {
      projectId,
      repoOwner,
      repoName: cleanRepoName,
      accessToken,
      webhookSecret,
      isActive: true,
      createdById: req.user.id
    };

    const integration = await storage.createGitHubConfig(integrationData);
    
    logger.info(`GitHub integration created for project ${projectId}`);
    
    res.json({
      success: true,
      integration: {
        id: integration.id,
        projectId: integration.projectId,
        repoUrl,
        isEnabled: integration.isActive,
        createdAt: integration.createdAt
      }
    });
  } catch (error) {
    logger.error('Failed to create GitHub integration:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

export async function getGitHubIntegrations(req: any, res: any) {
  try {
    const integrations = await storage.getAllGitHubConfigs(req.user.id);
    
    const enrichedIntegrations = await Promise.all(
      integrations.map(async (integration) => {
        const project = await storage.getProject(integration.projectId);
        
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

export async function testGitHubConnection(req: any, res: any) {
  try {
    const { repoUrl, accessToken } = req.body;

    if (!repoUrl || !accessToken) {
      return res.status(400).json({ 
        message: "Missing required fields: repoUrl, accessToken" 
      });
    }

    // Parse repository URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return res.status(400).json({ 
        message: "Invalid GitHub repository URL format" 
      });
    }

    const [, repoOwner, repoName] = repoMatch;
    const config = {
      repoOwner,
      repoName: repoName.replace(/\.git$/, ''),
      accessToken
    };

    const isValid = await githubService.validateConnection(config);
    
    if (isValid) {
      res.json({
        success: true,
        message: 'Connection successful',
        repository: `${repoOwner}/${repoName.replace(/\.git$/, '')}`
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Connection failed. Please check your access token and repository URL.'
      });
    }
  } catch (error) {
    logger.error('GitHub connection test failed:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
}
