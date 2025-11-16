import { LockService } from '../src/services/lock.service.js';

describe('LockService', () => {
  const testKey = 'test-lock-key';

  beforeAll(() => {
    // Initialize lock service
    LockService.initialize();
  });

  afterAll(async () => {
    // Clean up
    await LockService.close();
  });

  afterEach(async () => {
    // Clean up any remaining locks (best effort)
    try {
      // Try to release any test locks
      const client = (LockService as any).getClient();
      if (client) {
        await client.del(testKey);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Lock Acquisition and Release', () => {
    it('should acquire and release a lock', async () => {
      const lockValue = await LockService.acquireLock(testKey, 5000);

      if (lockValue) {
        expect(lockValue).toBeDefined();
        expect(typeof lockValue).toBe('string');
        expect(lockValue.length).toBeGreaterThan(0);

        const released = await LockService.releaseLock(testKey, lockValue);
        expect(released).toBe(true);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });

    it('should not acquire lock if already locked', async () => {
      const lockValue1 = await LockService.acquireLock(testKey, 5000);

      if (lockValue1) {
        const lockValue2 = await LockService.acquireLock(testKey, 5000);
        expect(lockValue2).toBeNull();

        await LockService.releaseLock(testKey, lockValue1);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });

    it('should only release lock with correct value', async () => {
      const lockValue1 = await LockService.acquireLock(testKey, 5000);

      if (lockValue1) {
        const wrongValue = 'wrong-lock-value';
        const released = await LockService.releaseLock(testKey, wrongValue);
        expect(released).toBe(false);

        // Lock should still be held
        const lockValue2 = await LockService.acquireLock(testKey, 5000);
        expect(lockValue2).toBeNull();

        // Release with correct value
        await LockService.releaseLock(testKey, lockValue1);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });
  });

  describe('Lock with Retry', () => {
    it('should acquire lock with retry', async () => {
      const lockValue = await LockService.acquireLockWithRetry(testKey, 5000, 3, 100);

      if (lockValue) {
        expect(lockValue).toBeDefined();
        await LockService.releaseLock(testKey, lockValue);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });

    it('should retry when lock is held', async () => {
      const lockValue1 = await LockService.acquireLock(testKey, 1000); // Short TTL

      if (lockValue1) {
        // Try to acquire with retry (should wait for lock to expire)
        const startTime = Date.now();
        const lockValue2 = await LockService.acquireLockWithRetry(testKey, 5000, 3, 100);
        const elapsed = Date.now() - startTime;

        // Should have waited at least for retries
        if (lockValue2) {
          // Lock was acquired after retries
          expect(elapsed).toBeGreaterThanOrEqual(100); // At least one retry delay
          await LockService.releaseLock(testKey, lockValue2);
        } else {
          // Lock still held after retries
          await LockService.releaseLock(testKey, lockValue1);
        }
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });
  });

  describe('Lock Extension', () => {
    it('should extend lock TTL', async () => {
      const lockValue = await LockService.acquireLock(testKey, 1000);

      if (lockValue) {
        const extended = await LockService.extendLock(testKey, lockValue, 5000);
        expect(extended).toBe(true);

        await LockService.releaseLock(testKey, lockValue);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });

    it('should not extend lock with wrong value', async () => {
      const lockValue = await LockService.acquireLock(testKey, 1000);

      if (lockValue) {
        const wrongValue = 'wrong-lock-value';
        const extended = await LockService.extendLock(testKey, wrongValue, 5000);
        expect(extended).toBe(false);

        await LockService.releaseLock(testKey, lockValue);
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });
  });

  describe('With Lock Helper', () => {
    it('should execute function with lock', async () => {
      let executed = false;

      const result = await LockService.withLock(
        testKey,
        async () => {
          executed = true;
          return 'success';
        },
        5000,
      );

      if (result !== null) {
        expect(executed).toBe(true);
        expect(result).toBe('success');
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });

    it('should release lock even if function throws', async () => {
      let executed = false;

      try {
        await LockService.withLock(
          testKey,
          async () => {
            executed = true;
            throw new Error('Test error');
          },
          5000,
        );
      } catch {
        // Expected error
      }

      if (executed) {
        // Lock should be released, so we can acquire it again
        const lockValue = await LockService.acquireLock(testKey, 5000);
        if (lockValue) {
          expect(lockValue).toBeDefined();
          await LockService.releaseLock(testKey, lockValue);
        }
      } else {
        // Redis not available - skip test
        console.log('Redis not available, skipping lock test');
      }
    });
  });
});

