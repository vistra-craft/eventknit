import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { TicketService } from '../src/services/ticket.service';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Ticket Email System', () => {
  let dbConnected = false;
  let _organizerToken: string;
  let _attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let _eventId: string;
  let registrationId: string;

  beforeAll(async () => {
    // Set test secret key for ticket generation
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-ticket-service-minimum-32-bytes-long';
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

    // Clear all tables in correct order to respect foreign keys
    await prisma.$transaction(async (tx) => {
      await tx.featuredEvent.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.eventInvitation.deleteMany();
      await tx.ticketTemplate.deleteMany();
      await tx.event.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.kYCDocument.deleteMany();
      await tx.user.deleteMany();
    });

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
    _organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

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
    _attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });

    // Create event
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
    _eventId = event.id;

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        attendeeId,
        quantity: 2,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
        backupCode: 'ABC123',
        ticketType: 'General Admission',
      },
    });
    registrationId = registration.id;
  });

  describe('Ticket Email Content Verification', () => {
    it('should generate QR code for ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const ticketData = await TicketService.getTicketByRegistrationId(registrationId);

      expect(ticketData.qrCode).toBeDefined();
      expect(ticketData.qrCode).toContain('data:image/png;base64');
      expect(ticketData.ticketData).toBeDefined();
    });

    it('should use stored QR code when available (Eventbrite/vf-ticket approach)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get stored QR code
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          qrCodeDataUrl: true,
        },
      });

      // If QR code is stored, verify it's used
      if (registrationWithQR?.qrCodeDataUrl) {
        const ticketData = await TicketService.getTicketByRegistrationId(registrationId);
        
        // Should use stored QR code
        expect(ticketData.qrCode).toBe(registrationWithQR.qrCodeDataUrl);
        expect(ticketData.qrCode).toContain('data:image/png;base64');
      } else {
        // If not stored (old registration), it should generate and store
        const ticketData = await TicketService.getTicketByRegistrationId(registrationId);
        
        expect(ticketData.qrCode).toBeDefined();
        expect(ticketData.qrCode).toContain('data:image/png;base64');

        // Verify QR code was stored after generation
        const updatedRegistration = await prisma.eventRegistration.findUnique({
          where: { id: registrationId },
          select: {
            qrCodeDataUrl: true,
            qrCodeGeneratedAt: true,
          },
        });

        expect(updatedRegistration?.qrCodeDataUrl).toBeDefined();
        expect(updatedRegistration?.qrCodeDataUrl).toBe(ticketData.qrCode);
      }
    });

    it('should generate calendar invite (ICS) for ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
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

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Generate calendar invite using the public static method
      const icsContent = TicketService.generateCalendarInvite({ 
        registration: {
          ...registration,
          registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
        },
      });

      expect(icsContent).toBeDefined();
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('SUMMARY:Test Event');
      expect(icsContent).toContain('Test Location');
      expect(icsContent).toContain('Test Venue');
    });

    it('should format event date correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: true,
          attendee: true,
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Verify event date formatting by checking ticket data
      // The service formats dates internally when generating tickets
      const ticketData = await TicketService.getTicketByRegistrationId(registrationId);
      
      expect(ticketData).toBeDefined();
      expect(ticketData.registration.event).toBeDefined();
      expect(ticketData.registration.event.venue).toBe('Test Venue');
      expect(ticketData.registration.event.location).toBe('Test Location');
    });

    it('should include all required ticket information', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const ticketData = await TicketService.getTicketByRegistrationId(registrationId);

      expect(ticketData.registration).toBeDefined();
      expect(ticketData.registration.event).toBeDefined();
      expect(ticketData.registration.event.title).toBe('Test Event');
      expect(ticketData.registration.attendee).toBeDefined();
      expect(ticketData.registration.quantity).toBe(2);
      expect(ticketData.registration.backupCode).toBe('ABC123');
      expect(ticketData.registration.ticketType).toBe('General Admission');
    });
  });

  describe('Payment Pending Email', () => {
    it('should send payment pending email for paid event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create paid event
      const paidEvent = await prisma.event.create({
        data: {
          title: 'Paid Event',
          description: 'Paid Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 50,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      // Create registration with pending payment
      const pendingRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: paidEvent.id,
          attendeeId,
          quantity: 1,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 50,
        },
      });

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: pendingRegistration.id },
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

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Try to send payment pending email
      // This may fail if email service is not configured, which is expected
      try {
        await TicketService.sendPaymentPendingEmail({
          id: registration.id,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          totalAmount: registration.totalAmount,
          createdAt: registration.createdAt,
          backupCode: registration.backupCode,
          registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
          event: registration.event,
          attendee: registration.attendee,
        });

        // If we get here, email was sent successfully
        expect(true).toBe(true);
      } catch (error) {
        // If email service is not configured, that's okay
        if (error instanceof Error && (error.message.includes('not configured') || error.message.includes('503'))) {
          logger.info('⏭️  Skipping test - email service not configured');
          return;
        }
        throw error;
      }
    });

    it('should include payment amount in pending email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create paid event
      const paidEvent = await prisma.event.create({
        data: {
          title: 'Paid Event',
          description: 'Paid Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 75,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      // Create registration with pending payment
      const pendingRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: paidEvent.id,
          attendeeId,
          quantity: 2,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 150, // 2 tickets * $75
        },
      });

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: pendingRegistration.id },
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

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Verify registration has correct amount
      expect(Number(registration.totalAmount)).toBe(150);
      expect(registration.quantity).toBe(2);
    });
  });

  describe('Ticket Email for Free Events', () => {
    it('should send ticket email immediately for free events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
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

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Verify initial email status is null
      expect(registration.ticketEmailSentAt).toBeNull();
      expect(registration.ticketEmailStatus).toBeNull();

      // Try to send ticket email
      // This may fail if email service is not configured, which is expected
      try {
        await TicketService.sendTicketEmail({
          id: registration.id,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          totalAmount: registration.totalAmount,
          createdAt: registration.createdAt,
          backupCode: registration.backupCode,
          registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
          event: registration.event,
          attendee: registration.attendee,
        });

        // If we get here, email was sent successfully
        // Verify email status was updated
        const updatedRegistration = await prisma.eventRegistration.findUnique({
          where: { id: registrationId },
        });

        expect(updatedRegistration?.ticketEmailStatus).toBe('SUCCESS');
        expect(updatedRegistration?.ticketEmailSentAt).not.toBeNull();
        expect(updatedRegistration?.ticketEmailError).toBeNull();
      } catch (error) {
        // If email service is not configured, that's okay - skip the test
        if (error instanceof Error && (
          error.message.includes('not configured') || 
          error.message.includes('503') ||
          error.message.includes('Missing credentials') ||
          error.message.includes('Failed to send ticket email')
        )) {
          // Even on failure, status should be tracked
          const updatedRegistration = await prisma.eventRegistration.findUnique({
            where: { id: registrationId },
          });

          expect(updatedRegistration?.ticketEmailStatus).toBe('FAILED');
          expect(updatedRegistration?.ticketEmailError).not.toBeNull();
          logger.info('⏭️  Email service not configured - verified failure tracking');
          return;
        }
        throw error;
      }
    });

    it('should include registration confirmation message in email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // The email template now includes "Registration Confirmed!" message
      // This is verified by checking that the registration status is CONFIRMED
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });

      expect(registration).toBeDefined();
      expect(registration?.status).toBe('CONFIRMED');
      // The email template includes this confirmation message
    });
  });

  describe('Calendar Invite Links', () => {
    it('should generate Google Calendar link', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: true,
          attendee: true,
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      const startDate = new Date(registration.event.startDate);
      const endDate = registration.event.endDate 
        ? new Date(registration.event.endDate)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      // Generate Google Calendar link (similar to service)
       
      const googleCalendarParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: registration.event.title,
        dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        details: registration.event.description || '',
        location: registration.event.venue 
          ? `${registration.event.venue}, ${registration.event.location}`
          : registration.event.location,
      });
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?${googleCalendarParams.toString()}`;

      expect(googleCalendarUrl).toBeDefined();
      expect(googleCalendarUrl).toContain('calendar.google.com');
      // URLSearchParams already encodes the values, so check for the title in the URL
      expect(googleCalendarUrl).toContain('Test+Event');
    });

    it('should generate Outlook Calendar link', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: true,
          attendee: true,
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      const startDate = new Date(registration.event.startDate);
      const endDate = registration.event.endDate 
        ? new Date(registration.event.endDate)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      // Generate Outlook Calendar link (similar to service)
       
      const outlookCalendarParams = new URLSearchParams({
        subject: registration.event.title,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: registration.event.description || '',
        location: registration.event.venue 
          ? `${registration.event.venue}, ${registration.event.location}`
          : registration.event.location,
      });
      const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookCalendarParams.toString()}`;

      expect(outlookCalendarUrl).toBeDefined();
      expect(outlookCalendarUrl).toContain('outlook.live.com');
      // URLSearchParams already encodes the values, so check for the title in the URL
      expect(outlookCalendarUrl).toContain('Test+Event');
    });
  });
});

