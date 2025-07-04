import { logger } from "./logger";
import { storage } from "./storage";
import type { GitHubConfig, GitHubIssuePayload, InsertGitHubIssue } from "@shared/github-types";

export class GitHubService {
  private async makeGitHubRequest(
    config: GitHubConfig,
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: any
  ) {
    const url = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'TestCaseTracker-App'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`GitHub API request failed for ${url}:`, error);
      throw error;
    }
  }

  async createIssue(config: GitHubConfig, payload: GitHubIssuePayload) {
    logger.info(`Creating GitHub issue in ${config.repoOwner}/${config.repoName}`);

    const issueData = {
      title: payload.title,
      body: payload.body,
      labels: payload.labels || [],
      assignees: payload.assignees || []
    };

    const response = await this.makeGitHubRequest(config, '/issues', 'POST', issueData);

    logger.info(`Created GitHub issue #${response.number}: ${response.html_url}`);

    return {
      number: response.number,
      id: response.id,
      url: response.html_url,
      state: response.state
    };
  }

  async updateIssue(config: GitHubConfig, issueNumber: number, updates: Partial<GitHubIssuePayload>) {
    logger.info(`Updating GitHub issue #${issueNumber} in ${config.repoOwner}/${config.repoName}`);

    const response = await this.makeGitHubRequest(
      config, 
      `/issues/${issueNumber}`, 
      'PATCH', 
      updates
    );

    return {
      number: response.number,
      id: response.id,
      url: response.html_url,
      state: response.state
    };
  }

  async closeIssue(config: GitHubConfig, issueNumber: number) {
    return this.updateIssue(config, issueNumber, { 
      body: 'This issue has been resolved and closed from TestCaseTracker.' 
    });
  }

  async getIssue(config: GitHubConfig, issueNumber: number) {
    logger.info(`Fetching GitHub issue #${issueNumber} from ${config.repoOwner}/${config.repoName}`);

    const response = await this.makeGitHubRequest(config, `/issues/${issueNumber}`);

    return {
      number: response.number,
      id: response.id,
      title: response.title,
      body: response.body,
      state: response.state,
      url: response.html_url,
      labels: response.labels.map((label: any) => label.name),
      assignees: response.assignees.map((assignee: any) => assignee.login)
    };
  }

  async getAllIssues(config: GitHubConfig) {
    logger.info(`Fetching all GitHub issues from ${config.repoOwner}/${config.repoName}`);

    // Get all issues (GitHub API returns both issues and pull requests, but we filter for issues only)
    const response = await this.makeGitHubRequest(config, '/issues?state=all&per_page=100');

    // Filter out pull requests (they have a pull_request property)
    const issues = response.filter((item: any) => !item.pull_request);

    return issues.map((issue: any) => ({
      number: issue.number,
      id: issue.id,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      url: issue.html_url,
      labels: issue.labels.map((label: any) => label.name),
      assignees: issue.assignees.map((assignee: any) => assignee.login)
    }));
  }

  async getIssueComments(config: GitHubConfig, issueNumber: number) {
    logger.info(`Fetching comments for GitHub issue #${issueNumber}`);

    const response = await this.makeGitHubRequest(config, `/issues/${issueNumber}/comments`);

    return response.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      user: {
        login: comment.user.login,
        avatar_url: comment.user.avatar_url
      },
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      html_url: comment.html_url
    }));
  }

  async createComment(config: GitHubConfig, issueNumber: number, commentData: { body: string }) {
    logger.info(`Creating comment on GitHub issue #${issueNumber}`);

    const response = await this.makeGitHubRequest(
      config, 
      `/issues/${issueNumber}/comments`, 
      'POST', 
      commentData
    );

    return {
      id: response.id,
      html_url: response.html_url,
      body: response.body
    };
  }

  formatBugAsGitHubIssue(bug: any): GitHubIssuePayload {
    const severity = bug.severity || 'Medium';
    const priority = bug.priority || 'Medium';

    let labels = [`bug`, `severity:${severity.toLowerCase()}`, `priority:${priority.toLowerCase()}`];

    if (bug.tags && Array.isArray(bug.tags)) {
      labels = labels.concat(bug.tags.map((tag: any) => 
        typeof tag === 'string' ? tag : tag.name
      ));
    }

    const body = `
## Bug Report from TestCaseTracker

**Bug ID:** ${bug.bugId}
**Severity:** ${severity}
**Priority:** ${priority}
**Status:** ${bug.status}
**Environment:** ${bug.environment || 'Not specified'}

### Description
${bug.description || 'No description provided.'}

### Steps to Reproduce
${bug.stepsToReproduce || 'No steps provided.'}

### Expected Result
${bug.expectedResult || 'No expected result provided.'}

### Actual Result
${bug.actualResult || 'No actual result provided.'}

### Pre-Conditions
${bug.preConditions || 'No pre-conditions provided.'}

### Additional Comments
${bug.comments || 'No additional comments.'}

---
*This issue was automatically created from TestCaseTracker Bug ${bug.bugId}*
    `.trim();

    return {
      title: `[${bug.bugId}] ${bug.title}`,
      body,
      labels: labels.filter(Boolean)
    };
  }

  async validateConnection(config: GitHubConfig): Promise<boolean> {
    try {
      await this.makeGitHubRequest(config, '');
      return true;
    } catch (error) {
      logger.error(`GitHub connection validation failed:`, error);
      return false;
    }
  }

  async syncIssueStatus(config: GitHubConfig, issueNumber: number, bugId: number) {
    logger.info(`Syncing GitHub issue #${issueNumber} status with bug ${bugId}`);

    try {
      // First verify the bug exists
      const bug = await storage.getBug(bugId);
      if (!bug) {
        throw new Error(`Bug ${bugId} not found`);
      }

      const githubIssue = await this.getIssue(config, issueNumber);

      // Map GitHub status to TestCaseTracker status
      let bugStatus = 'Open';
      if (githubIssue.state === 'closed') {
        bugStatus = 'Resolved';
      } else if (githubIssue.state === 'open') {
        // Check labels to determine if it's in progress
        if (githubIssue.labels.includes('in-progress') || githubIssue.labels.includes('in progress')) {
          bugStatus = 'In Progress';
        } else {
          bugStatus = 'Open';
        }
      }

      // Update the bug status if it's different
      if (bug.status !== bugStatus) {
        await storage.updateBug(bugId, { status: bugStatus });
      }

      return {
        githubStatus: githubIssue.state,
        bugStatus: bugStatus,
        newStatus: bug.status !== bugStatus ? bugStatus : null,
        previousStatus: bug.status,
        needsUpdate: bug.status !== bugStatus
      };
    } catch (error) {
      logger.error(`Failed to sync issue status for #${issueNumber}:`, error);
      throw error;
    }
  }

  async syncFromGitHubToSystem(owner: string, repo: string, token: string, projectId: number) {
    logger.info(`Syncing from GitHub ${owner}/${repo} to system for project ${projectId}`);

    try {
      const config = {
        repoOwner: owner,
        repoName: repo,
        accessToken: token
      };

      // Get all GitHub issues
      const githubIssues = await this.getAllIssues(config);
      
      let syncResults = {
        totalIssues: githubIssues.length,
        updatedBugs: 0,
        createdBugs: 0,
        errors: [] as string[]
      };

      for (const githubIssue of githubIssues) {
        try {
          // Check if we have a bug linked to this GitHub issue
          const existingGitHubIssue = await storage.getGitHubIssueByGitHubId(githubIssue.id);
          
          if (existingGitHubIssue) {
            // Update existing bug
            const bug = await storage.getBug(existingGitHubIssue.bugId);
            if (bug) {
              // Map GitHub status to TestCaseTracker status
              let bugStatus = 'Open';
              if (githubIssue.state === 'closed') {
                bugStatus = 'Resolved';
              } else if (githubIssue.state === 'open') {
                if (githubIssue.labels.includes('in-progress') || githubIssue.labels.includes('in progress')) {
                  bugStatus = 'In Progress';
                } else {
                  bugStatus = 'Open';
                }
              }

              // Extract title and description from GitHub issue
              const title = githubIssue.title.replace(/^\[.*?\]\s*/, ''); // Remove bug ID prefix if exists
              const description = this.extractDescriptionFromGitHubBody(githubIssue.body);

              // Update bug with GitHub data
              await storage.updateBug(existingGitHubIssue.bugId, {
                title: title,
                description: description,
                status: bugStatus
              });

              // Update GitHub issue record
              await storage.updateGitHubIssue(existingGitHubIssue.id, {
                status: githubIssue.state
              });

              syncResults.updatedBugs++;
              logger.info(`Updated bug ${bug.bugId} from GitHub issue #${githubIssue.number}`);
            }
          } else {
            // Create new bug from GitHub issue if it doesn't exist
            const title = githubIssue.title.replace(/^\[.*?\]\s*/, '');
            const description = this.extractDescriptionFromGitHubBody(githubIssue.body);
            
            let bugStatus = 'Open';
            if (githubIssue.state === 'closed') {
              bugStatus = 'Resolved';
            } else if (githubIssue.state === 'open') {
              if (githubIssue.labels.includes('in-progress') || githubIssue.labels.includes('in progress')) {
                bugStatus = 'In Progress';
              } else {
                bugStatus = 'Open';
              }
            }

            // Determine severity and priority from labels
            let severity = 'Medium';
            let priority = 'Medium';
            
            for (const label of githubIssue.labels) {
              if (label.startsWith('severity:')) {
                severity = label.split(':')[1].charAt(0).toUpperCase() + label.split(':')[1].slice(1);
              }
              if (label.startsWith('priority:')) {
                priority = label.split(':')[1].charAt(0).toUpperCase() + label.split(':')[1].slice(1);
              }
            }

            // Create new bug
            const newBug = await storage.createBug({
              title: title,
              description: description,
              status: bugStatus,
              severity: severity,
              priority: priority,
              projectId: projectId,
              reportedById: 1, // Default to admin user
              environment: 'GitHub Import',
              stepsToReproduce: '',
              expectedResult: '',
              actualResult: '',
              attachments: []
            });

            // Create GitHub issue link
            await storage.createGitHubIssue({
              bugId: newBug.id,
              githubIssueNumber: githubIssue.number,
              githubIssueId: githubIssue.id,
              githubUrl: githubIssue.url,
              status: githubIssue.state as 'open' | 'closed'
            });

            syncResults.createdBugs++;
            logger.info(`Created new bug ${newBug.bugId} from GitHub issue #${githubIssue.number}`);
          }
        } catch (error) {
          const errorMsg = `Error syncing GitHub issue #${githubIssue.number}: ${error.message}`;
          syncResults.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`GitHub sync completed: ${syncResults.updatedBugs} updated, ${syncResults.createdBugs} created, ${syncResults.errors.length} errors`);
      return syncResults;
    } catch (error) {
      logger.error(`Failed to sync from GitHub to system:`, error);
      throw error;
    }
  }

  private extractDescriptionFromGitHubBody(body: string): string {
    if (!body) return '';

    // Try to extract the description section from formatted bug report
    const descriptionMatch = body.match(/### Description\s*\n(.*?)(?=\n###|\n---|\n\*|$)/s);
    if (descriptionMatch) {
      return descriptionMatch[1].trim();
    }

    // If no formatted description found, return the first paragraph
    const lines = body.split('\n');
    const firstParagraph = [];
    
    for (const line of lines) {
      if (line.trim() === '' && firstParagraph.length > 0) break;
      if (!line.startsWith('#') && !line.startsWith('**') && !line.startsWith('---')) {
        firstParagraph.push(line.trim());
      }
    }

    return firstParagraph.join(' ').trim() || body.substring(0, 200) + '...';
  }

  async syncBugToGitHub(bugId: number): Promise<{ created: boolean; issueNumber?: number; url?: string }> {
    try {
      const bug = await storage.getBug(bugId);
      if (!bug) {
        console.warn(`Bug with ID ${bugId} not found, skipping sync`);
        return { created: false };
      }

      const project = await storage.getProject(bug.projectId);
      if (!project) {
        console.warn(`Project with ID ${bug.projectId} not found, skipping sync`);
        return { created: false };
      }

      const config = await storage.getGitHubConfig(project.id);
      if (!config || !config.isActive) {
        console.warn(`GitHub configuration not found or inactive for project ${project.id}, skipping sync`);
        return { created: false };
      }

      // Check if bug already has a GitHub issue
      const existingIssue = await storage.getGitHubIssueByBugId(bugId);
      if (existingIssue) {
        logger.info(`Bug ${bugId} already has GitHub issue #${existingIssue.githubIssueNumber}`);
        return { created: false, issueNumber: existingIssue.githubIssueNumber, url: existingIssue.githubUrl };
      }

      // Create GitHub issue
      const issuePayload = this.formatBugAsGitHubIssue(bug);
      const githubIssue = await this.createIssue(config, issuePayload);

      // Store GitHub issue in database
      await storage.createGitHubIssue({
        bugId: bug.id,
        githubIssueNumber: githubIssue.number,
        githubIssueId: githubIssue.id,
        githubUrl: githubIssue.url,
        status: githubIssue.state as 'open' | 'closed'
      });

      logger.info(`Created GitHub issue #${githubIssue.number} for bug ${bugId}`);
      return { created: true, issueNumber: githubIssue.number, url: githubIssue.url };
    } catch (error) {
      console.error(`Error syncing bug ${bugId} to GitHub:`, error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();