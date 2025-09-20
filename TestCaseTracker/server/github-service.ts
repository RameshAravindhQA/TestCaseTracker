import { Octokit } from "@octokit/rest";
import { logger } from './logger';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  webhookSecret?: string;
}

export interface GitHubIntegration {
  id: number;
  projectId: number;
  projectName: string;
  githubUsername: string;
  repositoryName: string;
  personalAccessToken: string;
  webhookSecret?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  constructor(config?: GitHubConfig) {
    if (config) {
      this.setConfig(config);
    }
  }

  setConfig(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
      userAgent: 'TestCaseTracker/1.0.0',
      baseUrl: 'https://api.github.com',
      request: {
        timeout: 10000,
      },
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.octokit || !this.config) {
      return {
        success: false,
        message: 'GitHub client not configured. Please provide valid credentials.',
      };
    }

    try {
      logger.info('Testing GitHub connection...', {
        owner: this.config.owner,
        repo: this.config.repo,
      });

      // Test 1: Verify token by getting user info
      const userResponse = await this.octokit.rest.users.getAuthenticated();
      const user = userResponse.data;

      logger.info('GitHub user authenticated:', {
        login: user.login,
        name: user.name,
        type: user.type,
      });

      // Test 2: Check if repository exists and is accessible
      const repoResponse = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      const repo = repoResponse.data;

      logger.info('GitHub repository accessible:', {
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        permissions: repo.permissions,
      });

      // Test 3: Check if we can create issues (requires appropriate permissions)
      const hasIssuesPermission = repo.permissions?.admin || repo.permissions?.push || repo.permissions?.maintain;

      if (!hasIssuesPermission) {
        return {
          success: false,
          message: 'Token does not have sufficient permissions to create issues. Please ensure the token has "repo" or "public_repo" scope.',
          data: {
            user: user.login,
            repo: repo.full_name,
            permissions: repo.permissions,
          },
        };
      }

      return {
        success: true,
        message: 'GitHub connection successful! Repository is accessible and token has required permissions.',
        data: {
          user: user.login,
          repo: repo.full_name,
          permissions: repo.permissions,
          hasIssues: repo.has_issues,
        },
      };

    } catch (error: any) {
      logger.error('GitHub connection test failed:', error);

      if (error.status === 401) {
        return {
          success: false,
          message: 'Invalid GitHub token. Please check your Personal Access Token and ensure it has the correct permissions.',
        };
      }

      if (error.status === 403) {
        return {
          success: false,
          message: 'Access forbidden. Your token may have expired or lacks required permissions. Please generate a new token with "repo" scope.',
        };
      }

      if (error.status === 404) {
        return {
          success: false,
          message: 'Repository not found. Please check the owner/repository name or ensure the repository exists and is accessible.',
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.',
        };
      }

      return {
        success: false,
        message: `GitHub API Error: ${error.message || 'Unknown error occurred'}`,
      };
    }
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.octokit || !this.config) {
      logger.error('GitHub client not configured');
      return {
        success: false,
        message: 'GitHub client not configured. Please set up GitHub integration first.',
      };
    }

    try {
      logger.info('Creating GitHub issue:', {
        title: title.substring(0, 50) + '...',
        bodyLength: body.length,
        labels: labels || [],
        owner: this.config.owner,
        repo: this.config.repo
      });

      // Create labels if they don't exist
      if (labels && labels.length > 0) {
        logger.info('Ensuring labels exist:', labels);
        await this.ensureLabelsExist(labels);
        logger.info('Labels ensured, now creating issue...');
      }

      // Create the issue with labels
      const response = await this.octokit.rest.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        labels: labels || [],
      });

      logger.info('GitHub issue created successfully:', {
        number: response.data.number,
        url: response.data.html_url,
        labelsCount: response.data.labels?.length || 0
      });

      // If labels were provided but not attached, try to add them manually
      if (labels && labels.length > 0) {
        try {
          await this.octokit.rest.issues.addLabels({
            owner: this.config.owner,
            repo: this.config.repo,
            issue_number: response.data.number,
            labels: labels,
          });
          logger.info('Labels added manually to issue:', labels);
        } catch (labelError: any) {
          logger.warn('Failed to add labels manually:', labelError.message);
        }
      }

      return {
        success: true,
        message: 'Bug pushed to GitHub successfully',
        data: {
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url,
          labels: response.data.labels?.map(l => typeof l === 'string' ? l : l.name) || labels || [],
        },
      };

    } catch (error: any) {
      logger.error('Failed to create GitHub issue:', {
        error: error.message,
        status: error.status,
        response: error.response?.data
      });

      if (error.status === 401) {
        return {
          success: false,
          message: 'GitHub authentication failed. Please check your access token.',
        };
      }

      if (error.status === 403) {
        return {
          success: false,
          message: 'Permission denied. Your GitHub token may not have permission to create issues in this repository.',
        };
      }

      if (error.status === 404) {
        return {
          success: false,
          message: 'Repository not found. Please check the repository name and your access permissions.',
        };
      }

      if (error.status === 422) {
        return {
          success: false,
          message: 'Validation failed. Please check that the repository allows issue creation and all required fields are valid.',
        };
      }

      return {
        success: false,
        message: `Failed to push bug to GitHub: ${error.message}`,
      };
    }
  }

  async ensureLabelsExist(labelNames: string[]): Promise<void> {
    if (!this.octokit || !this.config) return;

    try {
      console.log('Ensuring labels exist:', labelNames);
      
      // Get existing labels
      const existingLabels = await this.octokit.rest.issues.listLabelsForRepo({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      const existingLabelNames = existingLabels.data.map(label => label.name.toLowerCase());
      console.log('Existing labels:', existingLabelNames);

      // Create missing labels
      for (const labelName of labelNames) {
        if (!existingLabelNames.includes(labelName.toLowerCase())) {
          try {
            const createdLabel = await this.octokit.rest.issues.createLabel({
              owner: this.config.owner,
              repo: this.config.repo,
              name: labelName,
              color: this.getLabelColor(labelName),
              description: `Auto-created label from Test Case Tracker`,
            });
            console.log(`Created GitHub label: ${labelName}`, createdLabel.data);
            logger.info(`Created GitHub label: ${labelName}`);
          } catch (labelError: any) {
            console.warn(`Failed to create label ${labelName}:`, labelError);
            logger.warn(`Failed to create label ${labelName}:`, labelError.message);
          }
        } else {
          console.log(`Label already exists: ${labelName}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to ensure labels exist:', error);
      logger.warn('Failed to ensure labels exist:', error.message);
    }
  }

  private getLabelColor(labelName: string): string {
    // Generate colors based on label names for consistency
    const colors = {
      'critical': 'ff0000',
      'major': 'ff6600', 
      'minor': 'ffcc00',
      'trivial': '99ff99',
      'high': 'ff3333',
      'medium': 'ffaa33',
      'low': '33ff33',
      'bug': 'd73a4a',
      'enhancement': 'a2eeef',
      'documentation': '0075ca',
      'duplicate': 'cfd3d7',
      'good first issue': '7057ff',
      'help wanted': '008672',
      'invalid': 'e4e669',
      'question': 'd876e3',
      'wontfix': 'ffffff',
      'ui/ux': '3b82f6',
      'api': '22c55e',
      'performance': 'f97316',
      'security': 'ef4444',
      'data': '8b5cf6',
      'integration': 'ec4899',
      'severity: critical': 'dc2626',
      'severity: high': 'ea580c',
      'severity: medium': 'f59e0b',
      'severity: low': '84cc16',
      'priority: critical': 'dc2626',
      'priority: high': 'ea580c',
      'priority: medium': 'f59e0b',
      'priority: low': '84cc16'
    };

    const lowerName = labelName.toLowerCase();
    if (colors[lowerName as keyof typeof colors]) {
      return colors[lowerName as keyof typeof colors];
    }

    // Check for partial matches
    for (const [key, color] of Object.entries(colors)) {
      if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
        return color;
      }
    }

    // Generate a color based on the label name hash
    let hash = 0;
    for (let i = 0; i < labelName.length; i++) {
      hash = labelName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = Math.abs(hash).toString(16).substring(0, 6).padEnd(6, '0');
    return color;
  }

  async uploadImageToGitHub(filePath: string, fileName: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.octokit || !this.config) {
      return {
        success: false,
        message: 'GitHub client not configured',
      };
    }

    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: 'File not found',
        };
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');

      // Create a unique path in the repository
      const timestamp = Date.now();
      const repoPath = `uploads/bug-attachments/${timestamp}-${fileName}`;

      // Get repository info to use the default branch
      const repoInfo = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      const defaultBranch = repoInfo.data.default_branch || 'main';

      // Upload file to GitHub repository
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: repoPath,
        message: `Upload bug attachment: ${fileName}`,
        content: base64Content,
        branch: defaultBranch,
      });

      // Get the raw URL for the uploaded file using the default branch
      const rawUrl = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${defaultBranch}/${repoPath}`;
      const githubUrl = `https://github.com/${this.config.owner}/${this.config.repo}/blob/${defaultBranch}/${repoPath}`;

      logger.info('File uploaded to GitHub:', {
        fileName,
        repoPath,
        githubUrl,
        rawUrl
      });

      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          githubUrl,
          rawUrl,
          repoPath,
          sha: response.data.content?.sha
        },
      };

    } catch (error: any) {
      logger.error('Failed to upload file to GitHub:', error);
      return {
        success: false,
        message: `Failed to upload file: ${error.message}`,
      };
    }
  }

  async addCommentToIssue(issueNumber: number, comment: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.octokit || !this.config) {
      return {
        success: false,
        message: 'GitHub client not configured',
      };
    }

    try {
      const response = await this.octokit.rest.issues.createComment({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
        body: comment,
      });

      return {
        success: true,
        message: 'Comment added successfully',
        data: {
          id: response.data.id,
          url: response.data.html_url,
        },
      };

    } catch (error: any) {
      logger.error('Failed to add GitHub comment:', error);
      return {
        success: false,
        message: `Failed to add comment: ${error.message}`,
      };
    }
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: any; scopes?: string[] }> {
    try {
      const tempOctokit = new Octokit({
        auth: token,
        userAgent: 'TestCaseTracker/1.0.0',
      });

      const response = await tempOctokit.rest.users.getAuthenticated();
      const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];

      return {
        valid: true,
        user: response.data,
        scopes,
      };

    } catch (error: any) {
      logger.error('Token validation failed:', error);
      return {
        valid: false,
      };
    }
  }

  async getRepository(owner: string, repo: string): Promise<{ success: boolean; data?: any; message?: string }> {
    if (!this.octokit) {
      return {
        success: false,
        message: 'GitHub client not configured',
      };
    }

    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        success: true,
        data: response.data,
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

// Helper functions for GitHub integration
export async function createGitHubIssue(title: string, body: string, labels?: string[], githubConfig?: any): Promise<{ success: boolean; message: string; data?: any }> {
  if (!githubConfig) {
    return {
      success: false,
      message: 'GitHub configuration not provided',
    };
  }

  const service = new GitHubService({
    owner: githubConfig.githubUsername,
    repo: githubConfig.repositoryName,
    token: githubConfig.personalAccessToken,
  });

  return await service.createIssue(title, body, labels);
}

export async function addCommentToIssue(issueNumber: number, comment: string, githubConfig?: any): Promise<{ success: boolean; message: string; data?: any }> {
  if (!githubConfig) {
    return {
      success: false,
      message: 'GitHub configuration not provided',
    };
  }

  const service = new GitHubService({
    owner: githubConfig.githubUsername,
    repo: githubConfig.repositoryName,
    token: githubConfig.personalAccessToken,
  });

  return await service.addCommentToIssue(issueNumber, comment);
}

export async function syncBugComments(bugId: number, githubIssueNumber: number, githubConfig?: any): Promise<any[]> {
  // This function would sync comments from bug system to GitHub
  // For now, return empty array as placeholder
  console.log(`Syncing bug ${bugId} comments to GitHub issue ${githubIssueNumber}`);
  return [];
}

export async function syncGitHubComments(githubIssueNumber: number, bugId: number, githubConfig?: any): Promise<any[]> {
  if (!githubConfig) {
    console.warn('GitHub configuration not provided for syncing comments');
    return [];
  }

  try {
    // Fetch GitHub comments
    const response = await fetch(`https://api.github.com/repos/${githubConfig.githubUsername}/${githubConfig.repositoryName}/issues/${githubIssueNumber}/comments`, {
      headers: {
        'Authorization': `Bearer ${githubConfig.personalAccessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TestCaseTracker/1.0.0'
      }
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const githubComments = await response.json();
    console.log(`Fetched ${githubComments.length} comments from GitHub issue ${githubIssueNumber}`);
    
    return githubComments;
  } catch (error: any) {
    console.error('Failed to sync GitHub comments:', error);
    return [];
  }
}

// Singleton instance
export const githubService = new GitHubService();