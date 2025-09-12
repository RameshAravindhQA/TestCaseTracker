
export interface GitHubConfig {
  id: number;
  projectId: number;
  repoOwner: string;
  repoName: string;
  accessToken: string;
  webhookSecret?: string;
  isActive: boolean;
  createdById: number;
  createdAt: string;
  updatedAt?: string;
}

export interface InsertGitHubConfig {
  projectId: number;
  repoOwner: string;
  repoName: string;
  accessToken: string;
  webhookSecret?: string;
  isActive?: boolean;
  createdById: number;
}

export interface GitHubIssue {
  id: number;
  bugId: number;
  githubIssueNumber: number;
  githubIssueId: number;
  githubUrl: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export interface InsertGitHubIssue {
  bugId: number;
  githubIssueNumber: number;
  githubIssueId: number;
  githubUrl: string;
  status: 'open' | 'closed';
}

export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}
