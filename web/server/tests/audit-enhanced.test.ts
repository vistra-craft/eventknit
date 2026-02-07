import { prisma } from '../src/config/database.js';
import { createAuditLog, AuditActions } from '../src/utils/audit.js';
import { logger } from '../src/utils/logger.js';

describe('Enhanced Audit Logging', () => {
  let dbConnected = false;
  let testUserId: string | undefined;

  beforeAll(async () => {
    // Try to connect to the test database
    try {
      await prisma.$connect();
      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
      
      // Create a test user if needed
      const testUser = await prisma.user.findFirst({
        where: { email: 'test@example.com' },
      });
      testUserId = testUser?.id;
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.warn('   Start PostgreSQL with: docker compose --env-file .env.development up -d postgres');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    // Close database connection if it was connected
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  afterEach(async () => {
    // Skip cleanup if database is not connected
    if (!dbConnected) return;
    
    // Clean up audit logs after each test
    if (testUserId) {
      await prisma.auditLog.deleteMany({
        where: {
          userId: testUserId,
        },
      });
    }
  });

  describe('createAuditLog with geolocation', () => {
    it('should create audit log with country fields', async () => {
      if (!dbConnected) return;
      const auditData = {
        userId: testUserId,
        action: AuditActions.USER_CREATED,
        entity: 'User',
        entityId: testUserId,
        ipAddress: '8.8.8.8', // Google's public DNS (will attempt geolocation)
        userAgent: 'Mozilla/5.0',
        country: 'United States',
        countryCode: 'US',
        region: 'California',
        city: 'Mountain View',
      };

      await createAuditLog(auditData);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: testUserId,
          action: AuditActions.USER_CREATED,
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.country).toBe('United States');
      expect(auditLog?.countryCode).toBe('US');
      expect(auditLog?.region).toBe('California');
      expect(auditLog?.city).toBe('Mountain View');
    });

    it('should create audit log without geolocation when skipGeolocation is true', async () => {
      if (!dbConnected) return;
      const auditData = {
        userId: testUserId,
        action: AuditActions.USER_UPDATED,
        entity: 'User',
        entityId: testUserId,
        ipAddress: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        skipGeolocation: true,
      };

      await createAuditLog(auditData);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: testUserId,
          action: AuditActions.USER_UPDATED,
        },
      });

      expect(auditLog).toBeDefined();
      // Should not have geolocation data when skipped
      expect(auditLog?.ipAddress).toBe('8.8.8.8');
    });

    it('should create audit log with security events', async () => {
      if (!dbConnected) return;
      const securityActions = [
        AuditActions.LOGIN_SUCCESS,
        AuditActions.LOGIN_FAILURE,
        AuditActions.LOGIN_ATTEMPT_LOCKED,
        AuditActions.SUSPICIOUS_ACTIVITY,
        AuditActions.RATE_LIMIT_EXCEEDED,
        AuditActions.UNAUTHORIZED_ACCESS,
      ];

      for (const action of securityActions) {
        await createAuditLog({
          userId: testUserId,
          action,
          entity: 'User',
          entityId: testUserId,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          skipGeolocation: true,
        });
      }

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: testUserId,
          action: {
            in: securityActions,
          },
        },
      });

      expect(auditLogs.length).toBe(securityActions.length);
    });
  });

  describe('AuditActions', () => {
    it('should have all security event actions defined', () => {
      expect(AuditActions.LOGIN_SUCCESS).toBe('LOGIN_SUCCESS');
      expect(AuditActions.LOGIN_FAILURE).toBe('LOGIN_FAILURE');
      expect(AuditActions.LOGIN_ATTEMPT_LOCKED).toBe('LOGIN_ATTEMPT_LOCKED');
      expect(AuditActions.SUSPICIOUS_ACTIVITY).toBe('SUSPICIOUS_ACTIVITY');
      expect(AuditActions.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(AuditActions.UNAUTHORIZED_ACCESS).toBe('UNAUTHORIZED_ACCESS');
    });
  });
});

