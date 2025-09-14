
import { Router } from 'express';
import { githubCommentsService } from '../github-comments-service';
import { logger } from '../logger';

const router = Router();

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId };
    return next();
  }

  if (req.user && req.user.id) {
    return next();
  }

  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1 };
    return next();
  }

  return res.status(401).json({ message: "Not authenticated" });
};

// Get GitHub comments audit for a specific bug
router.get('/audit/bug/:bugId', requireAuth, async (req, res) => {
  try {
    const { bugId } = req.params;
    
    if (!bugId || isNaN(parseInt(bugId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid bug ID' 
      });
    }

    const auditRecords = await githubCommentsService.getGitHubCommentsAudit(parseInt(bugId));

    res.json({
      success: true,
      data: auditRecords,
      count: auditRecords.length
    });

  } catch (error: any) {
    logger.error('Failed to fetch GitHub comments audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GitHub comments audit',
      error: error.message
    });
  }
});

// Sync GitHub comments for a bug
router.post('/sync/:bugId', requireAuth, async (req, res) => {
  try {
    const { bugId } = req.params;
    const { githubIssueNumber, githubConfig } = req.body;

    if (!bugId || isNaN(parseInt(bugId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid bug ID' 
      });
    }

    if (!githubIssueNumber || !githubConfig) {
      return res.status(400).json({ 
        success: false, 
        message: 'GitHub issue number and config are required' 
      });
    }

    const syncResult = await githubCommentsService.syncGitHubComments(
      parseInt(bugId), 
      githubIssueNumber, 
      githubConfig
    );

    if (syncResult.success) {
      res.json(syncResult);
    } else {
      res.status(400).json(syncResult);
    }

  } catch (error: any) {
    logger.error('Failed to sync GitHub comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync GitHub comments',
      error: error.message
    });
  }
});

// Update GitHub comment audit record
router.put('/audit/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid audit record ID' 
      });
    }

    await githubCommentsService.updateGitHubCommentAudit(parseInt(id), updateData);

    res.json({
      success: true,
      message: 'GitHub comment audit record updated successfully'
    });

  } catch (error: any) {
    logger.error('Failed to update GitHub comment audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GitHub comment audit',
      error: error.message
    });
  }
});

// Delete GitHub comment audit record
router.delete('/audit/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid audit record ID' 
      });
    }

    await githubCommentsService.deleteGitHubCommentAudit(parseInt(id));

    res.json({
      success: true,
      message: 'GitHub comment audit record deleted successfully'
    });

  } catch (error: any) {
    logger.error('Failed to delete GitHub comment audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete GitHub comment audit',
      error: error.message
    });
  }
});

// Manual resync for failed records
router.post('/resync/:bugId', requireAuth, async (req, res) => {
  try {
    const { bugId } = req.params;
    const { githubIssueNumber, githubConfig } = req.body;

    if (!bugId || isNaN(parseInt(bugId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid bug ID' 
      });
    }

    // Get failed sync records
    const auditRecords = await githubCommentsService.getGitHubCommentsAudit(parseInt(bugId));
    const failedRecords = auditRecords.filter(record => record.syncStatus === 'failed');

    if (failedRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No failed records to resync',
        syncedComments: 0
      });
    }

    // Attempt resync
    const syncResult = await githubCommentsService.syncGitHubComments(
      parseInt(bugId), 
      githubIssueNumber || failedRecords[0].githubIssueNumber, 
      githubConfig
    );

    res.json({
      ...syncResult,
      retriedRecords: failedRecords.length
    });

  } catch (error: any) {
    logger.error('Failed to resync GitHub comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resync GitHub comments',
      error: error.message
    });
  }
});

export default router;
