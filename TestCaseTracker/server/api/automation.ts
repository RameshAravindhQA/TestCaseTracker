
import { Router } from 'express';
import { automationService } from '../automation-service';
import { logger } from '../logger';
import { requireAuth } from '../auth-middleware';

const router = Router();

// Start recording
router.post('/start-recording', requireAuth, async (req, res) => {
  try {
    const { url, projectId, moduleId, testCaseId } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required' 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. Please provide a valid URL (e.g., https://example.com)',
      });
    }

    logger.info('Starting recording request:', {
      url,
      projectId,
      moduleId,
      testCaseId,
      userId: req.session.userId,
    });

    const result = await automationService.startRecording({
      url,
      projectId,
      moduleId,
      testCaseId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    logger.error('Failed to start recording:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while starting recording',
      error: error.message,
    });
  }
});

// Stop recording
router.post('/stop-recording', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    logger.info('Stopping recording request:', {
      sessionId,
      userId: req.session.userId,
    });

    const result = await automationService.stopRecording(sessionId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    logger.error('Failed to stop recording:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while stopping recording',
      error: error.message,
    });
  }
});

// Execute test
router.post('/execute-test', requireAuth, async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
    }

    logger.info('Test execution request:', {
      filename,
      userId: req.session.userId,
    });

    const result = await automationService.executeTest(filename);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    logger.error('Failed to execute test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while executing test',
      error: error.message,
    });
  }
});

// Get session status
router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = automationService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        filename: session.filename,
        startTime: session.startTime,
        endTime: session.endTime,
        url: session.url,
      },
    });

  } catch (error: any) {
    logger.error('Failed to get session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting session',
      error: error.message,
    });
  }
});

// Get execution status
router.get('/execution/:executionId', requireAuth, async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = automationService.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: execution.id,
        status: execution.status,
        filename: execution.filename,
        startTime: execution.startTime,
        endTime: execution.endTime,
        results: execution.results,
        report: execution.report,
      },
    });

  } catch (error: any) {
    logger.error('Failed to get execution:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting execution',
      error: error.message,
    });
  }
});

// Get recordings list
router.get('/recordings', requireAuth, async (req, res) => {
  try {
    const recordings = await automationService.getRecordings();
    
    res.json({
      success: true,
      data: recordings.map(filename => ({
        filename,
        created: new Date(), // In a real app, you'd get this from file stats
      })),
    });

  } catch (error: any) {
    logger.error('Failed to get recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting recordings',
      error: error.message,
    });
  }
});

// Get recording content
router.get('/recording/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const content = await automationService.getRecordingContent(filename);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    res.json({
      success: true,
      data: {
        filename,
        content,
      },
    });

  } catch (error: any) {
    logger.error('Failed to get recording content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting recording content',
      error: error.message,
    });
  }
});

// Get scripts (alias for recordings)
router.get('/scripts', requireAuth, async (req, res) => {
  try {
    const recordings = await automationService.getRecordings();
    
    res.json({
      success: true,
      data: recordings.map(filename => ({
        id: filename,
        name: filename.replace('.spec.ts', ''),
        filename,
        status: 'ready',
        created: new Date(),
      })),
    });

  } catch (error: any) {
    logger.error('Failed to get scripts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting scripts',
      error: error.message,
    });
  }
});

export default router;
