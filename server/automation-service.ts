import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

// Selenium WebDriver alternative
interface SeleniumConfig {
  browser: 'chrome' | 'firefox' | 'edge';
  headless: boolean;
  timeout: number;
}

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

  // Check for available system browsers
  private async detectSystemBrowsers(): Promise<string[]> {
    const browsers: string[] = [];
    const browserCommands = [
      { name: 'chromium', command: 'chromium-browser' },
      { name: 'chrome', command: 'google-chrome' },
      { name: 'firefox', command: 'firefox' },
      { name: 'chrome-stable', command: 'google-chrome-stable' },
      { name: 'chromium-snap', command: 'chromium' }
    ];

    for (const browser of browserCommands) {
      try {
        const testProcess = spawn('which', [browser.command], { stdio: 'pipe' });
        await new Promise((resolve) => {
          testProcess.on('close', (code) => {
            if (code === 0) {
              browsers.push(browser.name);
              logger.info(`✅ Found system browser: ${browser.name} (${browser.command})`);
            }
            resolve(code);
          });
        });
      } catch (error) {
        // Browser not found, continue
      }
    }

    return browsers;
  }

  // Selenium WebDriver automation
  private async startSeleniumRecording(config: any): Promise<{ success: boolean; message: string; recordingId?: string }> {
    try {
      const recordingId = `selenium_${Date.now()}`;
      
      // Generate Selenium script template
      const seleniumScript = this.generateSeleniumScript(config.url, config.testCaseId);
      const scriptPath = path.join(this.recordingsDir, `selenium-${config.testCaseId}-${Date.now()}.js`);
      
      await fs.writeFile(scriptPath, seleniumScript);
      
      return {
        success: true,
        message: `Selenium script template created at ${scriptPath}. You can modify and run this script manually.`,
        recordingId
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create Selenium script: ${error.message}`
      };
    }
  }

  private async startManualRecording(config: any): Promise<{ success: boolean; message: string; recordingId?: string }> {
    const recordingId = `manual_${Date.now()}`;
    const timestamp = Date.now();
    const filename = `manual-test-${config.testCaseId}-${timestamp}.md`;
    
    // Create manual test recording template
    const manualTemplate = this.generateManualTestTemplate(config);
    const outputPath = path.join(this.recordingsDir, filename);
    
    try {
      await fs.writeFile(outputPath, manualTemplate);
      
      const recordingSession: RecordingSession = {
        id: recordingId,
        projectId: config.projectId,
        moduleId: config.moduleId,
        testCaseId: config.testCaseId,
        url: config.url,
        filename,
        status: 'recording',
        startTime: new Date(),
        outputPath
      };

      this.activeSessions.set(recordingId, recordingSession);

      return {
        success: true,
        message: `Manual test recording started. Follow the guided steps and update the test document.`,
        recordingId
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to start manual recording: ${error.message}`
      };
    }
  }

  private async startCypressRecording(config: any): Promise<{ success: boolean; message: string; recordingId?: string }> {
    try {
      const recordingId = `cypress_${Date.now()}`;
      
      // Generate Cypress test template
      const cypressTest = this.generateCypressTest(config.url, config.testCaseId);
      const scriptPath = path.join(this.recordingsDir, `cypress-${config.testCaseId}-${Date.now()}.cy.js`);
      
      await fs.writeFile(scriptPath, cypressTest);
      
      return {
        success: true,
        message: `Cypress test template created at ${scriptPath}. You can run this with 'npx cypress run' locally.`,
        recordingId
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create Cypress test: ${error.message}`
      };
    }
  }

  private generateCypressTest(url: string, testCaseId: string): string {
    return `// Cypress Test for Test Case: ${testCaseId}
describe('Test Case ${testCaseId}', () => {
  beforeEach(() => {
    // Navigate to the application
    cy.visit('${url}');
  });

  it('should execute test case ${testCaseId}', () => {
    // Add your test steps here:
    
    // Example test steps:
    // cy.get('[data-testid="username"]').type('testuser');
    // cy.get('[data-testid="password"]').type('password');
    // cy.get('[data-testid="submit"]').click();
    // cy.url().should('include', '/dashboard');
    
    // Verify page loads
    cy.get('body').should('be.visible');
    
    // Add assertions
    cy.title().should('not.be.empty');
  });
});`;
  }

  private generateManualTestTemplate(config: any): string {
    return `# Manual Test Recording - ${config.testCaseId}

## Test Information
- **Test Case ID**: ${config.testCaseId}
- **Target URL**: ${config.url}
- **Project ID**: ${config.projectId}
- **Module ID**: ${config.moduleId}
- **Started**: ${new Date().toISOString()}

## Instructions
1. Open the target URL: ${config.url}
2. Follow the test steps below and mark each as completed
3. Record any issues or observations
4. Update the status when complete

## Test Steps
[ ] Step 1: Navigate to ${config.url}
[ ] Step 2: Verify page loads correctly
[ ] Step 3: [Add your test steps here]
[ ] Step 4: [Add your test steps here]
[ ] Step 5: [Add your test steps here]

## Observations
- 

## Results
- **Status**: In Progress
- **Issues Found**: 
- **Screenshots**: 
- **Completion Time**: 

## Generated Test Code (Optional)
\`\`\`javascript
// Add generated test code here based on manual testing
// Example:
// await page.goto('${config.url}');
// await page.click('#login-button');
// await page.fill('#username', 'testuser');
\`\`\`
`;
  }

  private generateSeleniumScript(url: string, testCaseId: string): string {
    return `// Selenium WebDriver Script for Test Case: ${testCaseId}
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runTest() {
  // Setup Chrome options
  let options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  // Create driver
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Navigate to target URL
    await driver.get('${url}');
    
    // Wait for page to load
    await driver.wait(until.titleContains(''), 5000);
    
    // Add your test steps here:
    // Example: await driver.findElement(By.id('username')).sendKeys('testuser');
    // Example: await driver.findElement(By.id('password')).sendKeys('password');
    // Example: await driver.findElement(By.css('button[type="submit"]')).click();
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await driver.quit();
  }
}

runTest();`;
  }

  // Launch browser with system command instead of Playwright
  private async launchSystemBrowser(url: string, browserName?: string): Promise<{ success: boolean; process?: ChildProcess; message?: string }> {
    const availableBrowsers = await this.detectSystemBrowsers();
    
    if (availableBrowsers.length === 0) {
      return {
        success: false,
        message: "No system browsers found. Please install Chrome, Chromium, or Firefox."
      };
    }

    // Choose browser (prefer Chrome/Chromium)
    const preferredOrder = ['chrome', 'google-chrome', 'chromium', 'chrome-stable', 'firefox'];
    const selectedBrowser = browserName || availableBrowsers.find(b => preferredOrder.includes(b)) || availableBrowsers[0];
    
    const browserCommands: Record<string, string[]> = {
      'chrome': ['google-chrome', '--new-window', '--disable-web-security', '--disable-features=VizDisplayCompositor'],
      'google-chrome': ['google-chrome', '--new-window', '--disable-web-security'],
      'chromium': ['chromium-browser', '--new-window', '--disable-web-security'],
      'chrome-stable': ['google-chrome-stable', '--new-window', '--disable-web-security'],
      'firefox': ['firefox', '--new-window'],
      'chromium-snap': ['chromium', '--new-window', '--disable-web-security']
    };

    const command = browserCommands[selectedBrowser];
    if (!command) {
      return {
        success: false,
        message: `Browser command not configured for: ${selectedBrowser}`
      };
    }

    try {
      logger.info(`🚀 Launching system browser: ${selectedBrowser} with URL: ${url}`);
      const browserProcess = spawn(command[0], [...command.slice(1), url], {
        stdio: 'pipe',
        detached: true,
        env: {
          ...process.env,
          DISPLAY: process.env.DISPLAY || ':0'
        }
      });

      browserProcess.unref(); // Allow the process to run independently

      return {
        success: true,
        process: browserProcess,
        message: `Browser ${selectedBrowser} launched successfully`
      };
    } catch (error: any) {
      logger.error(`Failed to launch browser ${selectedBrowser}:`, error);
      return {
        success: false,
        message: `Failed to launch browser: ${error.message}`
      };
    }
  }

  async startRecording(config: any): Promise<{ success: boolean; message: string; recordingId?: string; availableBrowsers?: string[] }> {
    try {
      logger.info('Starting recording with config:', config);
      const recordingId = `rec_${Date.now()}`;

      // Validate target URL
      if (!config.url || !this.isValidUrl(config.url)) {
        logger.error('Invalid URL provided for recording:', config.url);
        return {
          success: false,
          message: "Please provide a valid target URL to start recording."
        };
      }

      // Detect available system browsers
      const availableBrowsers = await this.detectSystemBrowsers();
      logger.info('Available system browsers:', availableBrowsers);

      // Manual test recorder mode
      if (config.launchMode === 'manual-recorder') {
        const manualSession = await this.startManualRecording(config);
        return manualSession;
      }

      // Selenium automation mode
      if (config.launchMode === 'selenium') {
        const seleniumResult = await this.startSeleniumRecording(config);
        return seleniumResult;
      }

      // Cypress automation mode
      if (config.launchMode === 'cypress') {
        const cypressResult = await this.startCypressRecording(config);
        return cypressResult;
      }

      // If browser launch mode is requested, launch system browser
      if (config.launchMode === 'system-browser') {
        const browserResult = await this.launchSystemBrowser(config.url, config.preferredBrowser);
        
        if (!browserResult.success) {
          return {
            success: false,
            message: browserResult.message || 'Failed to launch system browser',
            availableBrowsers
          };
        }

        // Create recording session for system browser
        const recordingSession: RecordingSession = {
          id: recordingId,
          projectId: config.projectId,
          moduleId: config.moduleId,
          testCaseId: config.testCaseId,
          url: config.url,
          filename: `manual-test-${config.testCaseId}-${Date.now()}.md`,
          status: 'recording',
          startTime: new Date(),
          process: browserResult.process
        };

        this.activeSessions.set(recordingId, recordingSession);

        return {
          success: true,
          message: `System browser launched successfully. Please perform your test manually and click stop when done.`,
          recordingId,
          availableBrowsers
        };
      }

      // Try Playwright first (existing logic)
      try {
        logger.info('Checking Playwright availability...');
        const testProcess = spawn('npx', ['playwright', '--version'], { 
          stdio: 'pipe',
          timeout: 10000
        });
        
        let versionOutput = '';
        testProcess.stdout?.on('data', (data) => {
          versionOutput += data.toString();
        });
        
        testProcess.on('error', (error) => {
          logger.error('Playwright executable not found:', error.message);
          throw error;
        });
        
        // Wait for version check to complete
        await new Promise((resolve, reject) => {
          testProcess.on('close', (code) => {
            if (code === 0) {
              logger.info('Playwright version check successful:', versionOutput.trim());
              resolve(code);
            } else {
              reject(new Error(`Playwright version check failed with code ${code}`));
            }
          });
          testProcess.on('error', reject);
        });
        
      } catch (error: any) {
        logger.error('Error checking Playwright availability:', error.message);
        
        // If Playwright fails, try system browser launch as fallback
        if (availableBrowsers.length > 0) {
          logger.info('Playwright failed, attempting system browser launch...');
          const browserResult = await this.launchSystemBrowser(config.url);
          
          if (browserResult.success) {
            const recordingSession: RecordingSession = {
              id: recordingId,
              projectId: config.projectId,
              moduleId: config.moduleId,
              testCaseId: config.testCaseId,
              url: config.url,
              filename: `manual-test-${config.testCaseId}-${timestamp}.md`,
              status: 'recording',
              startTime: new Date(),
              process: browserResult.process
            };

            this.activeSessions.set(recordingId, recordingSession);

            return {
              success: true,
              message: `Playwright unavailable. Launched system browser instead. Please perform manual testing.`,
              recordingId,
              availableBrowsers
            };
          }
        }

        return {
          success: false,
          message: `Playwright not available. Available alternatives: ${availableBrowsers.length > 0 ? availableBrowsers.join(', ') : 'No system browsers found'}. Try using system browser mode.`,
          availableBrowsers
        };
      }

      // Skip virtual display setup - run in true headed mode
      logger.info(`🖥️ Running in true headed mode without virtual display...`);

      // Generate filename based on test case
      const timestamp = Date.now();
      const filename = `test-${config.testCaseId}-${timestamp}.spec.ts`;
      const outputPath = path.join(this.recordingsDir, filename);

      // Create recording session
      const recordingSession: RecordingSession = {
        id: recordingId,
        projectId: config.projectId,
        moduleId: config.moduleId,
        testCaseId: config.testCaseId,
        url: config.url,
        filename,
        status: 'starting',
        startTime: new Date(),
        outputPath
      };

      this.activeSessions.set(recordingId, recordingSession);

      // Launch Playwright Codegen in headed mode
      logger.info(`Starting Playwright codegen in HEADED mode for URL: ${config.url}`);
      logger.info(`Output path: ${outputPath}`);
      logger.info(`Recording ID: ${recordingId}`);
      logger.info(`Display: ${process.env.DISPLAY}`);
      
      // Force headed mode - no headless operation
      const shouldRunHeadless = false;
      
      // Log the exact command being executed
      const codegenArgs = [
        'playwright',
        'codegen',
        config.url,
        '--target=typescript',
        `--output=${outputPath}`,
        '--save-storage=state.json',
        '--browser=chromium',
        '--viewport-size=1280,720'
      ];
      
      logger.info(`🖥️ Running in HEADED mode with visible browser window`);
      
      logger.info(`Executing command: npx ${codegenArgs.join(' ')}`);
      
      // Log environment variables
      logger.info(`Environment variables for Playwright:`, {
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
        NODE_ENV: 'development',
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0',
        DISPLAY: process.env.DISPLAY || ':0'
      });
      
      logger.info(`🚀 Attempting to launch browser in HEADED instrumented mode...`);
      logger.info(`🔍 Pre-launch browser check starting...`);
      
      // Ensure browsers are installed first with system dependencies
      try {
        logger.info(`🔧 Installing Playwright browsers with dependencies...`);
        
        // Install browsers with system dependencies
        const installProcess = spawn('npx', ['playwright', 'install', '--with-deps', 'chromium'], { 
          stdio: 'pipe',
          timeout: 120000 // Increase timeout for dependency installation
        });
        
        let installOutput = '';
        installProcess.stdout?.on('data', (data) => {
          installOutput += data.toString();
          logger.info(`📦 Install output: ${data.toString().trim()}`);
        });
        
        installProcess.stderr?.on('data', (data) => {
          logger.warn(`📦 Install warning: ${data.toString().trim()}`);
        });
        
        await new Promise((resolve, reject) => {
          installProcess.on('close', (code) => {
            logger.info(`🔧 Browser installation completed with code: ${code}`);
            if (code === 0) {
              logger.info(`✅ Playwright browsers installed successfully`);
              resolve(code);
            } else {
              logger.error(`❌ Browser installation failed with code: ${code}`);
              // Try alternative installation method
              logger.info(`🔄 Attempting alternative installation method...`);
              resolve(code); // Continue anyway, let fallback methods handle it
            }
          });
          
          installProcess.on('error', (error) => {
            logger.error(`❌ Browser installation process error: ${error.message}`);
            resolve(1); // Continue with fallback
          });
        });
        
        // Verify browser installation
        try {
          const verifyProcess = spawn('npx', ['playwright', 'install', '--dry-run', 'chromium'], {
            stdio: 'pipe',
            timeout: 10000
          });
          
          await new Promise((resolve) => {
            verifyProcess.on('close', (code) => {
              if (code === 0) {
                logger.info(`✅ Browser installation verified successfully`);
              } else {
                logger.warn(`⚠️ Browser verification returned code: ${code}`);
              }
              resolve(code);
            });
          });
        } catch (verifyError) {
          logger.warn(`⚠️ Browser verification failed: ${verifyError}`);
        }
        
      } catch (installError: any) {
        logger.warn(`⚠️ Browser installation failed: ${installError.message}`);
        
        // Try manual installation as fallback
        logger.info(`🔄 Attempting manual browser installation...`);
        try {
          const manualInstall = spawn('npm', ['run', 'postinstall'], { 
            stdio: 'pipe',
            timeout: 60000
          });
          
          await new Promise((resolve) => {
            manualInstall.on('close', (code) => {
              logger.info(`🔧 Manual installation completed with code: ${code}`);
              resolve(code);
            });
          });
        } catch (manualError) {
          logger.error(`❌ Manual installation also failed: ${manualError}`);
        }
      }
      
      // Verify browser binary exists
      try {
        const { promises: fs } = await import('fs');
        const browserPath = path.join(process.cwd(), 'node_modules', 'playwright-core', '.local-browsers');
        
        try {
          const browserDirs = await fs.readdir(browserPath);
          logger.info(`🔍 Available browser installations: ${browserDirs.join(', ')}`);
          
          // Look for chromium installation
          const chromiumDirs = browserDirs.filter(dir => dir.startsWith('chromium'));
          if (chromiumDirs.length > 0) {
            logger.info(`✅ Found Chromium installations: ${chromiumDirs.join(', ')}`);
          } else {
            logger.warn(`⚠️ No Chromium installations found in browser directory`);
          }
        } catch (browserDirError) {
          logger.warn(`⚠️ Could not read browser directory: ${browserDirError}`);
        }
      } catch (fsError) {
        logger.warn(`⚠️ File system error during browser check: ${fsError}`);
      }
      
      logger.info(`🌐 Initiating Chromium browser launch in HEADED mode...`);
      logger.info(`🎯 Target URL: ${config.url}`);
      logger.info(`📁 Recording output: ${outputPath}`);
      logger.info(`🖥️ Display: ${process.env.DISPLAY}`);
      logger.info(`👁️ Browser will be VISIBLE with recording interface`);
      
      const codegenProcess = spawn('npx', codegenArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env,
          PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
          NODE_ENV: 'development',
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0',
          DISPLAY: process.env.DISPLAY || ':0'
        }
      });

      recordingSession.process = codegenProcess;
      recordingSession.status = 'recording';
      this.activeSessions.set(recordingId, recordingSession);

      codegenProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        logger.info(`📤 Codegen stdout [${recordingId}]: ${output}`);
        
        // Enhanced browser launch detection
        if (output.includes('Connecting to browser') || output.includes('Browser launched')) {
          logger.info(`🌐 ✅ Browser connection initiated for session ${recordingId}`);
        }
        if (output.includes('Recording started') || output.includes('codegen started')) {
          logger.info(`🎬 ✅ Browser recording mode activated for session ${recordingId}`);
        }
        if (output.includes('Launching browser') || output.includes('Starting browser')) {
          logger.info(`🚀 ✅ Browser launch sequence started for session ${recordingId}`);
        }
        if (output.includes('Browser started') || output.includes('Browser ready')) {
          logger.info(`🎯 ✅ Browser fully started and ready for session ${recordingId}`);
        }
        if (output.includes('DevTools listening') || output.includes('DevTools Protocol')) {
          logger.info(`🔗 ✅ DevTools Protocol connection established for session ${recordingId}`);
        }
        if (output.includes('Page loaded') || output.includes('Navigated to')) {
          logger.info(`📄 ✅ Target page loaded successfully for session ${recordingId}`);
        }
      });

      codegenProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        logger.warn(`📥 Codegen stderr [${recordingId}]: ${output}`);
        
        // Enhanced error detection
        if (output.includes('Host system is missing dependencies')) {
          logger.error(`❌ Browser dependencies missing for session ${recordingId}`);
          logger.error(`🔧 Required: System dependencies for browser execution`);
          recordingSession.status = 'error';
          recordingSession.endTime = new Date();
          this.activeSessions.set(recordingId, recordingSession);
        }
        
        if (output.includes('Executable doesn\'t exist') || output.includes('npx playwright install')) {
          logger.error(`❌ Browser installation required for session ${recordingId}`);
          recordingSession.status = 'error';
          recordingSession.endTime = new Date();
          this.activeSessions.set(recordingId, recordingSession);
        }
        
        if (output.includes('Failed to launch') || output.includes('Browser not found')) {
          logger.error(`❌ Browser launch failed for session ${recordingId}`);
          recordingSession.status = 'error';
          recordingSession.endTime = new Date();
          this.activeSessions.set(recordingId, recordingSession);
        }
        
        // Check for successful browser connections
        if (output.includes('DevTools listening') || output.includes('Chrome DevTools Protocol')) {
          logger.info(`🔗 DevTools Protocol connection established for session ${recordingId}`);
        }
      });

      codegenProcess.on('error', (error: any) => {
        logger.error(`❌ Codegen process error [${recordingId}]:`, error);
        logger.error(`🔍 Error details: ${error.message}`);
        if (error.code) {
          logger.error(`🔍 Error code: ${error.code}`);
        }
        recordingSession.status = 'error';
        recordingSession.endTime = new Date();
        this.activeSessions.set(recordingId, recordingSession);
      });

      codegenProcess.on('spawn', () => {
        logger.info(`🚀 Codegen process spawned successfully for session ${recordingId}`);
        logger.info(`📋 Process PID: ${codegenProcess.pid}`);
      });

      codegenProcess.on('close', (code, signal) => {
        recordingSession.endTime = new Date();
        recordingSession.status = code === 0 ? 'stopped' : 'error';
        this.activeSessions.set(recordingId, recordingSession);
        
        logger.info(`🏁 Codegen process closed for session ${recordingId}:`);
        logger.info(`   Exit code: ${code}`);
        logger.info(`   Signal: ${signal || 'none'}`);
        logger.info(`   Duration: ${recordingSession.endTime.getTime() - recordingSession.startTime.getTime()}ms`);
        
        if (code === 0) {
          logger.info(`✅ Recording completed successfully for session ${recordingId}`);
        } else {
          logger.error(`❌ Recording failed for session ${recordingId} (exit code: ${code})`);
        }
        
        // Log file creation status
        if (recordingSession.outputPath) {
          import('fs').then(fs => {
            fs.promises.access(recordingSession.outputPath!)
              .then(() => {
                logger.info(`📁 Recording file created successfully: ${recordingSession.outputPath}`);
              })
              .catch(() => {
                logger.warn(`⚠️ Recording file was not created: ${recordingSession.outputPath}`);
              });
          });
        }
      });

      return {
        success: true,
        message: `Recording started successfully for ${config.url}`,
        recordingId
      };
    } catch (error: any) {
      logger.error('Failed to start recording:', error);
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
    const screenshotsDir = path.join(this.recordingsDir, 'screenshots', executionId);

    logger.info('Starting test execution:', {
      executionId,
      filename,
      testPath,
    });

    try {
      // Check if test file exists
      await fs.access(testPath);

      // Create screenshots directory
      await fs.mkdir(screenshotsDir, { recursive: true });

      const execution: TestExecution = {
        id: executionId,
        sessionId: '', // We don't have session ID for execution
        filename,
        status: 'running',
        startTime: new Date(),
      };

      // Execute the test with screenshots enabled
      const testProcess = spawn('npx', [
        'playwright',
        'test',
        testPath,
        '--reporter=json',
        '--screenshot=on-failure',
        `--output-dir=${screenshotsDir}`
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

      testProcess.on('close', async (code) => {
        execution.endTime = new Date();
        execution.status = code === 0 ? 'completed' : 'failed';

        try {
          // Try to parse JSON output
          const results = JSON.parse(stdout);
          execution.results = results;
          execution.report = this.generateDetailedReport(results, screenshotsDir);
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

  private generateDetailedReport(results: any, screenshotsDir: string): string {
    if (!results || !results.suites) {
      return 'No test results available';
    }

    let report = '# Detailed Test Execution Report\n\n';

    // Summary
    const stats = results.stats || {};
    report += `## Summary\n`;
    report += `- **Total Tests**: ${stats.total || 0}\n`;
    report += `- **Passed**: ${stats.passed || 0}\n`;
    report += `- **Failed**: ${stats.failed || 0}\n`;
    report += `- **Skipped**: ${stats.skipped || 0}\n`;
    report += `- **Duration**: ${stats.duration || 0}ms\n\n`;

    // Detailed Test Results with Steps
    report += `## Detailed Test Results\n\n`;

    results.suites.forEach((suite: any, suiteIndex: number) => {
      report += `### Suite ${suiteIndex + 1}: ${suite.title || 'Unnamed Suite'}\n\n`;

      if (suite.tests && suite.tests.length > 0) {
        suite.tests.forEach((test: any, testIndex: number) => {
          const status = test.outcome === 'passed' ? '✅ PASSED' : 
                        test.outcome === 'failed' ? '❌ FAILED' : '⚠️ SKIPPED';
          
          report += `#### Test ${testIndex + 1}: ${test.title || 'Unnamed Test'}\n`;
          report += `**Status**: ${status}\n`;
          report += `**Duration**: ${test.duration || 0}ms\n\n`;

          // Add test steps if available
          if (test.steps && test.steps.length > 0) {
            report += `**Steps**:\n`;
            test.steps.forEach((step: any, stepIndex: number) => {
              const stepStatus = step.error ? '❌' : '✅';
              report += `${stepIndex + 1}. ${stepStatus} ${step.title}\n`;
              
              if (step.error) {
                report += `   - **Error**: ${step.error.message}\n`;
                // Check for screenshots
                if (step.screenshot) {
                  const screenshotPath = `/automation/screenshots/${path.basename(screenshotsDir)}/${step.screenshot}`;
                  report += `   - **Screenshot**: [View Screenshot](${screenshotPath})\n`;
                }
              }
            });
            report += '\n';
          }

          // Add error details for failed tests
          if (test.outcome === 'failed' && test.error) {
            report += `**Error Details**:\n`;
            report += `\`\`\`\n${test.error.message}\n\`\`\`\n\n`;
            
            if (test.error.stack) {
              report += `**Stack Trace**:\n`;
              report += `\`\`\`\n${test.error.stack}\n\`\`\`\n\n`;
            }
          }

          report += '---\n\n';
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