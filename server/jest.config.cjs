module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
        },
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  globalTeardown: "<rootDir>/tests/teardown.ts",
  // Run tests sequentially to avoid database race conditions
  // This prevents tests from interfering with each other
  maxWorkers: 1,
  // Force exit after tests to prevent hanging on open handles
  // This is safe because we handle cleanup in teardown
  forceExit: true,
  // Detect open handles to help identify leaks
  detectOpenHandles: false, // Set to true for debugging
  // Global test timeout (can be overridden per test)
  testTimeout: 120000, // 120 seconds default timeout
};
