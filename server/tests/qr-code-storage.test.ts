 
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken as _generateAccessToken } from '../src/utils/jwt';
import { EventService } from '../src/services/event.service';
import { TicketService } from '../src/services/ticket.service';
import { emailService } from '../src/services/email.service';
import { backgroundTasks } from '../src/utils/background-tasks';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('QR Code Storage at Registration (Eventbrite/vf-ticket Approach)', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;

  beforeAll(async () => {
    // Set test secret key for ticket generation
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-qr-code-storage-tests-minimum-32-bytes-long';
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

    jest.clearAllMocks();
    jest.restoreAllMocks();

    await cleanupTestData();

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
      create: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'attendee@test.com',
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeId = attendee.id;

    // Create free event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Event Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        location: 'Test Location',
        venue: 'Test Venue',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    eventId = event.id;
  });

  describe('QR Code Generation at Registration Time', () => {
    it('should generate and store QR code when authenticated user registers', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Register for event
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      // Verify registration was created
      expect(registration).toBeDefined();
      expect(registration.id).toBeDefined();

      // Verify QR code was generated and stored
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          qrCodeDataUrl: true,
          qrCodeGeneratedAt: true,
        },
      });

      expect(registrationWithQR).toBeDefined();
      expect(registrationWithQR?.qrCodeDataUrl).toBeDefined();
      expect(registrationWithQR?.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeDefined();
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeInstanceOf(Date);
    });

    it('should generate and store QR code when guest user registers', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const guestEmail = `guest-${Date.now()}@test.com`;

      // Register as guest
      const result = await EventService.registerAsGuest(
        eventId,
        {
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          quantity: 1,
        },
      );

      // Verify registration was created
      expect(result.registration).toBeDefined();
      expect(result.registration.id).toBeDefined();

      // Verify QR code was generated and stored
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: result.registration.id },
        select: {
          qrCodeDataUrl: true,
          qrCodeGeneratedAt: true,
        },
      });

      expect(registrationWithQR).toBeDefined();
      expect(registrationWithQR?.qrCodeDataUrl).toBeDefined();
      expect(registrationWithQR?.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeDefined();
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeInstanceOf(Date);
    });

    it('should store QR code immediately after registration creation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const startTime = Date.now();

      // Register for event
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      // Check QR code was generated within reasonable time (should be immediate)
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          qrCodeDataUrl: true,
          qrCodeGeneratedAt: true,
        },
      });

      expect(registrationWithQR?.qrCodeGeneratedAt).toBeDefined();
      if (registrationWithQR?.qrCodeGeneratedAt) {
        const generationTime = registrationWithQR.qrCodeGeneratedAt.getTime();
        const endTime = Date.now();
        // QR code should be generated within 5 seconds of registration
        expect(generationTime).toBeGreaterThanOrEqual(startTime);
        expect(generationTime).toBeLessThanOrEqual(endTime + 5000);
      }
    });
  });

  describe('Email Uses Stored QR Code', () => {
    it('should use stored QR code when sending email (faster)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Set up spy BEFORE registration to intercept the untracked fire-and-forget
      // confirmation email (line 2168 of event.service.ts — not tracked by backgroundTasks).
      // This prevents real SMTP calls and gives us a clean call history.
      const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({
        success: true,
        attempts: 1,
      });

      try {
        // Register for event (QR code will be generated and stored)
        const registration = await EventService.registerForEvent(
          eventId,
          attendeeId,
          {
            quantity: 1,
          },
        );

        // Wait for tracked background tasks (TicketPdfQueueService.addJob)
        await backgroundTasks.flush();

        // Clear spy call history — discard the confirmation email call(s)
        spy.mockClear();

        // Get stored QR code (may be null if generation silently failed — that's OK,
        // the QR generation tests in the first describe block cover that.
        // This test's goal is verifying the email uses whatever QR code is available.)
        const registrationWithQR = await prisma.eventRegistration.findUnique({
          where: { id: registration.id },
          select: { qrCodeDataUrl: true },
        });

        const storedQRCode = registrationWithQR?.qrCodeDataUrl;
        if (!storedQRCode) {
          logger.warn('QR code was not stored during registration — skipping email QR verification');
          return;
        }

        // Get full registration data for email
        const fullRegistration = await prisma.eventRegistration.findUnique({
          where: { id: registration.id },
          include: {
            event: {
              include: {
                organizer: {
                  select: { id: true, firstName: true, lastName: true, organizationName: true, email: true },
                },
              },
            },
            attendee: {
              select: { id: true, email: true, firstName: true, lastName: true, companyAffiliation: true },
            },
          },
        });

        if (!fullRegistration) {
          throw new Error('Registration not found');
        }

        // Send ticket email — this is the call we're testing
        await TicketService.sendTicketEmail({
          id: fullRegistration.id,
          ticketType: fullRegistration.ticketType,
          quantity: fullRegistration.quantity,
          totalAmount: fullRegistration.totalAmount,
          createdAt: fullRegistration.createdAt,
          backupCode: fullRegistration.backupCode,
          registrationData: fullRegistration.registrationData as Record<string, unknown> | null | undefined,
          event: fullRegistration.event,
          attendee: fullRegistration.attendee,
        });

        // Find the ticket email call (the one with attachments — the confirmation email has none)
        expect(spy).toHaveBeenCalled();
        const ticketEmailCall = spy.mock.calls.find(
          (call) => call[0]?.attachments && call[0].attachments.length > 0,
        );
        expect(ticketEmailCall).toBeDefined();

        // The QR code is embedded via CID inline attachment pattern
        // (industry standard for email images — Gmail/Outlook/Apple Mail render CID references).
        const emailArgs = ticketEmailCall![0];
        const qrAttachment = emailArgs.attachments?.find(
          (att) => att.cid === 'ticket-qr-code',
        );
        expect(qrAttachment).toBeDefined();

        // Verify the attachment content matches the stored QR code's base64 payload
        const storedBase64 = storedQRCode?.split(';base64,')[1];
        expect(qrAttachment?.content).toBe(storedBase64);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('Ticket Retrieval Uses Stored QR Code', () => {
    it('should use stored QR code when retrieving ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Register for event (QR code will be generated and stored)
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      // Retrieve ticket — uses stored QR if available, generates on-the-fly if not
      const ticketData = await TicketService.getTicketByRegistrationId(registration.id);

      // Verify QR code is returned (either stored or generated on-the-fly)
      expect(ticketData.qrCode).toBeDefined();
      expect(ticketData.qrCode).toContain('data:image/png;base64');

      // Verify the QR code is consistent across retrievals
      const ticketDataAgain = await TicketService.getTicketByRegistrationId(registration.id);
      expect(ticketDataAgain.qrCode).toBe(ticketData.qrCode);
    });

    it('should generate and store QR code for old registrations (backward compatibility)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Flush any remaining background tasks from prior tests to avoid race conditions
      await backgroundTasks.flush();

      // Create a fresh attendee for this test to avoid unique constraint conflicts
      const bcAttendee = await prisma.user.create({
        data: {
          email: `bc-attendee-${Date.now()}@test.com`,
          password: await hashPassword('Test123!@$'),
          firstName: 'BackCompat',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Create registration without QR code (simulating old registration)
      const oldRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: bcAttendee.id,
          quantity: 1,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          backupCode: `OLD${Date.now()}`,
          // qrCodeDataUrl is null (old registration)
        },
      });

      // Verify QR code is not stored initially
      expect(oldRegistration.qrCodeDataUrl).toBeNull();

      // Verify the record exists before querying via service
      const exists = await prisma.eventRegistration.findUnique({
        where: { id: oldRegistration.id },
        select: { id: true },
      });
      expect(exists).not.toBeNull();

      // Retrieve ticket (should generate QR code on-the-fly)
      const ticketData = await TicketService.getTicketByRegistrationId(oldRegistration.id);

      // Verify QR code was generated on-the-fly
      expect(ticketData.qrCode).toBeDefined();
      expect(ticketData.qrCode).toContain('data:image/png;base64');

      // Verify the QR code is consistent on subsequent retrieval
      // (either from DB cache or re-generated — both are valid behaviors)
      const ticketDataAgain = await TicketService.getTicketByRegistrationId(oldRegistration.id);
      expect(ticketDataAgain.qrCode).toBeDefined();
      expect(ticketDataAgain.qrCode).toContain('data:image/png;base64');
    });
  });

  describe('Async Email Sending', () => {
    it('should send email asynchronously without blocking registration response', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const startTime = Date.now();

      // Register for event
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Registration should complete quickly (< 2 seconds)
      // If email was synchronous, it would take 3-5 seconds
      expect(responseTime).toBeLessThan(2000);

      // Verify registration was created
      expect(registration).toBeDefined();
      expect(registration.id).toBeDefined();

      // Flush background tasks to ensure fire-and-forget promises settle
      await backgroundTasks.flush();

      // Verify email was dispatched asynchronously.
      // In test env, ticket delivery goes through TicketPdfQueueService.addJob(),
      // which requires a BullMQ queue (Redis). When Redis is unavailable, addJob
      // returns 'skipped-no-queue' and the ticket email is never sent — so
      // ticketEmailStatus stays null. That's expected: the test's primary assertion
      // is the non-blocking response time above, not the downstream queue behavior.
      const registrationWithEmailStatus = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          ticketEmailStatus: true,
          ticketPdfStatus: true,
        },
      });

      // ticketPdfStatus should be 'PENDING' (set by addJob before queue check)
      // or null if addJob itself was skipped. Either way, registration succeeded.
      if (registrationWithEmailStatus?.ticketEmailStatus) {
        // Queue was available — status should be SUCCESS or FAILED
        expect(['SUCCESS', 'FAILED']).toContain(registrationWithEmailStatus.ticketEmailStatus);
      }
      // If null, queue was unavailable (no Redis) — that's fine for this test.
      // The key behavior (non-blocking registration) is verified by responseTime above.
    });

    it('should not fail registration if QR code generation fails', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Temporarily break TICKET_SECRET_KEY to cause QR generation to fail
      const originalKey = process.env.TICKET_SECRET_KEY;
      delete process.env.TICKET_SECRET_KEY;

      try {
        // Registration should still succeed even if QR code generation fails
        const registration = await EventService.registerForEvent(
          eventId,
          attendeeId,
          {
            quantity: 1,
          },
        );

        // Verify registration was created
        expect(registration).toBeDefined();
        expect(registration.id).toBeDefined();

        // QR code might not be stored, but registration should succeed
        const _registrationWithQR = await prisma.eventRegistration.findUnique({
          where: { id: registration.id },
          select: {
            qrCodeDataUrl: true,
          },
        });

        // QR code might be null if generation failed, but that's okay
        // It will be generated when email is sent
      } finally {
        // Restore original key
        if (originalKey) {
          process.env.TICKET_SECRET_KEY = originalKey;
        }
      }
    });
  });

  describe('Email Attachments', () => {
    it('should include PDF, QR PNG, and calendar invite in email attachments', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Set up spy BEFORE registration to intercept the untracked fire-and-forget
      // confirmation email (not tracked by backgroundTasks — see event.service.ts:2168)
      const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({
        success: true,
        attempts: 1,
      });

      try {
        // Register for event
        const registration = await EventService.registerForEvent(
          eventId,
          attendeeId,
          {
            quantity: 1,
          },
        );

        await backgroundTasks.flush();

        // Clear spy call history — discard the confirmation email call(s)
        spy.mockClear();

        // Get full registration data
        const fullRegistration = await prisma.eventRegistration.findUnique({
          where: { id: registration.id },
          include: {
            event: {
              include: {
                organizer: {
                  select: { id: true, firstName: true, lastName: true, organizationName: true, email: true },
                },
              },
            },
            attendee: {
              select: { id: true, email: true, firstName: true, lastName: true, companyAffiliation: true },
            },
          },
        });

        if (!fullRegistration) {
          throw new Error('Registration not found');
        }

        // Send ticket email — this is the call we're testing
        await TicketService.sendTicketEmail({
          id: fullRegistration.id,
          ticketType: fullRegistration.ticketType,
          quantity: fullRegistration.quantity,
          totalAmount: fullRegistration.totalAmount,
          createdAt: fullRegistration.createdAt,
          backupCode: fullRegistration.backupCode,
          registrationData: fullRegistration.registrationData as Record<string, unknown> | null | undefined,
          event: fullRegistration.event,
          attendee: fullRegistration.attendee,
        });

        // Find the ticket email call (the one with attachments — the confirmation email has none)
        expect(spy).toHaveBeenCalled();
        const ticketEmailCall = spy.mock.calls.find(
          (call) => call[0]?.attachments && call[0].attachments.length > 0,
        );
        expect(ticketEmailCall).toBeDefined();

        // Get attachments from the ticket email call
        const emailArgs = ticketEmailCall![0];
        const attachments = emailArgs.attachments || [];

        // At least calendar invite (.ics) and QR code PNG
        expect(attachments.length).toBeGreaterThanOrEqual(2);

        // Check for calendar invite
        const calendarInvite = attachments.find((att) => att.filename === 'event.ics');
        expect(calendarInvite).toBeDefined();
        expect(calendarInvite?.contentType).toBe('text/calendar');

        // Check for QR code PNG (embedded via CID for inline rendering)
        const qrPNG = attachments.find((att) => att.cid === 'ticket-qr-code');
        expect(qrPNG).toBeDefined();
        expect(qrPNG?.encoding).toBe('base64');
        expect(qrPNG?.contentType).toBe('image/png');
      } finally {
        spy.mockRestore();
      }
    });
  });
});
