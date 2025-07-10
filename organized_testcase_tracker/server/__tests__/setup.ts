
import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'testdb';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_SSL = 'false';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});
