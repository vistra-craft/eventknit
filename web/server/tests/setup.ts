// Test setup file for Jest
// This file runs before each test file

// Ensure NODE_ENV is set to 'test' for rate limiter and other test-specific behavior
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Set test timeout
// Use longer timeout for sequential execution (maxWorkers: 1 in jest.config.cjs)
// In CI, you might want parallel execution for speed, but sequential is safer for database tests
const timeout = process.env.CI === 'true' ? 30000 : 60000;
jest.setTimeout(timeout);

// NOTE: Each test file is responsible for setting up its own database connection
// and cleaning up data. This global setup does not connect to the database.
//
// IMPORTANT: Cron jobs are NOT initialized when importing app.ts
// They are only initialized in server.ts, which is not imported by tests.
// However, we still stop them in teardown.ts as a safety measure.

