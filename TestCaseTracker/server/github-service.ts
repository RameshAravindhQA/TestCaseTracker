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
      const response = await this.octokit.rest.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        labels,
      });

      logger.info('GitHub issue created:', {
        number: response.data.number,
        title: response.data.title,
        url: response.data.html_url,
      });

      return {
        success: true,
        message: 'Issue created successfully',
        data: {
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url,
        },
      };

    } catch (error: any) {
      logger.error('Failed to create GitHub issue:', error);

      return {
        success: false,
        message: `Failed to create issue: ${error.message}`,
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