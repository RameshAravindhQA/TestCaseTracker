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
}

export const githubService = new GitHubService();