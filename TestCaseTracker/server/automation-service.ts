<replit_final_file>
</replit_final_file>
import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

interface RecordingSession {
  id: string;
  browser: Browser;
  page: Page;
  projectId: string;
  moduleId: string;
  testCaseIds: string[];
  actions: Array<{
    type: string;
    selector: string;
    value?: string;
    timestamp: number;
  }>;
  startTime: number;
}

interface AutomationScript {
  id: string;
  name: string;
  description: string;
  projectId: string;
  moduleId: string;
  testCaseIds: string[];
  script: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  lastRun?: Date;
  results?: {
    success: boolean;
    steps: Array<{
      step: string;
      status: 'passed' | 'failed' | 'skipped';
      screenshot?: string;
      timestamp: Date;
    }>;
    report: string;
  };
}

class AutomationService {
  private sessions: Map<string, RecordingSession> = new Map();
  private scripts: AutomationScript[] = [];
  private scriptsPath = path.join(process.cwd(), 'automation-scripts');

  constructor() {
    this.ensureScriptsDirectory();
    this.loadScripts();
  }

  private async ensureScriptsDirectory() {
    try {
      await fs.mkdir(this.scriptsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating scripts directory:', error);
    }
  }

  private async loadScripts() {
    try {
      const files = await fs.readdir(this.scriptsPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const scriptPath = path.join(this.scriptsPath, file);
          const scriptData = await fs.readFile(scriptPath, 'utf-8');
          const script = JSON.parse(scriptData);
          this.scripts.push(script);
        }
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  }

  async startRecording(projectId: string, moduleId: string, testCaseIds: string[]): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable recording
    await page.addInitScript(() => {
      const actions: any[] = [];
      
      // Record clicks
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const selector = this.generateSelector(target);
        actions.push({
          type: 'click',
          selector,
          timestamp: Date.now()
        });
      });
      
      // Record input changes
      document.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        const selector = this.generateSelector(target);
        actions.push({
          type: 'input',
          selector,
          value: target.value,
          timestamp: Date.now()
        });
      });
      
      // Store actions globally
      (window as any).recordedActions = actions;
    });
    
    const session: RecordingSession = {
      id: sessionId,
      browser,
      page,
      projectId,
      moduleId,
      testCaseIds,
      actions: [],
      startTime: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    
    // Navigate to the application
    await page.goto('http://localhost:5000');
    
    // Monitor for browser close
    browser.on('disconnected', () => {
      this.stopRecording(sessionId);
    });
    
    return sessionId;
  }

  async stopRecording(sessionId: string): Promise<AutomationScript> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Extract recorded actions
    const actions = await session.page.evaluate(() => {
      return (window as any).recordedActions || [];
    });
    
    // Generate script
    const script = this.generatePlaywrightScript(actions);
    
    // Create automation script
    const automationScript: AutomationScript = {
      id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Automated Test - ${new Date().toISOString().split('T')[0]}`,
      description: `Recorded automation script for module ${session.moduleId}`,
      projectId: session.projectId,
      moduleId: session.moduleId,
      testCaseIds: session.testCaseIds,
      script,
      status: 'ready'
    };
    
    // Save script
    await this.saveScript(automationScript);
    this.scripts.push(automationScript);
    
    // Clean up session
    await session.browser.close();
    this.sessions.delete(sessionId);
    
    return automationScript;
  }

  private generatePlaywrightScript(actions: any[]): string {
    let script = `
import { test, expect } from '@playwright/test';

test('Generated automation test', async ({ page }) => {
  await page.goto('http://localhost:5000');
  
`;
    
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          script += `  await page.click('${action.selector}');\n`;
          break;
        case 'input':
          script += `  await page.fill('${action.selector}', '${action.value}');\n`;
          break;
        case 'navigate':
          script += `  await page.goto('${action.url}');\n`;
          break;
      }
    }
    
    script += `
  // Add assertions as needed
  await expect(page).toHaveTitle(/Test Case Tracker/);
});
`;
    
    return script;
  }

  async executeScript(scriptId: string): Promise<void> {
    const script = this.scripts.find(s => s.id === scriptId);
    if (!script) {
      throw new Error('Script not found');
    }
    
    script.status = 'running';
    
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      const results = {
        success: true,
        steps: [] as any[],
        report: ''
      };
      
      // Execute the script step by step
      await page.goto('http://localhost:5000');
      
      // Parse and execute script actions
      const actions = this.parseScriptActions(script.script);
      
      for (const action of actions) {
        try {
          const stepResult = await this.executeAction(page, action);
          results.steps.push({
            step: action.description,
            status: 'passed',
            timestamp: new Date()
          });
        } catch (error) {
          results.success = false;
          results.steps.push({
            step: action.description,
            status: 'failed',
            timestamp: new Date()
          });
          console.error('Action failed:', error);
        }
      }
      
      // Generate natural language report
      results.report = this.generateNaturalLanguageReport(results.steps);
      
      script.results = results;
      script.status = results.success ? 'completed' : 'failed';
      script.lastRun = new Date();
      
      await browser.close();
      await this.saveScript(script);
      
    } catch (error) {
      script.status = 'failed';
      console.error('Script execution failed:', error);
      await this.saveScript(script);
    }
  }

  private parseScriptActions(script: string): any[] {
    const actions = [];
    const lines = script.split('\n');
    
    for (const line of lines) {
      if (line.includes('page.click')) {
        const match = line.match(/page\.click\('([^']+)'\)/);
        if (match) {
          actions.push({
            type: 'click',
            selector: match[1],
            description: `Click on element with selector: ${match[1]}`
          });
        }
      } else if (line.includes('page.fill')) {
        const match = line.match(/page\.fill\('([^']+)',\s*'([^']+)'\)/);
        if (match) {
          actions.push({
            type: 'input',
            selector: match[1],
            value: match[2],
            description: `Enter "${match[2]}" into field: ${match[1]}`
          });
        }
      } else if (line.includes('page.goto')) {
        const match = line.match(/page\.goto\('([^']+)'\)/);
        if (match) {
          actions.push({
            type: 'navigate',
            url: match[1],
            description: `Navigate to: ${match[1]}`
          });
        }
      }
    }
    
    return actions;
  }

  private async executeAction(page: Page, action: any): Promise<void> {
    switch (action.type) {
      case 'click':
        await page.click(action.selector);
        break;
      case 'input':
        await page.fill(action.selector, action.value);
        break;
      case 'navigate':
        await page.goto(action.url);
        break;
    }
  }

  private generateNaturalLanguageReport(steps: any[]): string {
    const totalSteps = steps.length;
    const passedSteps = steps.filter(s => s.status === 'passed').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    
    let report = `Test execution completed with ${passedSteps} out of ${totalSteps} steps passed. `;
    
    if (failedSteps > 0) {
      report += `${failedSteps} steps failed. `;
    }
    
    report += 'Steps executed: ';
    steps.forEach((step, index) => {
      report += `${index + 1}. ${step.step} (${step.status}); `;
    });
    
    return report;
  }

  private async saveScript(script: AutomationScript): Promise<void> {
    const scriptPath = path.join(this.scriptsPath, `${script.id}.json`);
    await fs.writeFile(scriptPath, JSON.stringify(script, null, 2));
  }

  getScripts(): AutomationScript[] {
    return this.scripts;
  }

  getScript(id: string): AutomationScript | undefined {
    return this.scripts.find(s => s.id === id);
  }

  async deleteScript(id: string): Promise<void> {
    const scriptIndex = this.scripts.findIndex(s => s.id === id);
    if (scriptIndex !== -1) {
      const script = this.scripts[scriptIndex];
      const scriptPath = path.join(this.scriptsPath, `${script.id}.json`);
      
      try {
        await fs.unlink(scriptPath);
        this.scripts.splice(scriptIndex, 1);
      } catch (error) {
        console.error('Error deleting script file:', error);
      }
    }
  }
}

export const automationService = new AutomationService();
