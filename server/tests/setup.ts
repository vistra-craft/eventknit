// Test setup file for Vitest
// This file runs before each test file

// NODE_ENV is set to 'development' via vitest.config.ts env option so that
// src/config/index.ts loads .env.development.

// NOTE: Each test file is responsible for setting up its own database connection
// and cleaning up data. This global setup does not connect to the database.
//
// IMPORTANT: Cron jobs are NOT initialized when importing app.ts
// They are only initialized in server.ts, which is not imported by tests.
// However, we still stop them in teardown as a safety measure.
