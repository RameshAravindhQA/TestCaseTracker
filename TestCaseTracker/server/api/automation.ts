
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

interface RecordingSession {
  id: string;
  process?: any;
  projectId?: string;
  moduleId?: string;
  testCaseId?: string;
  url: string;
  filename: string;
  status: 'starting' | 'recording' | 'stopped' | 'error';
  startTime: Date;
}

const activeSessions = new Map<string, RecordingSession>();

// Start recording
router.post('/start-recording', async (req, res) => {
  try {
    const { url, projectId, moduleId, testCaseId } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const sessionId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `project-${projectId || 'unknown'}-module-${moduleId || 'unknown'}-${timestamp}.spec.ts`;
    const outputPath = path.join(process.cwd(), 'recordings', filename);

    // Ensure recordings directory exists
    await fs.mkdir(path.join(process.cwd(), 'recordings'), { recursive: true });

    const session: RecordingSession = {
      id: sessionId,
      projectId,
      moduleId,
      testCaseId,
      url,
      filename,
      status: 'starting',
      startTime: new Date()
    };

    activeSessions.set(sessionId, session);

    // Start Playwright codegen
    const playwrightProcess = spawn('npx', [
      'playwright',
      'codegen',
      url,
      '--output',
      outputPath
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, DISPLAY: ':0' } // For headless environments
    });

    session.process = playwrightProcess;
    session.status = 'recording';

    playwrightProcess.stdout?.on('data', (data) => {
      console.log(`Recording ${sessionId}: ${data}`);
    });

    playwrightProcess.stderr?.on('data', (data) => {
      console.error(`Recording ${sessionId} error: ${data}`);
    });

    playwrightProcess.on('close', (code) => {
      console.log(`Recording ${sessionId} finished with code ${code}`);
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)!;
        session.status = code === 0 ? 'stopped' : 'error';
      }
    });

    playwrightProcess.on('error', (error) => {
      console.error(`Recording ${sessionId} failed to start:`, error);
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId)!;
        session.status = 'error';
      }
    });

    res.json({
      success: true,
      sessionId,
      message: 'Recording started successfully',
      filename
    });

  } catch (error) {
    console.error('Failed to start recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording: ' + error.message
    });
  }
});

// Stop recording
router.post('/stop-recording', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || !activeSessions.has(sessionId)) {
      return res.status(404).json({ error: 'Recording session not found' });
    }

    const session = activeSessions.get(sessionId)!;
    
    if (session.process && session.status === 'recording') {
      session.process.kill('SIGTERM');
      session.status = 'stopped';
      
      // Wait a bit for the process to finish writing the file
      setTimeout(async () => {
        try {
          const outputPath = path.join(process.cwd(), 'recordings', session.filename);
          const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
          
          res.json({
            success: true,
            message: 'Recording stopped successfully',
            filename: session.filename,
            fileExists
          });
        } catch (error) {
          res.json({
            success: true,
            message: 'Recording stopped but file check failed',
            filename: session.filename,
            fileExists: false
          });
        }
        
        activeSessions.delete(sessionId);
      }, 2000);
    } else {
      res.status(400).json({ error: 'Recording is not active' });
    }

  } catch (error) {
    console.error('Failed to stop recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording: ' + error.message
    });
  }
});

// Get recording status
router.get('/recording-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!activeSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Recording session not found' });
  }

  const session = activeSessions.get(sessionId)!;
  
  res.json({
    sessionId: session.id,
    status: session.status,
    filename: session.filename,
    startTime: session.startTime,
    projectId: session.projectId,
    moduleId: session.moduleId,
    testCaseId: session.testCaseId
  });
});

// List all recordings
router.get('/recordings', async (req, res) => {
  try {
    const recordingsDir = path.join(process.cwd(), 'recordings');
    
    try {
      const files = await fs.readdir(recordingsDir);
      const recordings = await Promise.all(
        files
          .filter(file => file.endsWith('.spec.ts'))
          .map(async (file) => {
            const filePath = path.join(recordingsDir, file);
            const stats = await fs.stat(filePath);
            return {
              filename: file,
              createdAt: stats.birthtime,
              size: stats.size
            };
          })
      );
      
      res.json(recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      // Directory doesn't exist or is empty
      res.json([]);
    }
  } catch (error) {
    console.error('Failed to list recordings:', error);
    res.status(500).json({ error: 'Failed to list recordings' });
  }
});

// Get recording file content
router.get('/recordings/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'recordings', filename);
    
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ filename, content });
  } catch (error) {
    console.error('Failed to read recording file:', error);
    res.status(404).json({ error: 'Recording file not found' });
  }
});

export default router;
