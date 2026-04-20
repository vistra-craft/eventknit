// Global teardown file for Vitest
// This file runs after all tests complete
// Note: Jobs should not be running during tests (they're only initialized in server.ts)
// This teardown is a safety measure to ensure cleanup

export async function teardown(): Promise<void> {
  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('Teardown timeout - forcing exit');
      resolve();
    }, 5000);
  });

  const cleanup = async () => {
    try {
      try {
        const jobModule = await import('../src/jobs/index.js').catch(() => null);
        if (jobModule?.stopJobs) {
          jobModule.stopJobs();
        }
      } catch {
        // Jobs module not available or jobs not running - expected
      }

      try {
        const dbModule = await import('../src/config/database.js').catch(() => null);
        if (dbModule?.prisma) {
          await dbModule.prisma.$disconnect().catch(() => {});
        }
      } catch {
        // Database module not available - ignore
      }
    } catch {
      // Silently ignore all errors
    }
  };

  await Promise.race([cleanup(), timeout]);
}
