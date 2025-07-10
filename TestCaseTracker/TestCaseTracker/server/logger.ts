/**
 * Simple logger utility for server-side logging
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = (process.env.LOG_LEVEL as keyof typeof LogLevel) || 'INFO';
const CURRENT_LOG_LEVEL = LogLevel[LOG_LEVEL] || LogLevel.INFO;

function getTimestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(`[${getTimestamp()}] DEBUG:`, message, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
      console.info(`[${getTimestamp()}] INFO:`, message, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(`[${getTimestamp()}] WARN:`, message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(`[${getTimestamp()}] ERROR:`, message, ...args);
    }
  },
};
