/**
 * Background task tracker.
 *
 * Provides a central place to track fire-and-forget promises so that:
 * 1. In production — they run exactly as before (non-blocking, errors logged)
 * 2. In tests — `flush()` can be called to await all pending operations
 *    before cleaning up test data, preventing FK violations and race conditions.
 *
 * Usage in services:
 *   backgroundTasks.run(
 *     emailService.sendConfirmation(data),
 *     'confirmation-email',
 *   );
 *
 * Usage in tests:
 *   await backgroundTasks.flush();
 *   await cleanupTestData();
 */

import { logger } from './logger.js';

class BackgroundTaskTracker {
  private pending = new Set<Promise<unknown>>();

  /**
   * Track a fire-and-forget promise. The promise is executed immediately.
   * Errors are caught and logged — they never propagate to the caller.
   * The promise is automatically removed from the tracker when it settles.
   */
  run(promise: Promise<unknown>, label?: string): void {
    const tracked = promise.catch((err) => {
      logger.error(`[background${label ? `:${label}` : ''}] ${err instanceof Error ? err.message : String(err)}`);
    }).finally(() => {
      this.pending.delete(tracked);
    });
    this.pending.add(tracked);
  }

  /**
   * Wait for all currently-tracked background tasks to settle.
   * Used by test cleanup to ensure no in-flight DB writes remain.
   * Safe to call in production (no-op if nothing is pending).
   */
  async flush(): Promise<void> {
    if (this.pending.size === 0) return;
    await Promise.allSettled([...this.pending]);
  }

  /** Number of currently in-flight tasks (useful for debugging). */
  get size(): number {
    return this.pending.size;
  }
}

export const backgroundTasks = new BackgroundTaskTracker();
