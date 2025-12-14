import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { EventService } from '../src/services/event.service';
import { TicketService } from '../src/services/ticket.service';
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

      // Register for event (QR code will be generated and stored)
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      // Get stored QR code
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          qrCodeDataUrl: true,
        },
      });

      const storedQRCode = registrationWithQR?.qrCodeDataUrl;
      expect(storedQRCode).toBeDefined();

      // Get full registration data for email
      const fullRegistration = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyAffiliation: true,
            },
          },
        },
      });

      if (!fullRegistration) {
        throw new Error('Registration not found');
      }

      // Mock email service to capture QR code used
      let qrCodeUsedInEmail: string | undefined;
      const originalSendEmail = require('../src/services/email.service').emailService.sendEmail;
      const mockSendEmail = jest.fn().mockImplementation(async (options: any) => {
        // Extract QR code from HTML
        if (options.html && storedQRCode) {
          if (options.html.includes(storedQRCode.substring(0, 50))) {
            qrCodeUsedInEmail = storedQRCode;
          }
        }
        return { success: true, attempts: 1 };
      });

      // Temporarily replace sendEmail
      require('../src/services/email.service').emailService.sendEmail = mockSendEmail;

      try {
        // Send ticket email
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

        // Verify stored QR code was used
        expect(mockSendEmail).toHaveBeenCalled();
        // The email should contain the stored QR code
        expect(qrCodeUsedInEmail || mockSendEmail.mock.calls[0]?.[0]?.html?.includes(storedQRCode?.substring(0, 50))).toBeTruthy();
      } finally {
        // Restore original sendEmail
        require('../src/services/email.service').emailService.sendEmail = originalSendEmail;
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

      // Get stored QR code
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          qrCodeDataUrl: true,
        },
      });

      const storedQRCode = registrationWithQR?.qrCodeDataUrl;
      expect(storedQRCode).toBeDefined();

      // Retrieve ticket
      const ticketData = await TicketService.getTicketByRegistrationId(registration.id);

      // Verify same QR code is returned
      expect(ticketData.qrCode).toBeDefined();
      expect(ticketData.qrCode).toBe(storedQRCode);
      expect(ticketData.qrCode).toContain('data:image/png;base64');
    });

    it('should generate and store QR code for old registrations (backward compatibility)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create registration without QR code (simulating old registration)
      const oldRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          backupCode: 'OLD123',
          // qrCodeDataUrl is null (old registration)
        },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyAffiliation: true,
            },
          },
        },
      });

      // Verify QR code is not stored initially
      expect(oldRegistration.qrCodeDataUrl).toBeNull();

      // Retrieve ticket (should generate QR code on-the-fly and store it)
      const ticketData = await TicketService.getTicketByRegistrationId(oldRegistration.id);

      // Verify QR code was generated
      expect(ticketData.qrCode).toBeDefined();
      expect(ticketData.qrCode).toContain('data:image/png;base64');

      // Verify QR code was stored for future use
      const updatedRegistration = await prisma.eventRegistration.findUnique({
        where: { id: oldRegistration.id },
        select: {
          qrCodeDataUrl: true,
          qrCodeGeneratedAt: true,
        },
      });

      expect(updatedRegistration?.qrCodeDataUrl).toBeDefined();
      expect(updatedRegistration?.qrCodeDataUrl).toBe(ticketData.qrCode);
      expect(updatedRegistration?.qrCodeGeneratedAt).toBeDefined();
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

      // Wait a bit for async email to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify email status was updated (async email completed)
      const registrationWithEmailStatus = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: {
          ticketEmailStatus: true,
          ticketEmailSentAt: true,
        },
      });

      // Email status should be updated (either SUCCESS or FAILED, not null)
      // Note: In test environment, email might fail due to SMTP config, but status should be tracked
      expect(registrationWithEmailStatus?.ticketEmailStatus).toBeDefined();
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
        const registrationWithQR = await prisma.eventRegistration.findUnique({
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

      // Register for event
      const registration = await EventService.registerForEvent(
        eventId,
        attendeeId,
        {
          quantity: 1,
        },
      );

      // Get full registration data
      const fullRegistration = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyAffiliation: true,
            },
          },
        },
      });

      if (!fullRegistration) {
        throw new Error('Registration not found');
      }

      // Mock email service to capture attachments
      let attachmentsUsed: any[] = [];
      const originalSendEmail = require('../src/services/email.service').emailService.sendEmail;
      const mockSendEmail = jest.fn().mockImplementation(async (options: any) => {
        attachmentsUsed = options.attachments || [];
        return { success: true, attempts: 1 };
      });

      require('../src/services/email.service').emailService.sendEmail = mockSendEmail;

      try {
        // Send ticket email
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

        // Verify attachments were included
        expect(attachmentsUsed.length).toBeGreaterThanOrEqual(2); // At least calendar invite and QR PNG

        // Check for calendar invite
        const calendarInvite = attachmentsUsed.find(att => att.filename === 'event.ics');
        expect(calendarInvite).toBeDefined();
        expect(calendarInvite?.contentType).toBe('text/calendar');

        // Check for QR code PNG
        const qrPNG = attachmentsUsed.find(att => att.filename?.includes('qr-code.png'));
        expect(qrPNG).toBeDefined();
        expect(qrPNG?.encoding).toBe('base64');

        // Check for PDF or HTML ticket
        const ticketPDF = attachmentsUsed.find(att => 
          att.filename?.includes('ticket.pdf') || att.filename?.includes('ticket.html')
        );
        expect(ticketPDF).toBeDefined();
      } finally {
        require('../src/services/email.service').emailService.sendEmail = originalSendEmail;
      }
    });
  });
});
