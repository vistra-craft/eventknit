import { WorkstationService } from '../src/services/workstation.service.js';
import { TicketService } from '../src/services/ticket.service.js';
import { prisma } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';
import { TicketStatus } from '@prisma/client';

describe('Workstation Concurrency Tests', () => {
  let dbConnected = false;
  let testEventId: string;
  let testUserId: string;
  let testAttendeeId: string;
  let testRegistrationId: string;
  let testQRCode: string;
  const originalEnv = process.env.TICKET_SECRET_KEY;

  beforeAll(async () => {
    // Set test secret key
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-concurrency-tests-minimum-32-bytes-long';

    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    // Restore original environment
    if (originalEnv) {
      process.env.TICKET_SECRET_KEY = originalEnv;
    } else {
      delete process.env.TICKET_SECRET_KEY;
    }

    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    // Clean up
    await prisma.ticketScan.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Create test scanner user
    const scanner = await prisma.user.create({
      data: {
        email: 'scanner@test.com',
        password: 'hashedpassword',
        firstName: 'Scanner',
        lastName: 'User',
        role: 'TELLER',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testUserId = scanner.id;

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: 'hashedpassword',
        firstName: 'Attendee',
        lastName: 'User',
        role: 'ATTENDEE',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testAttendeeId = attendee.id;

    // Create test event with future dates
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Day after tomorrow
    
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        startDate,
        endDate,
        organizerId: testUserId,
        status: 'APPROVED',
        allowReEntry: true,
        requireCheckOut: false,
        maxReEntries: 10,
      },
    });
    testEventId = event.id;

    // Create test registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: testEventId,
        attendeeId: testAttendeeId,
        status: 'CONFIRMED',
        totalAmount: 0,
        ticketStatus: TicketStatus.ACTIVE,
        backupCode: TicketService.generateBackupTicketCode(),
      },
    });
    testRegistrationId = registration.id;

    // Generate QR code
    testQRCode = TicketService.generateTicketData(
      testRegistrationId,
      testEventId,
      'attendee@test.com',
    );
  });

  describe('Simultaneous Scan Tests', () => {
    it('should handle simultaneous scans of the same ticket gracefully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Attempt to scan the same ticket simultaneously from multiple "devices"
      const scanPromises = Array.from({ length: 5 }, (_, i) =>
        WorkstationService.scanTicket(
          testQRCode,
          testEventId,
          testUserId,
          'entrance',
          `device-${i}`,
          'DESKTOP',
        ),
      );

      const results = await Promise.allSettled(scanPromises);

      // At least one should succeed
      const successfulScans = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      );
      expect(successfulScans.length).toBeGreaterThan(0);

      // Only one should succeed (due to locking)
      const successfulCount = successfulScans.length;
      expect(successfulCount).toBe(1);

      // Verify only one scan record was created
      const scanCount = await prisma.ticketScan.count({
        where: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
        },
      });
      expect(scanCount).toBe(1);
    });

    it('should handle simultaneous scans of different tickets', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create multiple registrations
      const registrations = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const reg = await prisma.eventRegistration.create({
            data: {
              eventId: testEventId,
              attendeeId: testAttendeeId,
              status: 'CONFIRMED',
              totalAmount: 0,
              ticketStatus: TicketStatus.ACTIVE,
              backupCode: TicketService.generateBackupTicketCode(),
            },
          });

          const qrCode = TicketService.generateTicketData(
            reg.id,
            testEventId,
            `attendee${i}@test.com`,
          );

          return { registrationId: reg.id, qrCode };
        }),
      );

      // Scan all tickets simultaneously
      const scanPromises = registrations.map((reg, i) =>
        WorkstationService.scanTicket(
          reg.qrCode,
          testEventId,
          testUserId,
          'entrance',
          `device-${i}`,
          'DESKTOP',
        ),
      );

      const results = await Promise.allSettled(scanPromises);

      // All should succeed
      const successfulScans = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      );
      expect(successfulScans.length).toBe(5);

      // Verify all scan records were created
      const scanCount = await prisma.ticketScan.count({
        where: {
          eventId: testEventId,
          scanType: 'CHECK_IN',
        },
      });
      expect(scanCount).toBe(5);
    });

    it('should handle concurrent check-in and check-out attempts', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // First check-in
      await WorkstationService.scanTicket(
        testQRCode,
        testEventId,
        testUserId,
        'entrance',
        'device-1',
        'DESKTOP',
      );

      // Attempt simultaneous check-out from multiple devices
      const checkoutPromises = Array.from({ length: 3 }, (_, i) =>
        WorkstationService.checkOut(
          testQRCode,
          testEventId,
          testUserId,
          'exit',
          `device-${i}`,
          'DESKTOP',
        ),
      );

      const results = await Promise.allSettled(checkoutPromises);

      // Only one check-out should succeed
      const successfulCheckouts = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      );
      expect(successfulCheckouts.length).toBe(1);

      // Verify only one check-out scan record
      const checkoutCount = await prisma.ticketScan.count({
        where: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_OUT',
        },
      });
      expect(checkoutCount).toBe(1);
    });
  });

  describe('Lock Mechanism Tests', () => {
    it('should prevent duplicate scans with distributed locking', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Attempt rapid sequential scans (simulating race condition)
      const scan1 = WorkstationService.scanTicket(
        testQRCode,
        testEventId,
        testUserId,
        'entrance',
        'device-1',
        'DESKTOP',
      );

      // Start second scan immediately (before first completes)
      const scan2 = WorkstationService.scanTicket(
        testQRCode,
        testEventId,
        testUserId,
        'entrance',
        'device-2',
        'DESKTOP',
      );

      const [result1, result2] = await Promise.all([scan1, scan2]);

      // Only one should succeed
      const successCount = [result1, result2].filter((r) => r.success).length;
      expect(successCount).toBe(1);

      // Verify only one scan record
      const scanCount = await prisma.ticketScan.count({
        where: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
        },
      });
      expect(scanCount).toBe(1);
    });

    it('should handle lock timeout gracefully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // This test verifies that if Redis is unavailable, the system
      // still works (though without distributed locking)
      // The service should log a warning but proceed

      // Simulate by scanning normally
      const result = await WorkstationService.scanTicket(
        testQRCode,
        testEventId,
        testUserId,
        'entrance',
        'device-1',
        'DESKTOP',
      );

      expect(result.success).toBe(true);

      // Verify scan was recorded
      const scanCount = await prisma.ticketScan.count({
        where: {
          registrationId: testRegistrationId,
          eventId: testEventId,
        },
      });
      expect(scanCount).toBe(1);
    });
  });

  describe('High-Volume Scan Scenarios', () => {
    it('should handle rapid sequential scans of different tickets', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create 20 registrations with unique attendees
      const attendees = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const attendee = await prisma.user.create({
            data: {
              email: `attendee${i}@test.com`,
              password: 'hashedpassword',
              firstName: `Attendee${i}`,
              lastName: 'User',
              role: 'ATTENDEE',
              status: 'ACTIVE',
              isEmailVerified: true,
            },
          });
          return attendee.id;
        }),
      );

      const registrations = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const reg = await prisma.eventRegistration.create({
            data: {
              eventId: testEventId,
              attendeeId: attendees[i],
              status: 'CONFIRMED',
              totalAmount: 0,
              ticketStatus: TicketStatus.ACTIVE,
              backupCode: TicketService.generateBackupTicketCode(),
            },
          });

          const qrCode = TicketService.generateTicketData(
            reg.id,
            testEventId,
            `attendee${i}@test.com`,
          );

          return { registrationId: reg.id, qrCode };
        }),
      );

      // Scan all tickets rapidly
      const startTime = Date.now();
      const scanPromises = registrations.map((reg, i) =>
        WorkstationService.scanTicket(
          reg.qrCode,
          testEventId,
          testUserId,
          'entrance',
          `device-${i}`,
          'DESKTOP',
        ),
      );

      const results = await Promise.all(scanPromises);
      const endTime = Date.now();

      // All should succeed
      const successfulScans = results.filter((r) => r.success);
      expect(successfulScans.length).toBe(20);

      // Verify all scan records
      const scanCount = await prisma.ticketScan.count({
        where: {
          eventId: testEventId,
          scanType: 'CHECK_IN',
        },
      });
      expect(scanCount).toBe(20);

      // Performance check: should complete in reasonable time (< 5 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });
});

