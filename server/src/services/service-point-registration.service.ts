import { prisma } from '../config/database.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { smsService } from './sms.service.js';
import { TicketService } from './ticket.service.js';
import { websocketService } from './websocket.service.js';
import { RegistrationStatus, UserRole, UserStatus, EventStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Session expiry time in minutes
const OTP_EXPIRY_MINUTES = 5;
const SESSION_CLEANUP_HOURS = 24;

interface InitiateRegistrationResult {
  sessionId: string;
  otpSent: boolean;
  expiresAt: Date;
  message: string;
}

interface VerifyOTPResult {
  verified: boolean;
  sessionId: string;
  phoneNumber: string;
  message: string;
}

interface CompleteRegistrationResult {
  registrationId: string;
  attendeeName: string;
  email: string;
  ticketType: string | null;
  backupCode: string;
  qrCodeDataUrl: string | null;
}

interface SessionStatus {
  id: string;
  status: 'pending_otp' | 'verified' | 'completed' | 'cancelled' | 'expired';
  verified: boolean;
  phoneNumber: string;
  attendeeData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    ticketTypeId?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

interface KioskConfig {
  eventCode: string | null;
  eventTitle: string;
  ussdShortCode: string;
  smsKeyword: string;
  instructions: string[];
}

export class ServicePointRegistrationService {
  /**
   * Generate a random 4-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Initiate service point registration by sending OTP to attendee's phone
   */
  static async initiateRegistration(
    eventId: string,
    phoneNumber: string,
    staffId: string,
    facilityId?: string,
  ): Promise<InitiateRegistrationResult> {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new ValidationError('Valid phone number is required');
    }

    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Verify event exists and is active
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        status: EventStatus.APPROVED,
      },
      select: {
        id: true,
        title: true,
        registrationCode: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found or not active');
    }

    // Verify staff exists and has proper permissions
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        status: UserStatus.ACTIVE,
        role: {
          in: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.TELLER],
        },
      },
    });

    if (!staff) {
      throw new ValidationError('Invalid staff member or insufficient permissions');
    }

    // Verify facility if provided
    if (facilityId) {
      const facility = await prisma.eventFacility.findFirst({
        where: {
          id: facilityId,
          eventId,
          isActive: true,
          allowRegistration: true,
        },
      });

      if (!facility) {
        throw new ValidationError('Facility not found or does not allow registration');
      }
    }

    // Check for existing active session for this phone/event
    const existingSession = await prisma.servicePointSession.findFirst({
      where: {
        eventId,
        phoneNumber: normalizedPhone,
        completed: false,
        cancelled: false,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingSession) {
      // Return existing session instead of creating new one
      return {
        sessionId: existingSession.id,
        otpSent: false,
        expiresAt: existingSession.otpExpiresAt,
        message: 'Active session exists. OTP was already sent.',
      };
    }

    // Generate OTP and expiry
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create new session
    const session = await prisma.servicePointSession.create({
      data: {
        eventId,
        facilityId,
        phoneNumber: normalizedPhone,
        otp,
        otpExpiresAt,
        staffId,
      },
    });

    // Send OTP via SMS
    const smsMessage = `Your EventKnit registration code for "${event.title}" is: ${otp}. Reply with this code or show it to staff. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

    const smsResult = await smsService.sendSMS({
      to: normalizedPhone,
      message: smsMessage,
      isCritical: true,
    });

    if (!smsResult.success) {
      logger.warn(`Failed to send OTP SMS to ${normalizedPhone}:`, smsResult.error);
      // Don't fail the registration, staff can tell the OTP verbally if needed
    }

    logger.info(`Service point registration initiated for ${normalizedPhone} at event ${eventId}`, {
      sessionId: session.id,
      staffId,
      facilityId,
      smsSent: smsResult.success,
    });

    return {
      sessionId: session.id,
      otpSent: smsResult.success,
      expiresAt: otpExpiresAt,
      message: smsResult.success
        ? 'OTP sent to attendee phone'
        : 'OTP generated but SMS delivery failed. Please share the code verbally.',
    };
  }

  /**
   * Verify OTP code entered by staff (from attendee verbal confirmation or SMS reply)
   */
  static async verifyOTP(sessionId: string, otp: string): Promise<VerifyOTPResult> {
    if (!otp || otp.length !== 4) {
      throw new ValidationError('Invalid OTP format. Must be 4 digits.');
    }

    const session = await prisma.servicePointSession.findFirst({
      where: {
        id: sessionId,
        completed: false,
        cancelled: false,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found or already completed');
    }

    // Check if OTP has expired
    if (new Date() > session.otpExpiresAt) {
      throw new ValidationError('OTP has expired. Please initiate a new registration.');
    }

    // Verify OTP
    if (session.otp !== otp) {
      throw new ValidationError('Invalid OTP code');
    }

    // Mark session as verified
    await prisma.servicePointSession.update({
      where: { id: sessionId },
      data: { verified: true },
    });

    // Emit WebSocket event for real-time notification
    websocketService.emitToRoom(`event:${session.eventId}`, 'service-point:otp-verified', {
      sessionId,
      phoneNumber: session.phoneNumber,
      verifiedAt: new Date().toISOString(),
    });

    logger.info(`OTP verified for session ${sessionId}`);

    return {
      verified: true,
      sessionId,
      phoneNumber: session.phoneNumber,
      message: 'OTP verified successfully. Proceed to collect attendee details.',
    };
  }

  /**
   * Complete registration with attendee details
   */
  static async completeRegistration(
    sessionId: string,
    attendeeData: {
      firstName: string;
      lastName: string;
      email: string;
      company?: string;
      industry?: string;
      jobTitle?: string;
      ticketTypeId?: string;
      registrationData?: Record<string, unknown>;
    },
  ): Promise<CompleteRegistrationResult> {
    const { firstName, lastName, email, company, industry, jobTitle, ticketTypeId, registrationData } = attendeeData;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      throw new ValidationError('First name, last name, and email are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new ValidationError('Invalid email format');
    }

    // Get session and verify it's valid
    const session = await prisma.servicePointSession.findFirst({
      where: {
        id: sessionId,
        verified: true,
        completed: false,
        cancelled: false,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            isFree: true,
            ticketTypes: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found, not verified, or already completed');
    }

    // Validate ticket type if provided
    const ticketTypes = (session.event.ticketTypes as Array<{ id?: string; name: string }>) || [];
    let selectedTicketType: string | null = null;

    if (ticketTypeId) {
      const validType = ticketTypes.find(
        (t) => t.id === ticketTypeId || t.name.toLowerCase() === ticketTypeId.toLowerCase(),
      );
      if (!validType) {
        throw new ValidationError(`Invalid ticket type: ${ticketTypeId}`);
      }
      selectedTicketType = validType.name;
    } else if (ticketTypes.length > 0) {
      // Default to first ticket type
      selectedTicketType = ticketTypes[0].name;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: session.phoneNumber,
            companyAffiliation: company?.trim() || null,
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
          },
        });
        logger.info(`Created new user for service point registration: ${normalizedEmail}`);
      } catch (err) {
        if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
          // Race condition - user was created between check and create
          user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (!user) throw new ValidationError('Failed to create user');
        } else {
          throw err;
        }
      }
    }

    // Check for existing registration
    const existingReg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId: session.eventId,
          attendeeId: user.id,
        },
      },
    });

    if (existingReg && existingReg.status !== RegistrationStatus.CANCELLED) {
      throw new ValidationError('Attendee is already registered for this event');
    }

    // Build registration data
    const regData: Record<string, unknown> = {
      ...registrationData,
      registeredBy: session.staffId,
      registrationMethod: 'service_point',
      servicePointSessionId: sessionId,
      company: company?.trim(),
      industry: industry?.trim(),
      jobTitle: jobTitle?.trim(),
      phoneNumber: session.phoneNumber,
      registeredAt: new Date().toISOString(),
    };

    // Generate backup code
    const backupCode = TicketService.generateBackupTicketCode();

    // Create or update registration
    const registration = existingReg
      ? await prisma.eventRegistration.update({
        where: { id: existingReg.id },
        data: {
          ticketType: selectedTicketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: regData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          cancelledAt: null,
          cancelledBy: null,
        },
      })
      : await prisma.eventRegistration.create({
        data: {
          eventId: session.eventId,
          attendeeId: user.id,
          ticketType: selectedTicketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: regData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

    // Generate QR code
    let qrCodeDataUrl: string | null = null;
    try {
      const ticketData = TicketService.generateTicketData(registration.id, session.eventId, normalizedEmail);
      qrCodeDataUrl = await TicketService.generateQRCode(ticketData);

      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          qrCodeDataUrl,
          qrCodeGeneratedAt: new Date(),
        },
      });
    } catch (qrError) {
      logger.warn(`Failed to generate QR code for service point registration ${registration.id}:`, qrError);
    }

    // Update session with completion data
    await prisma.servicePointSession.update({
      where: { id: sessionId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        company: company?.trim(),
        industry: industry?.trim(),
        jobTitle: jobTitle?.trim(),
        ticketTypeId: selectedTicketType,
        registrationId: registration.id,
        completed: true,
      },
    });

    // Emit WebSocket event for real-time notification
    websocketService.emitToRoom(`event:${session.eventId}`, 'service-point:registration-complete', {
      sessionId,
      registrationId: registration.id,
      attendeeName: `${firstName.trim()} ${lastName.trim()}`,
      completedAt: new Date().toISOString(),
    });

    // Send confirmation SMS
    const confirmationMessage = `Welcome to "${session.event.title}"! Your registration is confirmed. Backup code: ${backupCode}. Show your QR code or this code at entry.`;
    await smsService.sendSMS({
      to: session.phoneNumber,
      message: confirmationMessage,
      isCritical: true,
    });

    logger.info(`Service point registration completed for ${normalizedEmail} at event ${session.eventId}`, {
      registrationId: registration.id,
      sessionId,
      ticketType: selectedTicketType,
    });

    return {
      registrationId: registration.id,
      attendeeName: `${firstName.trim()} ${lastName.trim()}`,
      email: normalizedEmail,
      ticketType: selectedTicketType,
      backupCode,
      qrCodeDataUrl,
    };
  }

  /**
   * Cancel an incomplete session
   */
  static async cancelSession(sessionId: string): Promise<void> {
    const session = await prisma.servicePointSession.findFirst({
      where: {
        id: sessionId,
        completed: false,
        cancelled: false,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found or already completed/cancelled');
    }

    await prisma.servicePointSession.update({
      where: { id: sessionId },
      data: { cancelled: true },
    });

    logger.info(`Service point session cancelled: ${sessionId}`);
  }

  /**
   * Get session status
   */
  static async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const session = await prisma.servicePointSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    let status: SessionStatus['status'];
    if (session.cancelled) {
      status = 'cancelled';
    } else if (session.completed) {
      status = 'completed';
    } else if (new Date() > session.otpExpiresAt) {
      status = 'expired';
    } else if (session.verified) {
      status = 'verified';
    } else {
      status = 'pending_otp';
    }

    return {
      id: session.id,
      status,
      verified: session.verified,
      phoneNumber: session.phoneNumber,
      attendeeData: session.verified
        ? {
          firstName: session.firstName || undefined,
          lastName: session.lastName || undefined,
          email: session.email || undefined,
          company: session.company || undefined,
          ticketTypeId: session.ticketTypeId || undefined,
        }
        : undefined,
      expiresAt: session.otpExpiresAt,
      createdAt: session.createdAt,
    };
  }

  /**
   * Get active session for a phone number at an event
   */
  static async getActiveSession(phoneNumber: string, eventId: string): Promise<SessionStatus | null> {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    const session = await prisma.servicePointSession.findFirst({
      where: {
        eventId,
        phoneNumber: normalizedPhone,
        completed: false,
        cancelled: false,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!session) {
      return null;
    }

    return this.getSessionStatus(session.id);
  }

  /**
   * Handle SMS OTP reply from attendee (called by ussd-sms service)
   */
  static async handleSMSResponse(phoneNumber: string, message: string): Promise<string> {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const otp = message.trim();

    // Find pending session for this phone number
    const session = await prisma.servicePointSession.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: false,
        completed: false,
        cancelled: false,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!session) {
      return 'No pending registration found for this number.';
    }

    // Check if the message is a valid OTP
    if (!/^\d{4}$/.test(otp)) {
      return `Invalid code format. Please reply with your 4-digit code for "${session.event.title}".`;
    }

    if (session.otp !== otp) {
      return 'Invalid code. Please check and try again.';
    }

    // Verify the session
    await prisma.servicePointSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    // Emit WebSocket event
    websocketService.emitToRoom(`event:${session.eventId}`, 'service-point:otp-verified', {
      sessionId: session.id,
      phoneNumber: normalizedPhone,
      verifiedAt: new Date().toISOString(),
      verifiedViaSMS: true,
    });

    logger.info(`OTP verified via SMS for session ${session.id}`);

    return `Code verified! Staff will complete your registration for "${session.event.title}".`;
  }

  /**
   * Get kiosk configuration for self-service display
   */
  static async getKioskConfig(eventId: string): Promise<KioskConfig> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        registrationCode: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return {
      eventCode: event.registrationCode,
      eventTitle: event.title,
      ussdShortCode: '*384*123#', // TODO: Make configurable
      smsKeyword: event.registrationCode || 'REGISTER',
      instructions: [
        `Welcome to ${event.title}!`,
        'To register:',
        '1. Dial *384*123# on your phone',
        `2. Or SMS "${event.registrationCode || 'REGISTER'}" to 12345`,
        '3. Or ask staff to assist you',
        '',
        'Staff will verify your identity with a code sent to your phone.',
      ],
    };
  }

  /**
   * Cleanup expired sessions (for scheduled job)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const cutoffDate = new Date(Date.now() - SESSION_CLEANUP_HOURS * 60 * 60 * 1000);

    const result = await prisma.servicePointSession.deleteMany({
      where: {
        completed: false,
        cancelled: false,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired service point sessions`);
    }

    return result.count;
  }

  /**
   * Get registration statistics for an event's service point
   */
  static async getServicePointStats(eventId: string): Promise<{
    totalSessions: number;
    completedRegistrations: number;
    pendingVerification: number;
    verifiedPendingCompletion: number;
    cancelledSessions: number;
    expiredSessions: number;
  }> {
    const now = new Date();

    const [total, completed, pending, verified, cancelled] = await Promise.all([
      prisma.servicePointSession.count({ where: { eventId } }),
      prisma.servicePointSession.count({ where: { eventId, completed: true } }),
      prisma.servicePointSession.count({
        where: {
          eventId,
          verified: false,
          completed: false,
          cancelled: false,
          otpExpiresAt: { gt: now },
        },
      }),
      prisma.servicePointSession.count({
        where: {
          eventId,
          verified: true,
          completed: false,
          cancelled: false,
        },
      }),
      prisma.servicePointSession.count({ where: { eventId, cancelled: true } }),
    ]);

    const expired = total - completed - pending - verified - cancelled;

    return {
      totalSessions: total,
      completedRegistrations: completed,
      pendingVerification: pending,
      verifiedPendingCompletion: verified,
      cancelledSessions: cancelled,
      expiredSessions: expired,
    };
  }
}
