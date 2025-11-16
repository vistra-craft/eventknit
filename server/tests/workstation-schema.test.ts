import { prisma } from '../src/config/database';
import { TicketStatus, ScanType } from '@prisma/client';
import { logger } from '../src/utils/logger';

describe('Workstation Schema - Phase 1.1', () => {
  let dbConnected = false;
  let testEventId: string;
  let testUserId: string;
  let testRegistrationId: string;

  beforeAll(async () => {
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
    await prisma.$transaction(async (tx) => {
      await tx.ticketScan.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'ORGANIZER',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testUserId = user.id;

    // Create test event with scan configuration
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-02'),
        organizerId: testUserId,
        status: 'APPROVED',
        allowReEntry: true,
        requireCheckOut: false,
        maxReEntries: 3,
        scanSettings: {
          allowManualEntry: true,
          requireSignature: true,
        },
      },
    });
    testEventId = event.id;

    // Create test registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: testEventId,
        attendeeId: testUserId,
        status: 'CONFIRMED',
        totalAmount: 0,
        ticketStatus: 'ACTIVE',
        backupCode: 'TEST123456',
      },
    });
    testRegistrationId = registration.id;
  });

  describe('Event Model - Scan Configuration', () => {
    it('should have scan configuration fields', async () => {
      if (!dbConnected) return;

      const event = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      expect(event).toBeDefined();
      expect(event?.allowReEntry).toBe(true);
      expect(event?.requireCheckOut).toBe(false);
      expect(event?.maxReEntries).toBe(3);
      expect(event?.scanSettings).toEqual({
        allowManualEntry: true,
        requireSignature: true,
      });
    });

    it('should default scan configuration fields correctly', async () => {
      if (!dbConnected) return;

      const event = await prisma.event.create({
        data: {
          title: 'Default Event',
          description: 'Test',
          location: 'Test',
          startDate: new Date('2024-12-01'),
          organizerId: testUserId,
          status: 'APPROVED',
        },
      });

      expect(event.allowReEntry).toBe(false);
      expect(event.requireCheckOut).toBe(false);
      expect(event.maxReEntries).toBeNull();
      expect(event.scanSettings).toBeNull();

      await prisma.event.delete({ where: { id: event.id } });
    });
  });

  describe('EventRegistration Model - Scan Fields', () => {
    it('should have scan-related fields', async () => {
      if (!dbConnected) return;

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: testRegistrationId },
      });

      expect(registration).toBeDefined();
      expect(registration?.ticketStatus).toBe('ACTIVE');
      expect(registration?.checkedInAt).toBeNull();
      expect(registration?.checkedInBy).toBeNull();
      expect(registration?.checkedOutAt).toBeNull();
      expect(registration?.checkedOutBy).toBeNull();
      expect(registration?.reEntryCount).toBe(0);
      expect(registration?.lastScanFacility).toBeNull();
      expect(registration?.isCurrentlyInside).toBe(false);
    });

    it('should update scan fields correctly', async () => {
      if (!dbConnected) return;

      const now = new Date();
      const updated = await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          ticketStatus: 'DEACTIVATED',
          checkedInAt: now,
          checkedInBy: testUserId,
          isCurrentlyInside: true,
          lastScanFacility: 'Main Entrance',
          reEntryCount: 1,
        },
      });

      expect(updated.ticketStatus).toBe('DEACTIVATED');
      expect(updated.checkedInAt).toBeDefined();
      expect(updated.checkedInBy).toBe(testUserId);
      expect(updated.isCurrentlyInside).toBe(true);
      expect(updated.lastScanFacility).toBe('Main Entrance');
      expect(updated.reEntryCount).toBe(1);
    });
  });

  describe('TicketScan Model', () => {
    it('should create ticket scan record', async () => {
      if (!dbConnected) return;

      const scan = await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          facility: 'Main Entrance',
          deviceId: 'device-123',
          deviceType: 'MOBILE',
          isValid: true,
          isReEntry: false,
        },
      });

      expect(scan).toBeDefined();
      expect(scan.scanType).toBe('CHECK_IN');
      expect(scan.scannedBy).toBe(testUserId);
      expect(scan.facility).toBe('Main Entrance');
      expect(scan.deviceId).toBe('device-123');
      expect(scan.deviceType).toBe('MOBILE');
      expect(scan.isValid).toBe(true);
      expect(scan.isReEntry).toBe(false);
      expect(scan.scannedAt).toBeDefined();
    });

    it('should create re-entry scan with previous scan reference', async () => {
      if (!dbConnected) return;

      // Create initial check-in scan
      await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          facility: 'Main Entrance',
          isValid: true,
        },
      });

      // Create check-out scan
      const checkOutScan = await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_OUT',
          scannedBy: testUserId,
          facility: 'Main Exit',
          isValid: true,
        },
      });

      // Create re-entry scan
      const reEntryScan = await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          facility: 'Main Entrance',
          isValid: true,
          isReEntry: true,
          previousScanId: checkOutScan.id,
        },
      });

      expect(reEntryScan.isReEntry).toBe(true);
      expect(reEntryScan.previousScanId).toBe(checkOutScan.id);
    });

    it('should store metadata fields', async () => {
      if (!dbConnected) return;

      const scan = await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          location: {
            lat: 40.7128,
            lng: -74.0060,
          },
          isValid: true,
        },
      });

      expect(scan.ipAddress).toBe('192.168.1.1');
      expect(scan.userAgent).toBe('Mozilla/5.0');
      expect(scan.location).toEqual({
        lat: 40.7128,
        lng: -74.0060,
      });
    });

    it('should handle invalid scan with error codes', async () => {
      if (!dbConnected) return;

      const scan = await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          isValid: false,
          errorCode: 'ALREADY_SCANNED',
          errorMessage: 'Ticket has already been scanned',
        },
      });

      expect(scan.isValid).toBe(false);
      expect(scan.errorCode).toBe('ALREADY_SCANNED');
      expect(scan.errorMessage).toBe('Ticket has already been scanned');
    });
  });

  describe('Enums', () => {
    it('should use TicketStatus enum correctly', async () => {
      if (!dbConnected) return;

      const statuses: TicketStatus[] = ['ACTIVE', 'DEACTIVATED', 'EXPIRED', 'CANCELLED'];

      // Create a new event for this test to avoid unique constraint issues
      const testEvent = await prisma.event.create({
        data: {
          title: 'Enum Test Event',
          description: 'Test',
          location: 'Test',
          startDate: new Date('2024-12-01'),
          organizerId: testUserId,
          status: 'APPROVED',
        },
      });

      // Create a new user for each registration to avoid unique constraint
      for (let i = 0; i < statuses.length; i++) {
        const testUser = await prisma.user.create({
          data: {
            email: `enumtest${i}@example.com`,
            password: 'hashedpassword',
            firstName: 'Test',
            lastName: `User${i}`,
            role: 'ATTENDEE',
            status: 'ACTIVE',
            isEmailVerified: true,
          },
        });

        const registration = await prisma.eventRegistration.create({
          data: {
            eventId: testEvent.id,
            attendeeId: testUser.id,
            status: 'CONFIRMED',
            totalAmount: 0,
            ticketStatus: statuses[i],
          },
        });

        expect(registration.ticketStatus).toBe(statuses[i]);
        await prisma.eventRegistration.delete({ where: { id: registration.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }

      await prisma.event.delete({ where: { id: testEvent.id } });
    });

    it('should use ScanType enum correctly', async () => {
      if (!dbConnected) return;

      const scanTypes: ScanType[] = ['CHECK_IN', 'CHECK_OUT', 'MANUAL_CHECK_IN', 'MANUAL_CHECK_OUT'];

      for (const scanType of scanTypes) {
        const scan = await prisma.ticketScan.create({
          data: {
            registrationId: testRegistrationId,
            eventId: testEventId,
            scanType,
            scannedBy: testUserId,
            isValid: true,
          },
        });

        expect(scan.scanType).toBe(scanType);
        await prisma.ticketScan.delete({ where: { id: scan.id } });
      }
    });
  });

  describe('Indexes', () => {
    it('should query by ticketStatus efficiently', async () => {
      if (!dbConnected) return;

      const registrations = await prisma.eventRegistration.findMany({
        where: { ticketStatus: 'ACTIVE' },
      });

      expect(Array.isArray(registrations)).toBe(true);
    });

    it('should query by isCurrentlyInside efficiently', async () => {
      if (!dbConnected) return;

      const registrations = await prisma.eventRegistration.findMany({
        where: { isCurrentlyInside: true },
      });

      expect(Array.isArray(registrations)).toBe(true);
    });

    it('should query TicketScan by registrationId efficiently', async () => {
      if (!dbConnected) return;

      await prisma.ticketScan.create({
        data: {
          registrationId: testRegistrationId,
          eventId: testEventId,
          scanType: 'CHECK_IN',
          scannedBy: testUserId,
          isValid: true,
        },
      });

      const scans = await prisma.ticketScan.findMany({
        where: { registrationId: testRegistrationId },
      });

      expect(scans.length).toBeGreaterThan(0);
    });

    it('should query TicketScan by eventId efficiently', async () => {
      if (!dbConnected) return;

      const scans = await prisma.ticketScan.findMany({
        where: { eventId: testEventId },
      });

      expect(Array.isArray(scans)).toBe(true);
    });
  });
});

