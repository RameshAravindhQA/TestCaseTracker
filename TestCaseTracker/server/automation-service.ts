import { promises as fs } from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';

export class AutomationService {
  private scriptsPath = path.join(process.cwd(), 'automation-scripts');
  private recordings = new Map<string, { browser: Browser; page: Page; actions: any[] }>();

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.access(this.scriptsPath);
    } catch {
      await fs.mkdir(this.scriptsPath, { recursive: true });
    }
  }

  async startRecording(sessionId: string, url: string, projectId: string, moduleId?: string, testCaseId?: string) {
    try {
      // Launch browser with recording capabilities
      const browser = await chromium.launch({
        headless: false,
        args: [
          '--enable-automation',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ]
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
          dir: path.join(this.scriptsPath, 'videos'),
          size: { width: 1280, height: 720 }
        }
      });

      const page = await context.newPage();
      const actions: any[] = [];

      // Set up action recording
      await this.setupActionRecording(page, actions);

      // Navigate to the target URL
      await page.goto(url);

      // Store recording session
      this.recordings.set(sessionId, {
        browser,
        page,
        actions
      });

      return {
        success: true,
        sessionId,
        message: 'Recording started successfully'
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return {
        success: false,
        message: 'Failed to start recording: ' + error.message
      };
    }
  }

  private async setupActionRecording(page: Page, actions: any[]) {
    // Record clicks
    await page.addListener('click', async (event) => {
      const element = await page.locator(`css=${event.target}`).first();
      const selector = await this.generateSelector(element);

      actions.push({
        type: 'click',
        selector,
        timestamp: Date.now(),
        coordinates: { x: event.clientX, y: event.clientY }
      });
    });

    // Record typing
    await page.addListener('input', async (event) => {
      const element = await page.locator(`css=${event.target}`).first();
      const selector = await this.generateSelector(element);

      actions.push({
        type: 'type',
        selector,
        text: event.target.value,
        timestamp: Date.now()
      });
    });

    // Record navigation
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        actions.push({
          type: 'navigate',
          url: frame.url(),
          timestamp: Date.now()
        });
      }
    });
  }

  private async generateSelector(element: any): Promise<string> {
    try {
      // Generate a robust selector for the element
      const selectors = [
        await element.getAttribute('data-testid'),
        await element.getAttribute('id'),
        await element.getAttribute('name'),
        await element.getAttribute('class')
      ].filter(Boolean);

      if (selectors[0]) return `[data-testid="${selectors[0]}"]`;
      if (selectors[1]) return `#${selectors[1]}`;
      if (selectors[2]) return `[name="${selectors[2]}"]`;
      if (selectors[3]) return `.${selectors[3].split(' ')[0]}`;

      // Fallback to text content or xpath
      const textContent = await element.textContent();
      if (textContent && textContent.trim().length < 50) {
        return `text=${textContent.trim()}`;
      }

      return 'css=element'; // Fallback
    } catch (error) {
      return 'css=element';
    }
  }

  async stopRecording(sessionId: string) {
    const recording = this.recordings.get(sessionId);
    if (!recording) {
      return { success: false, message: 'Recording session not found' };
    }

    try {
      const { browser, actions } = recording;

      // Save the recorded actions
      const script = {
        id: `script_${Date.now()}`,
        name: `Recording_${new Date().toISOString().split('T')[0]}`,
        description: 'Auto-generated recording',
        actions,
        createdAt: new Date().toISOString()
      };

      const scriptPath = path.join(this.scriptsPath, `${script.id}.json`);
      await fs.writeFile(scriptPath, JSON.stringify(script, null, 2));

      // Close browser
      await browser.close();

      // Clean up recording session
      this.recordings.delete(sessionId);

      return {
        success: true,
        script,
        message: 'Recording saved successfully'
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return {
        success: false,
        message: 'Failed to stop recording: ' + error.message
      };
    }
  }

  async playbackScript(scriptId: string) {
    try {
      const scriptPath = path.join(this.scriptsPath, `${scriptId}.json`);
      const content = await fs.readFile(scriptPath, 'utf-8');
      const script = JSON.parse(content);

      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Execute actions
      for (const action of script.actions) {
        await this.executeAction(page, action);
      }

      // Keep browser open for review
      return {
        success: true,
        message: 'Script executed successfully'
      };
    } catch (error) {
      console.error('Failed to playback script:', error);
      return {
        success: false,
        message: 'Failed to playback script: ' + error.message
      };
    }
  }

  private async executeAction(page: Page, action: any) {
    try {
      switch (action.type) {
        case 'navigate':
          await page.goto(action.url);
          break;
        case 'click':
          await page.locator(action.selector).click();
          break;
        case 'type':
          await page.locator(action.selector).fill(action.text);
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  async getScripts() {
    try {
      const files = await fs.readdir(this.scriptsPath);
      const scripts = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.scriptsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const script = JSON.parse(content);
          scripts.push({
            id: file.replace('.json', ''),
            ...script
          });
        }
      }

      return scripts;
    } catch (error) {
      console.error('Error reading scripts:', error);
      return [];
    }
  }
}