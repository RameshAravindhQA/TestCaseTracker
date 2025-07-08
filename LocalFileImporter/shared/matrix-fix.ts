import { logger } from './logger';

export async function initializeDatabase() {
  // Initialize memory storage system
  logger.info('Initializing memory-based storage system...');
  
  // Since we're using memory storage, no database initialization needed
  // This function is kept for compatibility with the existing codebase
  
  try {
    // Simulate database initialization delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Memory storage system initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize storage system:', error);
    throw error;
  }
}