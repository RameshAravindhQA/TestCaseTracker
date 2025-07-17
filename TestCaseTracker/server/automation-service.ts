import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

export interface RecordingSession {
  id: string;
  projectId?: string;
  moduleId?: string;
  testCaseId?: string;
  url: string;
  filename: string;
  status: 'starting' | 'recording' | 'stopped' | 'error';
  startTime: Date;
  endTime?: Date;
  process?: ChildProcess;
  outputPath?: string;
}

export interface TestExecution {
  id: string;
  sessionId: string;
  filename: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results?: any;
  report?: string;
  process?: ChildProcess;
}

export class AutomationService {
  private activeSessions = new Map<string, RecordingSession>();
  private activeExecutions = new Map<string, TestExecution>();
  private recordingsDir = path.join(process.cwd(), 'recordings');
  private recordings: Map<string, any> = new Map();
  private scripts: Map<string, any> = new Map();

  constructor() {
    this.ensureRecordingsDirectory();
  }

  private async ensureRecordingsDirectory() {
    try {
      await fs.mkdir(this.recordingsDir, { recursive: true });
      logger.info('Recordings directory ensured:', this.recordingsDir);
    } catch (error) {
      logger.error('Failed to create recordings directory:', error);
    }
  }

  async startRecording(config: any): Promise<{ success: boolean; message: string; recordingId?: string }> {
    try {
      const recordingId = `rec_${Date.now()}`;

      // Validate target URL
      if (!config.targetUrl || !this.isValidUrl(config.targetUrl)) {
        return {
          success: false,
          message: "Please provide a valid target URL to start recording."
        };
      }

      // Create recording session
      const recordingSession = {
        id: recordingId,
        targetUrl: config.targetUrl,
        startTime: new Date().toISOString(),
        status: 'recording',
        actions: [],
        projectId: config.projectId,
        moduleId: config.moduleId,
        testCaseId: config.testCaseId
      };

      this.recordings.set(recordingId, recordingSession);

      return {
        success: true,
        message: `Recording started successfully for ${config.targetUrl}`,
        recordingId
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start recording: ${error.message}`
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async stopRecording(sessionId: string): Promise<{ success: boolean; message: string; filename?: string }> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        message: 'Recording session not found',
      };
    }

    logger.info('Stopping recording session:', sessionId);

    try {
      if (session.process && !session.process.killed) {
        session.process.kill('SIGTERM');

        // Wait for process to terminate
        await new Promise((resolve) => {
          session.process?.on('close', resolve);
          setTimeout(resolve, 5000); // Timeout after 5 seconds
        });
      }

      session.status = 'stopped';
      session.endTime = new Date();
      this.activeSessions.set(sessionId, session);

      // Check if output file exists
      if (session.outputPath) {
        try {
          await fs.access(session.outputPath);
          logger.info('Recording file saved:', session.outputPath);
        } catch (error) {
          logger.warn('Recording file not found:', session.outputPath);
        }
      }

      return {
        success: true,
        message: 'Recording stopped successfully',
        filename: session.filename,
      };

    } catch (error: any) {
      logger.error('Failed to stop recording:', error);
      session.status = 'error';
      this.activeSessions.set(sessionId, session);

      return {
        success: false,
        message: `Failed to stop recording: ${error.message}`,
      };
    }
  }

  async executeTest(filename: string): Promise<{ success: boolean; message: string; executionId?: string }> {
    const executionId = `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testPath = path.join(this.recordingsDir, filename);

    logger.info('Starting test execution:', {
      executionId,
      filename,
      testPath,
    });

    try {
      // Check if test file exists
      await fs.access(testPath);

      const execution: TestExecution = {
        id: executionId,
        sessionId: '', // We don't have session ID for execution
        filename,
        status: 'running',
        startTime: new Date(),
      };

      // Execute the test
      const testProcess = spawn('npx', [
        'playwright',
        'test',
        testPath,
        '--reporter=json'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env,
          PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0'
        }
      });

      execution.process = testProcess;
      this.activeExecutions.set(executionId, execution);

      let stdout = '';
      let stderr = '';

      testProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        execution.endTime = new Date();
        execution.status = code === 0 ? 'completed' : 'failed';

        try {
          // Try to parse JSON output
          const results = JSON.parse(stdout);
          execution.results = results;
          execution.report = this.generateReport(results);
        } catch (error) {
          execution.report = `Test execution ${code === 0 ? 'completed' : 'failed'}\n\nOutput:\n${stdout}\n\nErrors:\n${stderr}`;
        }

        this.activeExecutions.set(executionId, execution);
        logger.info('Test execution completed:', {
          executionId,
          status: execution.status,
          duration: execution.endTime.getTime() - execution.startTime.getTime(),
        });
      });

      return {
        success: true,
        message: 'Test execution started',
        executionId,
      };

    } catch (error: any) {
      logger.error('Failed to execute test:', error);
      return {
        success: false,
        message: `Failed to execute test: ${error.message}`,
      };
    }
  }

  private generateReport(results: any): string {
    if (!results || !results.suites) {
      return 'No test results available';
    }

    let report = '# Test Execution Report\n\n';

    // Summary
    const stats = results.stats || {};
    report += `## Summary\n`;
    report += `- **Total Tests**: ${stats.total || 0}\n`;
    report += `- **Passed**: ${stats.passed || 0}\n`;
    report += `- **Failed**: ${stats.failed || 0}\n`;
    report += `- **Skipped**: ${stats.skipped || 0}\n`;
    report += `- **Duration**: ${stats.duration || 0}ms\n\n`;

    // Test Results
    report += `## Test Results\n\n`;

    results.suites.forEach((suite: any, index: number) => {
      report += `### Suite ${index + 1}: ${suite.title || 'Unnamed Suite'}\n`;

      if (suite.tests && suite.tests.length > 0) {
        suite.tests.forEach((test: any, testIndex: number) => {
          const status = test.outcome === 'passed' ? '✅' : test.outcome === 'failed' ? '❌' : '⚠️';
          report += `${testIndex + 1}. ${status} **${test.title || 'Unnamed Test'}**\n`;

          if (test.outcome === 'failed' && test.error) {
            report += `   - Error: ${test.error.message}\n`;
          }

          if (test.duration) {
            report += `   - Duration: ${test.duration}ms\n`;
          }

          report += '\n';
        });
      }
    });

    return report;
  }

  getSession(sessionId: string): RecordingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getExecution(executionId: string): TestExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  async getRecordings(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.recordingsDir);
      return files.filter(file => file.endsWith('.spec.ts'));
    } catch (error) {
      logger.error('Failed to get recordings:', error);
      return [];
    }
  }

  async getRecordingContent(filename: string): Promise<string | null> {
    try {
      const filePath = path.join(this.recordingsDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      logger.error('Failed to get recording content:', error);
      return null;
    }
  }
}

export const automationService = new AutomationService();