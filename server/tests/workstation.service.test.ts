import { WorkstationService } from '../src/services/workstation.service.js';
import { TicketService } from '../src/services/ticket.service.js';
import { prisma } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';
import { cleanupTestData } from './test-helpers.js';

describe('WorkstationService', () => {
  let dbConnected = false;
  let testEventId: string;
  let testUserId: string;
  let testAttendeeId: string;
  let testRegistrationId: string;
  let testBackupCode: string;
  let testQRCode: string;
  let testScannerId: string;
  const originalEnv = process.env.TICKET_SECRET_KEY;

  beforeAll(async () => {
    // Set test secret key
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-workstation-service-minimum-32-bytes-long';
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
    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Organizer',
        role: 'ORGANIZER',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testUserId = organizer.id;

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Attendee',
        role: 'ATTENDEE',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testAttendeeId = attendee.id;

    // Create test scanner (staff)
    const scanner = await prisma.user.create({
      data: {
        email: 'scanner@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Scanner',
        role: 'ORGANIZER_STAFF',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    testScannerId = scanner.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Day after tomorrow
        organizerId: testUserId,
        status: 'APPROVED',
        allowReEntry: true,
        requireCheckOut: false,
      },
    });
    testEventId = event.id;

    // Create test registration
    testBackupCode = TicketService.generateBackupTicketCode();
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: testEventId,
        attendeeId: testAttendeeId,
        status: 'CONFIRMED',
        totalAmount: 0,
        ticketStatus: 'ACTIVE',
        backupCode: testBackupCode,
      },
    });
    testRegistrationId = registration.id;

    // Generate QR code
    testQRCode = TicketService.generateTicketData(
      testRegistrationId,
      testEventId,
      'attendee@example.com',
    );
  });

  describe('validateTicket', () => {
    it('should validate a valid QR code ticket', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.validateTicket(testQRCode, testEventId);

      expect(result.isValid).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);
      expect(result.eventId).toBe(testEventId);
      expect(result.codeType).toBe('QR_CODE');
      expect(result.signatureVerified).toBe(true);
    });

    it('should validate a valid backup code', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.validateTicket(testBackupCode, testEventId);

      expect(result.isValid).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);
      expect(result.eventId).toBe(testEventId);
      expect(result.codeType).toBe('BACKUP_CODE');
    });

    it('should reject QR code with invalid signature', async () => {
      if (!dbConnected) return;

      const invalidQR = `${testRegistrationId}|${testEventId}|attendee@example.com|${Date.now()}|invalid-signature`;
      const result = await WorkstationService.validateTicket(invalidQR, testEventId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_SIGNATURE');
    });

    it('should reject invalid backup code', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.validateTicket('INVALID123', testEventId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_TICKET');
    });

    it('should reject ticket for wrong event', async () => {
      if (!dbConnected) return;

      // Create another event
      const otherEvent = await prisma.event.create({
        data: {
          title: 'Other Event',
          description: 'Test',
          location: 'Test',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizerId: testUserId,
          status: 'APPROVED',
        },
      });

      const result = await WorkstationService.validateTicket(testQRCode, otherEvent.id);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('WRONG_EVENT');

      await prisma.event.delete({ where: { id: otherEvent.id } });
    });

    it('should reject ticket with expired status', async () => {
      if (!dbConnected) return;

      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { ticketStatus: 'EXPIRED' },
      });

      const result = await WorkstationService.validateTicket(testQRCode, testEventId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { ticketStatus: 'ACTIVE' },
      });
    });

    it('should reject ticket with cancelled status', async () => {
      if (!dbConnected) return;

      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { ticketStatus: 'CANCELLED' },
      });

      const result = await WorkstationService.validateTicket(testQRCode, testEventId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('RESTRICTED');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { ticketStatus: 'ACTIVE' },
      });
    });

    it('should reject ticket for unconfirmed registration', async () => {
      if (!dbConnected) return;

      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { status: 'PENDING' },
      });

      const result = await WorkstationService.validateTicket(testQRCode, testEventId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('RESTRICTED');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: { status: 'CONFIRMED' },
      });
    });
  });

  describe('scanTicket', () => {
    it('should successfully scan a QR code ticket', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.scanTicket(
        testQRCode,
        testEventId,
        testScannerId,
        'Main Entrance',
        'device-123',
        'MOBILE',
      );

      expect(result.success).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);
      expect(result.checkedInAt).toBeDefined();

      // Verify registration was updated
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: testRegistrationId },
      });

      expect(registration?.checkedInAt).toBeDefined();
      expect(registration?.checkedInBy).toBe(testScannerId);
      expect(registration?.ticketStatus).toBe('DEACTIVATED');
      expect(registration?.isCurrentlyInside).toBe(true);
      expect(registration?.lastScanFacility).toBe('Main Entrance');

      // Verify scan record was created
      const scan = await prisma.ticketScan.findFirst({
        where: { registrationId: testRegistrationId },
      });

      expect(scan).toBeDefined();
      expect(scan?.scanType).toBe('CHECK_IN');
      expect(scan?.scannedBy).toBe(testScannerId);
      expect(scan?.facility).toBe('Main Entrance');
      expect(scan?.deviceId).toBe('device-123');
      expect(scan?.deviceType).toBe('MOBILE');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          lastScanFacility: null,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should successfully scan a backup code', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.scanTicket(
        testBackupCode,
        testEventId,
        testScannerId,
        'Side Entrance',
      );

      expect(result.success).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          lastScanFacility: null,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject scanning an already scanned ticket', async () => {
      if (!dbConnected) return;

      // First scan
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Try to scan again
      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_SCANNED');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject invalid ticket code', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.scanTicket(
        'INVALID123',
        testEventId,
        testScannerId,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBeDefined();
    });
  });

  describe('checkOut', () => {
    it('should successfully check out a ticket', async () => {
      if (!dbConnected) return;

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Check out
      const result = await WorkstationService.checkOut(
        testRegistrationId,
        testScannerId,
        'Main Exit',
        'device-123',
        'MOBILE',
      );

      expect(result.success).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);
      expect(result.checkedOutAt).toBeDefined();

      // Verify registration was updated
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: testRegistrationId },
      });

      expect(registration?.checkedOutAt).toBeDefined();
      expect(registration?.checkedOutBy).toBe(testScannerId);
      expect(registration?.isCurrentlyInside).toBe(false);
      expect(registration?.ticketStatus).toBe('ACTIVE'); // Set to ACTIVE for re-entry

      // Verify scan record was created
      const scan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          scanType: 'CHECK_OUT',
        },
      });

      expect(scan).toBeDefined();
      expect(scan?.scanType).toBe('CHECK_OUT');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject checkout for ticket not checked in', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.checkOut(testRegistrationId, testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_CHECKED_IN');
    });

    it('should reject checkout for non-existent registration', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.checkOut('non-existent-id', testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_TICKET');
    });
  });

  describe('Re-entry Support', () => {
    it('should get event scan configuration', async () => {
      if (!dbConnected) return;

      const config = await WorkstationService.getEventScanConfig(testEventId);

      expect(config).toBeDefined();
      expect(config?.allowReEntry).toBe(true);
      expect(config?.requireCheckOut).toBe(false);
      expect(config?.maxReEntries).toBeNull();
    });

    it('should allow re-entry when configured', async () => {
      if (!dbConnected) return;

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Check out
      await WorkstationService.checkOut(testRegistrationId, testScannerId);

      // Re-entry should work
      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      expect(result.success).toBe(true);

      // Verify re-entry count was incremented
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: testRegistrationId },
      });

      expect(registration?.reEntryCount).toBe(1);

      // Verify scan record is marked as re-entry
      const scan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          isReEntry: true,
        },
      });

      expect(scan).toBeDefined();
      expect(scan?.isReEntry).toBe(true);

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          reEntryCount: 0,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject re-entry when not allowed', async () => {
      if (!dbConnected) return;

      // Update event to disallow re-entry
      await prisma.event.update({
        where: { id: testEventId },
        data: { allowReEntry: false },
      });

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Check out
      await WorkstationService.checkOut(testRegistrationId, testScannerId);

      // Re-entry should fail
      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REENTRY_NOT_ALLOWED');

      // Reset
      await prisma.event.update({
        where: { id: testEventId },
        data: { allowReEntry: true },
      });
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          reEntryCount: 0,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should enforce max re-entries limit', async () => {
      if (!dbConnected) return;

      // Update event to allow max 2 re-entries
      await prisma.event.update({
        where: { id: testEventId },
        data: { maxReEntries: 2 },
      });

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);
      await WorkstationService.checkOut(testRegistrationId, testScannerId);

      // First re-entry
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);
      await WorkstationService.checkOut(testRegistrationId, testScannerId);

      // Second re-entry
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);
      await WorkstationService.checkOut(testRegistrationId, testScannerId);

      // Third re-entry should fail
      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MAX_REENTRIES_EXCEEDED');

      // Reset
      await prisma.event.update({
        where: { id: testEventId },
        data: { maxReEntries: null },
      });
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          reEntryCount: 0,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should require check-out before re-entry when configured', async () => {
      if (!dbConnected) return;

      // Update event to require check-out
      await prisma.event.update({
        where: { id: testEventId },
        data: { requireCheckOut: true },
      });

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Try to re-enter without checking out (should fail)
      // First, manually set ticket to ACTIVE without checking out
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });

      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHECKOUT_REQUIRED');

      // Reset
      await prisma.event.update({
        where: { id: testEventId },
        data: { requireCheckOut: false },
      });
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          reEntryCount: 0,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should link re-entry scan to previous check-out scan', async () => {
      if (!dbConnected) return;

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Check out
      const checkoutResult = await WorkstationService.checkOut(testRegistrationId, testScannerId);
      expect(checkoutResult.success).toBe(true);

      // Get the check-out scan ID
      const checkoutScan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          scanType: 'CHECK_OUT',
        },
      });

      // Re-entry
      const result = await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);
      expect(result.success).toBe(true);

      // Verify re-entry scan is linked to check-out scan
      const reEntryScan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          isReEntry: true,
        },
      });

      expect(reEntryScan).toBeDefined();
      expect(reEntryScan?.previousScanId).toBe(checkoutScan?.id);

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
          reEntryCount: 0,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });
  });

  describe('Manual Operations', () => {
    it('should search attendees by registration ID', async () => {
      if (!dbConnected) return;

      const results = await WorkstationService.searchAttendees(testRegistrationId, testEventId);

      expect(results.length).toBe(1);
      expect(results[0].registrationId).toBe(testRegistrationId);
      expect(results[0].attendeeEmail).toBe('attendee@example.com');
    });

    it('should search attendees by backup code', async () => {
      if (!dbConnected) return;

      const results = await WorkstationService.searchAttendees(testBackupCode, testEventId);

      expect(results.length).toBe(1);
      expect(results[0].registrationId).toBe(testRegistrationId);
      expect(results[0].backupCode).toBe(testBackupCode);
    });

    it('should search attendees by email', async () => {
      if (!dbConnected) return;

      const results = await WorkstationService.searchAttendees('attendee@example.com', testEventId);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].attendeeEmail).toContain('attendee@example.com');
    });

    it('should search attendees by name', async () => {
      if (!dbConnected) return;

      const results = await WorkstationService.searchAttendees('Test Attendee', testEventId);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].attendeeName).toContain('Test');
    });

    it('should return empty array for non-existent search term', async () => {
      if (!dbConnected) return;

      const results = await WorkstationService.searchAttendees('nonexistent@example.com', testEventId);

      expect(results.length).toBe(0);
    });

    it('should perform manual check-in by backup code', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.manualCheckIn(
        testBackupCode,
        testEventId,
        testScannerId,
        'Manual Entry',
      );

      expect(result.success).toBe(true);
      expect(result.isManual).toBe(true);
      expect(result.registrationId).toBe(testRegistrationId);

      // Verify scan record is marked as manual
      const scan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          scanType: 'MANUAL_CHECK_IN',
        },
      });

      expect(scan).toBeDefined();
      expect(scan?.scanType).toBe('MANUAL_CHECK_IN');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should perform manual check-in by registration ID', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.manualCheckIn(
        testRegistrationId,
        testEventId,
        testScannerId,
      );

      expect(result.success).toBe(true);
      expect(result.isManual).toBe(true);

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject manual check-in for non-existent attendee', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.manualCheckIn(
        'NONEXISTENT123',
        testEventId,
        testScannerId,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
      expect(result.isManual).toBe(true);
    });

    it('should perform manual check-out', async () => {
      if (!dbConnected) return;

      // First check in
      await WorkstationService.scanTicket(testQRCode, testEventId, testScannerId);

      // Manual check out
      const result = await WorkstationService.manualCheckOut(
        testBackupCode,
        testEventId,
        testScannerId,
        'Manual Exit',
      );

      expect(result.success).toBe(true);
      expect(result.isManual).toBe(true);

      // Verify scan record is marked as manual
      const scan = await prisma.ticketScan.findFirst({
        where: {
          registrationId: testRegistrationId,
          scanType: 'MANUAL_CHECK_OUT',
        },
      });

      expect(scan).toBeDefined();
      expect(scan?.scanType).toBe('MANUAL_CHECK_OUT');

      // Reset
      await prisma.eventRegistration.update({
        where: { id: testRegistrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          checkedOutBy: null,
          ticketStatus: 'ACTIVE',
          isCurrentlyInside: false,
        },
      });
      await prisma.ticketScan.deleteMany({ where: { registrationId: testRegistrationId } });
    });

    it('should reject manual check-out for non-existent attendee', async () => {
      if (!dbConnected) return;

      const result = await WorkstationService.manualCheckOut(
        'NONEXISTENT123',
        testEventId,
        testScannerId,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
      expect(result.isManual).toBe(true);
    });

    it('should handle multiple matches in search', async () => {
      if (!dbConnected) return;

      // Create another attendee with similar name
      const anotherAttendee = await prisma.user.create({
        data: {
          email: 'another@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'Attendee',
          role: 'ATTENDEE',
          status: 'ACTIVE',
          isEmailVerified: true,
        },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId: testEventId,
          attendeeId: anotherAttendee.id,
          status: 'CONFIRMED',
          totalAmount: 0,
          ticketStatus: 'ACTIVE',
          backupCode: TicketService.generateBackupTicketCode(),
        },
      });

      // Search should return multiple results
      const results = await WorkstationService.searchAttendees('Test Attendee', testEventId);
      expect(results.length).toBeGreaterThan(1);

      // Manual check-in should fail with multiple matches
      const result = await WorkstationService.manualCheckIn(
        'Test Attendee',
        testEventId,
        testScannerId,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MULTIPLE_MATCHES');

      // Cleanup
      await prisma.eventRegistration.deleteMany({
        where: { attendeeId: anotherAttendee.id },
      });
      await prisma.user.delete({ where: { id: anotherAttendee.id } });
    });
  });
});

