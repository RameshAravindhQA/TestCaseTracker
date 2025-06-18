// This file has been intentionally emptied to remove Playwright and automation-related dependencies.
// The content was removed to make the application run more efficiently.

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Stub functions to prevent import errors
export function startAutomationService(): Promise<void> {
  logger.info('Automation service has been disabled');
  return Promise.resolve();
}

export function stopAutomationService(): void {
  // Do nothing
}

export function automationServiceProxy(req: Request, res: Response, next: NextFunction) {
  // Just pass to next middleware
  next();
}

export async function installPlaywrightDeps(): Promise<void> {
  logger.info('Playwright dependencies installation has been disabled');
  return Promise.resolve();
}