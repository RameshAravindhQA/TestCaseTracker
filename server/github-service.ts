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
      return {
        success: false,
        message: 'GitHub client not configured',
      };
    }

    try {
      // Create labels if they don't exist
      if (labels && labels.length > 0) {
        await this.ensureLabelsExist(labels);
      }

      const response = await this.octokit.rest.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        labels: labels || [],
      });

      logger.info('GitHub issue created:', {
        number: response.data.number,
        title: response.data.title,
        url: response.data.html_url,
        labels: response.data.labels?.map(l => typeof l === 'string' ? l : l.name),
      });

      return {
        success: true,
        message: 'Issue created successfully',
        data: {
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url,
          labels: response.data.labels?.map(l => typeof l === 'string' ? l : l.name) || [],
        },
      };

    } catch (error: any) {
      logger.error('Failed to create GitHub issue:', error);

      if (error.status === 422) {
        return {
          success: false,
          message: 'Validation failed: Please check that the repository allows issue creation and all required fields are valid.',
        };
      }

      if (error.status === 403) {
        return {
          success: false,
          message: 'Permission denied: Your GitHub token may not have permission to create issues in this repository.',
        };
      }

      return {
        success: false,
        message: `Failed to create issue: ${error.message}`,
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

// Singleton instance
export const githubService = new GitHubService();