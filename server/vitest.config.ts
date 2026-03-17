/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/teardown.ts'],
    // Sequential execution to avoid DB race conditions
    sequence: {
      concurrent: false,
    },
    maxConcurrency: 1,
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 60000,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
    env: {
      NODE_ENV: 'development',
    },
    teardownTimeout: 5000,
    // Force exit after tests (equivalent to Jest's forceExit)
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
