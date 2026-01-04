/**
 * USSD Service
 *
 * Comprehensive USSD service for event registration using Africa's Talking format.
 * Supports both paid and free events with M-Pesa integration.
 *
 * USSD Flow:
 * 1. Main Menu -> Select action (Register for event, Check status, Help)
 * 2. Enter event code -> Validate and show event details
 * 3. Collect user details (first name, last name, email)
 * 4. If paid event -> Initiate M-Pesa payment
 * 5. Confirm and complete registration
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EventService } from './event.service.js';
import { AuthService } from './auth.service.js';
import { getPaymentGatewayManager } from './payment-gateway-manager.js';
import { smsService } from './sms.service.js';
import { UserRole } from '@prisma/client';

// USSD Response types
type USSDResponseType = 'CON' | 'END';

interface USSDResponse {
  type: USSDResponseType;
  message: string;
}

interface USSDRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string; // Input text, separated by * for multi-level
}

interface EventInfo {
  id: string;
  title: string;
  isFree: boolean;
  price: number;
  currency: string;
  ticketTypeId?: string;
  ticketTypeName?: string;
  startDate: Date;
  venue?: string;
}

export class USSDService {
  // Session timeout in milliseconds (3 minutes for USSD)
  private static readonly SESSION_TIMEOUT = 3 * 60 * 1000;

  /**
   * Main entry point for USSD requests (Africa's Talking format)
   */
  static async handleRequest(request: USSDRequest): Promise<string> {
    const { sessionId, serviceCode, phoneNumber, text } = request;

    try {
      // Parse the input text to get menu selections
      const inputs = text ? text.split('*').filter(Boolean) : [];
      const level = inputs.length;

      // Get or create session
      let session = await this.getOrCreateSession(sessionId, serviceCode, phoneNumber);

      // Update session with new input
      if (text) {
        await this.updateSessionPath(session.id, inputs);
        session = (await prisma.uSSDSession.findUnique({
          where: { id: session.id },
        }))!;
      }

      // Route to appropriate handler based on menu level and state
      const response = await this.routeRequest(session, inputs, level);

      return this.formatResponse(response);
    } catch (error) {
      logger.error('USSD request failed:', error);
      return this.formatResponse({
        type: 'END',
        message: 'An error occurred. Please try again later.',
      });
    }
  }

  /**
   * Get or create a USSD session
   */
  private static async getOrCreateSession(
    sessionId: string,
    serviceCode: string,
    phoneNumber: string,
  ) {
    // Try to find existing session
    let session = await prisma.uSSDSession.findUnique({
      where: { sessionId },
    });

    if (session) {
      // Check if session is expired
      if (new Date() > session.expiresAt) {
        // Mark as expired and create new
        await prisma.uSSDSession.update({
          where: { id: session.id },
          data: { completed: true },
        });
        session = null;
      }
    }

    if (!session) {
      // Create new session
      session = await prisma.uSSDSession.create({
        data: {
          sessionId,
          serviceCode,
          phoneNumber: this.formatPhoneNumber(phoneNumber),
          expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
          menuPath: [],
          currentLevel: 0,
          currentMenu: 'main',
        },
      });
    }

    return session;
  }

  /**
   * Update session with menu path
   */
  private static async updateSessionPath(sessionId: string, inputs: string[]) {
    await prisma.uSSDSession.update({
      where: { id: sessionId },
      data: {
        menuPath: inputs,
        currentLevel: inputs.length,
        expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
      },
    });
  }

  /**
   * Route the request based on current menu state
   */
  private static async routeRequest(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    inputs: string[],
    level: number,
  ): Promise<USSDResponse> {
    const currentMenu = session.currentMenu;

    // Handle payment waiting state
    if (currentMenu === 'awaiting_payment') {
      return this.handleAwaitingPayment(session, inputs[inputs.length - 1] || '');
    }

    // Main menu (level 0)
    if (level === 0) {
      return this.showMainMenu();
    }

    // Process based on first selection
    const mainSelection = inputs[0];

    switch (mainSelection) {
      case '1':
        // Register for event
        return this.handleEventRegistration(session, inputs.slice(1));

      case '2':
        // Check registration status
        return this.handleCheckStatus(session);

      case '3':
        // Help
        return this.showHelp();

      default:
        return {
          type: 'CON',
          message: 'Invalid selection.\n\n' + this.getMainMenuText(),
        };
    }
  }

  /**
   * Show main menu
   */
  private static showMainMenu(): USSDResponse {
    return {
      type: 'CON',
      message: this.getMainMenuText(),
    };
  }

  private static getMainMenuText(): string {
    return (
      'Welcome to EventKnit\n\n' +
      '1. Register for Event\n' +
      '2. Check Registration Status\n' +
      '3. Help'
    );
  }

  /**
   * Handle event registration flow
   */
  private static async handleEventRegistration(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    inputs: string[],
  ): Promise<USSDResponse> {
    const step = inputs.length;

    switch (step) {
      case 0:
        // Ask for event code
        return {
          type: 'CON',
          message: 'Enter the event code:',
        };

      case 1:
        // Validate event code
        return this.validateEventCode(session, inputs[0]);

      case 2:
        // Get first name
        return this.collectFirstName(session, inputs[1]);

      case 3:
        // Get last name
        return this.collectLastName(session, inputs[2]);

      case 4:
        // Get email (optional)
        return this.collectEmail(session, inputs[3]);

      case 5:
        // Show confirmation or payment
        return this.showConfirmation(session, inputs[4]);

      case 6:
        // Process confirmation
        return this.processConfirmation(session, inputs[5]);

      default:
        return {
          type: 'END',
          message: 'Session timeout. Please dial again.',
        };
    }
  }

  /**
   * Validate event code and show event details
   */
  private static async validateEventCode(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    eventCode: string,
  ): Promise<USSDResponse> {
    // Find event by code
    const event = await prisma.event.findFirst({
      where: {
        registrationCode: eventCode.toUpperCase(),
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        isFree: true,
        price: true,
        currency: true,
        ticketTypes: true,
        startDate: true,
        venue: true,
      },
    });

    if (!event) {
      return {
        type: 'END',
        message: `Event code "${eventCode}" not found.\n\nPlease check the code and try again.`,
      };
    }

    // Check if registration is still open
    if (new Date(event.startDate) < new Date()) {
      return {
        type: 'END',
        message: `Event "${event.title}" has already started.\n\nRegistration is closed.`,
      };
    }

    // Determine payment requirements
    let paymentRequired = !event.isFree;
    let paymentAmount = 0;
    let paymentCurrency = event.currency || 'KES';
    let ticketTypeId: string | undefined;
    let ticketTypeName: string | undefined;

    if (!event.isFree) {
      const ticketTypes = event.ticketTypes as Array<{
        id: string;
        name: string;
        price: number;
        currency?: string;
        available?: number;
      }> | null;

      if (ticketTypes && ticketTypes.length > 0) {
        const availableTicket = ticketTypes.find((t) => !t.available || t.available > 0);
        if (availableTicket) {
          paymentAmount = availableTicket.price;
          ticketTypeId = availableTicket.id;
          ticketTypeName = availableTicket.name;
          if (availableTicket.currency) {
            paymentCurrency = availableTicket.currency;
          }
        }
      } else if (event.price) {
        paymentAmount = Number(event.price);
      }

      if (paymentAmount <= 0) {
        paymentRequired = false;
      }
    }

    // Update session with event info
    await prisma.uSSDSession.update({
      where: { id: session.id },
      data: {
        eventId: event.id,
        eventCode: eventCode.toUpperCase(),
        eventTitle: event.title,
        ticketTypeId,
        ticketTypeName,
        paymentRequired,
        paymentAmount: paymentAmount || null,
        paymentCurrency,
      },
    });

    // Build response
    let message = `Event: ${this.truncate(event.title, 30)}\n`;
    if (ticketTypeName) {
      message += `Ticket: ${ticketTypeName}\n`;
    }
    if (paymentRequired) {
      message += `Price: ${paymentCurrency} ${paymentAmount}\n`;
    } else {
      message += `Price: FREE\n`;
    }
    message += `\nEnter your first name:`;

    return {
      type: 'CON',
      message,
    };
  }

  /**
   * Collect first name
   */
  private static async collectFirstName(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    firstName: string,
  ): Promise<USSDResponse> {
    if (!firstName || firstName.length < 2) {
      return {
        type: 'CON',
        message: 'Please enter a valid first name (at least 2 characters):',
      };
    }

    await prisma.uSSDSession.update({
      where: { id: session.id },
      data: { firstName: firstName.trim() },
    });

    return {
      type: 'CON',
      message: 'Enter your last name:',
    };
  }

  /**
   * Collect last name
   */
  private static async collectLastName(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    lastName: string,
  ): Promise<USSDResponse> {
    if (!lastName || lastName.length < 2) {
      return {
        type: 'CON',
        message: 'Please enter a valid last name (at least 2 characters):',
      };
    }

    await prisma.uSSDSession.update({
      where: { id: session.id },
      data: { lastName: lastName.trim() },
    });

    return {
      type: 'CON',
      message: 'Enter your email (or 0 to skip):',
    };
  }

  /**
   * Collect email
   */
  private static async collectEmail(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    email: string,
  ): Promise<USSDResponse> {
    let validEmail: string | undefined;

    if (email && email !== '0') {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          type: 'CON',
          message: 'Invalid email format.\nEnter a valid email or 0 to skip:',
        };
      }
      validEmail = email.toLowerCase().trim();
    }

    await prisma.uSSDSession.update({
      where: { id: session.id },
      data: { email: validEmail },
    });

    // Refresh session data
    const updatedSession = await prisma.uSSDSession.findUnique({
      where: { id: session.id },
    });

    // Show confirmation
    return this.buildConfirmationMessage(updatedSession!);
  }

  /**
   * Build confirmation message
   */
  private static async buildConfirmationMessage(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
  ): Promise<USSDResponse> {
    let message = 'Confirm Registration:\n\n';
    message += `Event: ${this.truncate(session.eventTitle || '', 25)}\n`;
    message += `Name: ${session.firstName} ${session.lastName}\n`;

    if (session.paymentRequired && session.paymentAmount) {
      message += `Amount: ${session.paymentCurrency} ${session.paymentAmount}\n\n`;
      message += '1. Pay with M-Pesa\n';
      message += '2. Cancel';
    } else {
      message += '\n1. Confirm Registration\n';
      message += '2. Cancel';
    }

    return {
      type: 'CON',
      message,
    };
  }

  /**
   * Show confirmation and handle input
   */
  private static async showConfirmation(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    input: string,
  ): Promise<USSDResponse> {
    // This step is handled by processConfirmation
    // Just refresh and show confirmation again
    const updatedSession = await prisma.uSSDSession.findUnique({
      where: { id: session.id },
    });
    return this.buildConfirmationMessage(updatedSession!);
  }

  /**
   * Process confirmation or payment
   */
  private static async processConfirmation(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    selection: string,
  ): Promise<USSDResponse> {
    if (selection === '2') {
      await prisma.uSSDSession.update({
        where: { id: session.id },
        data: { cancelled: true, completed: true },
      });
      return {
        type: 'END',
        message: 'Registration cancelled.\n\nThank you for using EventKnit.',
      };
    }

    if (selection !== '1') {
      // Refresh session
      const updatedSession = await prisma.uSSDSession.findUnique({
        where: { id: session.id },
      });
      return {
        type: 'CON',
        message: 'Invalid selection.\n\n1. Confirm\n2. Cancel',
      };
    }

    // Refresh session data
    const updatedSession = await prisma.uSSDSession.findUnique({
      where: { id: session.id },
    });

    if (!updatedSession) {
      return {
        type: 'END',
        message: 'Session expired. Please dial again.',
      };
    }

    // Check if payment is required
    if (updatedSession.paymentRequired && updatedSession.paymentAmount) {
      return this.initiatePayment(updatedSession);
    }

    // Free event - complete registration
    return this.completeRegistration(updatedSession);
  }

  /**
   * Initiate M-Pesa payment
   */
  private static async initiatePayment(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
  ): Promise<USSDResponse> {
    try {
      const gatewayManager = getPaymentGatewayManager();
      const mpesaGateway = gatewayManager.getMpesaGateway();

      if (!mpesaGateway || !mpesaGateway.isConfigured()) {
        // Fall back to completing registration without payment
        logger.warn('M-Pesa not configured, allowing free registration');
        return this.completeRegistration(session);
      }

      // Generate payment reference
      const paymentReference = `USSD${Date.now()}${session.id.slice(-4)}`;

      // Initiate STK Push
      const stkResponse = await mpesaGateway.initiateSTKPush({
        phoneNumber: session.phoneNumber,
        amount: Number(session.paymentAmount),
        accountReference: paymentReference.slice(0, 12),
        transactionDesc: `Event: ${session.eventTitle?.slice(0, 10) || 'Reg'}`,
      });

      // Update session with payment info
      await prisma.uSSDSession.update({
        where: { id: session.id },
        data: {
          currentMenu: 'awaiting_payment',
          paymentStatus: 'initiated',
          paymentReference: stkResponse.CheckoutRequestID,
          paymentInitiatedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes for payment
        },
      });

      logger.info(`M-Pesa STK Push initiated for USSD session ${session.id}`);

      return {
        type: 'END',
        message:
          `M-Pesa payment request sent to ${session.phoneNumber}.\n\n` +
          `Amount: KES ${session.paymentAmount}\n\n` +
          `Enter your M-Pesa PIN when prompted.\n\n` +
          `You will receive SMS confirmation.`,
      };
    } catch (error) {
      logger.error('Failed to initiate USSD payment:', error);
      return {
        type: 'END',
        message:
          'Payment failed to initiate.\n\n' +
          'Please try again or register online at eventknit.com',
      };
    }
  }

  /**
   * Handle awaiting payment state
   */
  private static async handleAwaitingPayment(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
    input: string,
  ): Promise<USSDResponse> {
    // User dialed back during payment wait
    // Check payment status
    if (session.paymentStatus === 'completed') {
      return {
        type: 'END',
        message: 'Your payment was successful!\n\nCheck SMS for your ticket details.',
      };
    }

    return {
      type: 'END',
      message:
        'Payment is still being processed.\n\n' +
        'Please check your phone for M-Pesa prompt.\n\n' +
        'You will receive SMS confirmation once complete.',
    };
  }

  /**
   * Complete registration (for free events or after payment)
   */
  private static async completeRegistration(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
  ): Promise<USSDResponse> {
    try {
      if (!session.eventId) {
        return {
          type: 'END',
          message: 'Registration error. Please try again.',
        };
      }

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { phoneNumber: session.phoneNumber },
      });

      if (!user) {
        // Create new user with phone number
        const email =
          session.email || `${session.phoneNumber.replace(/\D/g, '')}@ussd.eventknit.com`;

        user = await AuthService.register({
          email,
          firstName: session.firstName || 'Guest',
          lastName: session.lastName || 'User',
          phoneNumber: session.phoneNumber,
          role: UserRole.ATTENDEE,
          password: undefined,
        });
      } else {
        // Update user name if provided
        if (session.firstName || session.lastName) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              firstName: session.firstName || user.firstName,
              lastName: session.lastName || user.lastName,
            },
          });
        }
      }

      // Link user to session
      await prisma.uSSDSession.update({
        where: { id: session.id },
        data: { userId: user.id },
      });

      // Register for event
      await EventService.registerForEvent(
        session.eventId,
        user.id,
        {
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
          phoneNumber: session.phoneNumber,
          registrationSource: 'USSD',
        },
        session.ticketTypeId,
        undefined,
      );

      // Mark session as completed
      await prisma.uSSDSession.update({
        where: { id: session.id },
        data: {
          completed: true,
          currentMenu: 'complete',
        },
      });

      // Send SMS confirmation
      await smsService.sendSMS({
        to: session.phoneNumber,
        message:
          `Successfully registered for "${session.eventTitle}"!\n\n` +
          `Name: ${session.firstName} ${session.lastName}\n` +
          `Check your email for ticket details or visit eventknit.com`,
      });

      logger.info(`USSD registration completed for session ${session.id}`);

      return {
        type: 'END',
        message:
          'Registration Successful!\n\n' +
          `Event: ${this.truncate(session.eventTitle || '', 25)}\n\n` +
          'Check SMS for confirmation.',
      };
    } catch (error) {
      logger.error('Failed to complete USSD registration:', error);
      return {
        type: 'END',
        message: 'Registration failed. Please try again or register online.',
      };
    }
  }

  /**
   * Handle check registration status
   */
  private static async handleCheckStatus(
    session: Awaited<ReturnType<typeof this.getOrCreateSession>>,
  ): Promise<USSDResponse> {
    // Find user by phone number
    const user = await prisma.user.findFirst({
      where: { phoneNumber: session.phoneNumber },
    });

    if (!user) {
      return {
        type: 'END',
        message: 'No registrations found for this phone number.',
      };
    }

    // Get recent registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        attendeeId: user.id,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (registrations.length === 0) {
      return {
        type: 'END',
        message: 'No active registrations found.',
      };
    }

    let message = 'Your Registrations:\n\n';
    registrations.forEach((reg, index) => {
      const date = new Date(reg.event.startDate).toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
      });
      message += `${index + 1}. ${this.truncate(reg.event.title, 20)}\n   ${date} - ${reg.status}\n`;
    });

    return {
      type: 'END',
      message,
    };
  }

  /**
   * Show help information
   */
  private static showHelp(): USSDResponse {
    return {
      type: 'END',
      message:
        'EventKnit Help\n\n' +
        'Register: Enter event code from organizer\n\n' +
        'Support: SMS "HELP" to +254700000000\n\n' +
        'Online: eventknit.com',
    };
  }

  /**
   * Handle M-Pesa callback for USSD sessions
   */
  static async handleMpesaCallback(
    checkoutRequestId: string,
    resultCode: number,
    resultDesc: string,
    mpesaReceiptNumber?: string,
    amount?: number,
  ): Promise<void> {
    try {
      // Find session by payment reference
      const session = await prisma.uSSDSession.findFirst({
        where: {
          paymentReference: checkoutRequestId,
          paymentStatus: 'initiated',
        },
      });

      if (!session) {
        logger.warn(`No USSD session found for M-Pesa callback: ${checkoutRequestId}`);
        return;
      }

      if (resultCode === 0) {
        // Payment successful
        await prisma.uSSDSession.update({
          where: { id: session.id },
          data: {
            paymentStatus: 'completed',
            paymentReceiptNumber: mpesaReceiptNumber,
            paymentCompletedAt: new Date(),
          },
        });

        // Complete registration
        await this.completeRegistration(session);

        logger.info(`USSD payment completed for session ${session.id}`);
      } else {
        // Payment failed
        await prisma.uSSDSession.update({
          where: { id: session.id },
          data: {
            paymentStatus: 'failed',
            completed: true,
          },
        });

        // Send failure SMS
        await smsService.sendSMS({
          to: session.phoneNumber,
          message:
            `Payment failed: ${resultDesc}\n\n` +
            `To retry, dial the USSD code again or register online at eventknit.com`,
        });

        logger.info(`USSD payment failed for session ${session.id}: ${resultDesc}`);
      }
    } catch (error) {
      logger.error('Failed to handle USSD M-Pesa callback:', error);
    }
  }

  /**
   * Format phone number to standard format
   */
  private static formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Format USSD response
   */
  private static formatResponse(response: USSDResponse): string {
    return `${response.type} ${response.message}`;
  }

  /**
   * Truncate string for USSD display
   */
  private static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  }

  /**
   * Cleanup expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const deleted = await prisma.uSSDSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          completed: false,
          paymentStatus: { not: 'initiated' }, // Don't delete sessions with pending payments
        },
      });

      if (deleted.count > 0) {
        logger.info(`Cleaned up ${deleted.count} expired USSD sessions`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired USSD sessions:', error);
    }
  }
}
