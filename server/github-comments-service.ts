
import { db } from './db';
import { githubCommentsAudit, bugComments } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from './logger';
import { GitHubService } from './github-service';

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubCommentSyncResult {
  success: boolean;
  message: string;
  syncedComments: number;
  errors: string[];
}

export class GitHubCommentsService {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  /**
   * Sync GitHub comments for a specific bug/issue
   */
  async syncGitHubComments(
    bugId: number, 
    githubIssueNumber: number, 
    githubConfig: any
  ): Promise<GitHubCommentSyncResult> {
    const result: GitHubCommentSyncResult = {
      success: false,
      message: '',
      syncedComments: 0,
      errors: []
    };

    try {
      // Configure GitHub service
      const urlMatch = githubConfig.repoUrl?.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        result.message = 'Invalid GitHub repository URL format';
        return result;
      }

      const [, owner, repo] = urlMatch;
      this.githubService.setConfig({
        owner,
        repo,
        token: githubConfig.accessToken,
      });

      // Fetch GitHub comments
      const githubComments = await this.fetchGitHubComments(githubIssueNumber);

      if (!githubComments || githubComments.length === 0) {
        result.success = true;
        result.message = 'No GitHub comments found to sync';
        return result;
      }

      // Get existing audit records to avoid duplicates
      const existingAuditRecords = await db
        .select()
        .from(githubCommentsAudit)
        .where(
          and(
            eq(githubCommentsAudit.bugId, bugId),
            eq(githubCommentsAudit.githubIssueNumber, githubIssueNumber)
          )
        );

      const existingCommentIds = new Set(
        existingAuditRecords.map(record => record.githubCommentId)
      );

      // Process new comments
      for (const comment of githubComments) {
        try {
          const commentId = comment.id.toString();
          
          if (existingCommentIds.has(commentId)) {
            // Update existing comment if it was modified
            const existingRecord = existingAuditRecords.find(
              record => record.githubCommentId === commentId
            );
            
            if (existingRecord && existingRecord.githubUpdatedAt !== new Date(comment.updated_at)) {
              await this.updateGitHubCommentAudit(existingRecord.id, {
                commentBody: comment.body,
                githubUpdatedAt: new Date(comment.updated_at),
                lastSyncedAt: new Date(),
                syncStatus: 'synced' as const
              });
              result.syncedComments++;
            }
          } else {
            // Insert new comment
            await this.insertGitHubCommentAudit({
              bugId,
              githubIssueNumber,
              githubCommentId: commentId,
              githubCommentUrl: comment.html_url,
              commentBody: comment.body,
              commentAuthor: comment.user.login,
              commentAuthorId: comment.user.id,
              githubCreatedAt: new Date(comment.created_at),
              githubUpdatedAt: new Date(comment.updated_at),
              syncDirection: 'github_to_system',
              syncStatus: 'synced',
              lastSyncedAt: new Date()
            });
            result.syncedComments++;
          }
        } catch (error) {
          const errorMsg = `Failed to sync comment ${comment.id}: ${error.message}`;
          result.errors.push(errorMsg);
          logger.error('GitHub comment sync error:', error);
        }
      }

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Successfully synced ${result.syncedComments} GitHub comments`
        : `Synced ${result.syncedComments} comments with ${result.errors.length} errors`;

      return result;

    } catch (error) {
      logger.error('GitHub comments sync failed:', error);
      result.message = `Failed to sync GitHub comments: ${error.message}`;
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Fetch comments from GitHub API
   */
  private async fetchGitHubComments(issueNumber: number): Promise<GitHubComment[]> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.githubService['config']?.owner}/${this.githubService['config']?.repo}/issues/${issueNumber}/comments`, {
        headers: {
          'Authorization': `Bearer ${this.githubService['config']?.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TestCaseTracker/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch GitHub comments:', error);
      throw error;
    }
  }

  /**
   * Insert new GitHub comment audit record
   */
  async insertGitHubCommentAudit(data: any): Promise<void> {
    try {
      await db.insert(githubCommentsAudit).values(data);
      logger.info('GitHub comment audit record created:', { 
        bugId: data.bugId,
        githubCommentId: data.githubCommentId 
      });
    } catch (error) {
      logger.error('Failed to insert GitHub comment audit:', error);
      throw error;
    }
  }

  /**
   * Update existing GitHub comment audit record
   */
  async updateGitHubCommentAudit(id: number, data: Partial<any>): Promise<void> {
    try {
      await db
        .update(githubCommentsAudit)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(githubCommentsAudit.id, id));
      
      logger.info('GitHub comment audit record updated:', { id });
    } catch (error) {
      logger.error('Failed to update GitHub comment audit:', error);
      throw error;
    }
  }

  /**
   * Get GitHub comments audit records for a bug
   */
  async getGitHubCommentsAudit(bugId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(githubCommentsAudit)
        .where(eq(githubCommentsAudit.bugId, bugId))
        .orderBy(desc(githubCommentsAudit.githubCreatedAt));
    } catch (error) {
      logger.error('Failed to fetch GitHub comments audit:', error);
      throw error;
    }
  }

  /**
   * Delete GitHub comment audit record
   */
  async deleteGitHubCommentAudit(id: number): Promise<void> {
    try {
      await db
        .delete(githubCommentsAudit)
        .where(eq(githubCommentsAudit.id, id));
      
      logger.info('GitHub comment audit record deleted:', { id });
    } catch (error) {
      logger.error('Failed to delete GitHub comment audit:', error);
      throw error;
    }
  }

  /**
   * Mark failed sync attempts
   */
  async markSyncFailed(id: number, errorMessage: string): Promise<void> {
    try {
      await db
        .update(githubCommentsAudit)
        .set({ 
          syncStatus: 'failed',
          errorMessage,
          updatedAt: new Date()
        })
        .where(eq(githubCommentsAudit.id, id));
    } catch (error) {
      logger.error('Failed to mark sync as failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const githubCommentsService = new GitHubCommentsService();
