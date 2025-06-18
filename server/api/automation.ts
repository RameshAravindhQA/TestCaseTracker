import { Request, Response } from "express";
import { InsertAutomationScript, InsertAutomationSchedule, InsertAutomationEnvironment, insertAutomationScriptSchema, insertAutomationScheduleSchema, insertAutomationEnvironmentSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "../storage";
import * as playwright from 'playwright';

// Helper function to validate request body against schema
function validate<T>(schema: z.ZodType<T>, data: unknown): { valid: true, data: T } | { valid: false, errors: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}

export async function getAutomationScripts(req: Request, res: Response) {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const scripts = await storage.getAutomationScripts(projectId);
    return res.json(scripts);
  } catch (error) {
    console.error('Error fetching automation scripts:', error);
    return res.status(500).json({ error: 'Failed to fetch automation scripts' });
  }
}

export async function getAutomationScript(req: Request, res: Response) {
  try {
    const scriptId = parseInt(req.params.id);
    const script = await storage.getAutomationScript(scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Automation script not found' });
    }
    
    return res.json(script);
  } catch (error) {
    console.error('Error fetching automation script:', error);
    return res.status(500).json({ error: 'Failed to fetch automation script' });
  }
}

export async function createAutomationScript(req: Request, res: Response) {
  try {
    const validation = validate(insertAutomationScriptSchema, req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const scriptData: InsertAutomationScript = validation.data;
    
    // Add the current user as creator
    scriptData.createdById = req.session.userId!;
    
    const newScript = await storage.createAutomationScript(scriptData);
    return res.status(201).json(newScript);
  } catch (error) {
    console.error('Error creating automation script:', error);
    return res.status(500).json({ error: 'Failed to create automation script' });
  }
}

export async function updateAutomationScript(req: Request, res: Response) {
  try {
    const scriptId = parseInt(req.params.id);
    const script = await storage.getAutomationScript(scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Automation script not found' });
    }
    
    const validation = validate(insertAutomationScriptSchema.partial(), req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const updateData = validation.data;
    // Add the current user as updater
    updateData.updatedById = req.session.userId!;
    
    const updatedScript = await storage.updateAutomationScript(scriptId, updateData);
    return res.json(updatedScript);
  } catch (error) {
    console.error('Error updating automation script:', error);
    return res.status(500).json({ error: 'Failed to update automation script' });
  }
}

export async function deleteAutomationScript(req: Request, res: Response) {
  try {
    const scriptId = parseInt(req.params.id);
    const script = await storage.getAutomationScript(scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Automation script not found' });
    }
    
    await storage.deleteAutomationScript(scriptId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation script:', error);
    return res.status(500).json({ error: 'Failed to delete automation script' });
  }
}

// Automation Runs
export async function getAutomationRuns(req: Request, res: Response) {
  try {
    const scriptId = req.query.scriptId ? parseInt(req.query.scriptId as string) : undefined;
    const runs = await storage.getAutomationRuns(scriptId);
    return res.json(runs);
  } catch (error) {
    console.error('Error fetching automation runs:', error);
    return res.status(500).json({ error: 'Failed to fetch automation runs' });
  }
}

export async function getAutomationRun(req: Request, res: Response) {
  try {
    const runId = parseInt(req.params.id);
    const run = await storage.getAutomationRun(runId);
    
    if (!run) {
      return res.status(404).json({ error: 'Automation run not found' });
    }
    
    return res.json(run);
  } catch (error) {
    console.error('Error fetching automation run:', error);
    return res.status(500).json({ error: 'Failed to fetch automation run' });
  }
}

// Automation Schedules
export async function getAutomationSchedules(req: Request, res: Response) {
  try {
    const schedules = await storage.getAutomationSchedules();
    return res.json(schedules);
  } catch (error) {
    console.error('Error fetching automation schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch automation schedules' });
  }
}

export async function getAutomationSchedule(req: Request, res: Response) {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = await storage.getAutomationSchedule(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Automation schedule not found' });
    }
    
    return res.json(schedule);
  } catch (error) {
    console.error('Error fetching automation schedule:', error);
    return res.status(500).json({ error: 'Failed to fetch automation schedule' });
  }
}

export async function createAutomationSchedule(req: Request, res: Response) {
  try {
    const validation = validate(insertAutomationScheduleSchema, req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const scheduleData: InsertAutomationSchedule = validation.data;
    
    // Add the current user as creator
    scheduleData.createdById = req.session.userId!;
    
    const newSchedule = await storage.createAutomationSchedule(scheduleData);
    return res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating automation schedule:', error);
    return res.status(500).json({ error: 'Failed to create automation schedule' });
  }
}

export async function updateAutomationSchedule(req: Request, res: Response) {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = await storage.getAutomationSchedule(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Automation schedule not found' });
    }
    
    const validation = validate(insertAutomationScheduleSchema.partial(), req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const updateData = validation.data;
    // Add the current user as updater
    updateData.updatedById = req.session.userId!;
    
    const updatedSchedule = await storage.updateAutomationSchedule(scheduleId, updateData);
    return res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating automation schedule:', error);
    return res.status(500).json({ error: 'Failed to update automation schedule' });
  }
}

export async function deleteAutomationSchedule(req: Request, res: Response) {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = await storage.getAutomationSchedule(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Automation schedule not found' });
    }
    
    await storage.deleteAutomationSchedule(scheduleId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation schedule:', error);
    return res.status(500).json({ error: 'Failed to delete automation schedule' });
  }
}

// Automation Environments
export async function getAutomationEnvironments(req: Request, res: Response) {
  try {
    const environments = await storage.getAutomationEnvironments();
    return res.json(environments);
  } catch (error) {
    console.error('Error fetching automation environments:', error);
    return res.status(500).json({ error: 'Failed to fetch automation environments' });
  }
}

export async function getAutomationEnvironment(req: Request, res: Response) {
  try {
    const environmentId = parseInt(req.params.id);
    const environment = await storage.getAutomationEnvironment(environmentId);
    
    if (!environment) {
      return res.status(404).json({ error: 'Automation environment not found' });
    }
    
    return res.json(environment);
  } catch (error) {
    console.error('Error fetching automation environment:', error);
    return res.status(500).json({ error: 'Failed to fetch automation environment' });
  }
}

export async function createAutomationEnvironment(req: Request, res: Response) {
  try {
    const validation = validate(insertAutomationEnvironmentSchema, req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const environmentData: InsertAutomationEnvironment = validation.data;
    
    // Add the current user as creator
    environmentData.createdById = req.session.userId!;
    
    const newEnvironment = await storage.createAutomationEnvironment(environmentData);
    return res.status(201).json(newEnvironment);
  } catch (error) {
    console.error('Error creating automation environment:', error);
    return res.status(500).json({ error: 'Failed to create automation environment' });
  }
}

export async function updateAutomationEnvironment(req: Request, res: Response) {
  try {
    const environmentId = parseInt(req.params.id);
    const environment = await storage.getAutomationEnvironment(environmentId);
    
    if (!environment) {
      return res.status(404).json({ error: 'Automation environment not found' });
    }
    
    const validation = validate(insertAutomationEnvironmentSchema.partial(), req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: validation.errors.flatten() 
      });
    }
    
    const updateData = validation.data;
    
    const updatedEnvironment = await storage.updateAutomationEnvironment(environmentId, updateData);
    return res.json(updatedEnvironment);
  } catch (error) {
    console.error('Error updating automation environment:', error);
    return res.status(500).json({ error: 'Failed to update automation environment' });
  }
}

export async function deleteAutomationEnvironment(req: Request, res: Response) {
  try {
    const environmentId = parseInt(req.params.id);
    const environment = await storage.getAutomationEnvironment(environmentId);
    
    if (!environment) {
      return res.status(404).json({ error: 'Automation environment not found' });
    }
    
    await storage.deleteAutomationEnvironment(environmentId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation environment:', error);
    return res.status(500).json({ error: 'Failed to delete automation environment' });
  }
}

// Execute a test script
export async function executeAutomationScript(req: Request, res: Response) {
  try {
    const scriptId = parseInt(req.params.id);
    const script = await storage.getAutomationScript(scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Automation script not found' });
    }
    
    const environmentId = req.body.environmentId ? parseInt(req.body.environmentId) : undefined;
    const browser = req.body.browser || 'chrome';
    
    // Create a run record
    const runData = {
      scriptId,
      status: 'Running' as const,
      startTime: new Date(),
      environment: environmentId ? String(environmentId) : undefined,
      browser,
      executedById: req.session.userId!,
    };
    
    const run = await storage.createAutomationRun(runData);
    
    // In a real implementation, this would trigger the actual test execution
    // For now, we'll simulate it with a delayed status update
    setTimeout(async () => {
      try {
        // Simulate a random test result
        const statuses = ['Passed', 'Failed'];
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - run.startTime.getTime()) / 1000);
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'Passed' | 'Failed';
        
        await storage.updateAutomationRun(run.id, {
          status: randomStatus,
          endTime,
          duration,
          logs: `Test execution completed with status: ${randomStatus}`,
          errorMessage: randomStatus === 'Failed' ? 'Simulated test failure' : undefined,
        });
        
        // Update the script's last run information
        await storage.updateAutomationScript(scriptId, {
          lastRunStatus: randomStatus,
          lastRunDate: endTime,
          lastRunDuration: duration,
        });
      } catch (error) {
        console.error('Error in delayed test execution update:', error);
      }
    }, 5000); // Simulate 5 second test run
    
    return res.status(202).json({
      message: 'Script execution started',
      runId: run.id,
    });
  } catch (error) {
    console.error('Error executing automation script:', error);
    return res.status(500).json({ error: 'Failed to execute automation script' });
  }
}

// Playwright recording functionality

export async function startPlaywrightRecording(url: string): Promise<any> {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await context.tracing.start({ screenshots: true, snapshots: true });
  await page.goto(url);
  
  return {
    browser,
    context,
    page
  };
}

export async function stopPlaywrightRecording(recording: any): Promise<string> {
  const { context, page, browser } = recording;
  await context.tracing.stop({ path: './trace.zip' });
  const content = await page.content();
  await browser.close();
  return content;
}
