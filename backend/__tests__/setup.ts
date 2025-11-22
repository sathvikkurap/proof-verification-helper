import { jest } from '@jest/globals';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.OLLAMA_ENABLED = 'false'; // Disable Ollama for tests
