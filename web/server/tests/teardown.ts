// Global teardown file for Jest
// This file runs after all tests complete
// Note: Jobs should not be running during tests (they're only initialized in server.ts)
// This teardown is a safety measure to ensure cleanup

export default async function globalTeardown(): Promise<void> {
  // Use a timeout to ensure this doesn't hang
  const timeout = new Promise<void>((resolve) => {
     
    setTimeout(() => {
      console.log('⚠️  Teardown timeout - forcing exit');
      resolve();
    }, 5000); // 5 second timeout
  });

  const teardown = async () => {
    try {
      // Try to stop jobs if they exist (they shouldn't in test environment)
      try {
        const jobModule = await import('../src/jobs/index.js').catch(() => null);
        if (jobModule?.stopJobs) {
          jobModule.stopJobs();
        }
      } catch {
        // Jobs module not available or jobs not running - this is expected
      }

      // Try to close database connection
      try {
        const dbModule = await import('../src/config/database.js').catch(() => null);
        if (dbModule?.prisma) {
          await dbModule.prisma.$disconnect().catch(() => {
            // Already disconnected or error - ignore
          });
        }
      } catch {
        // Database module not available - ignore
      }
    } catch (_error) {
      // Silently ignore all errors - we want tests to complete
    }
  };

  // Race between teardown and timeout
  await Promise.race([teardown(), timeout]);
}

