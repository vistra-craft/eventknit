import { prisma } from '../config/database.js';
import { smsService } from './sms.service.js';
import { emailService } from './email.service.js';
import { AuthService } from './auth.service.js';
import { EventService } from './event.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma, UserRole } from '@prisma/client';

export type SessionType = 'registration' | 'event_code' | 'support' | 'info';

export type RegistrationStep =
  | 'welcome'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone_confirm'
  | 'company'
  | 'industry'
  | 'job_title'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'postal_code'
  | 'event_code'
  | 'confirm'
  | 'complete';

export interface SMSRegistrationState {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber: string;
  company?: string;
  industry?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  eventCode?: string;
  role?: UserRole;
}

export interface IncomingSMS {
  from: string; // Phone number
  body: string; // Message content
  messageId?: string; // Provider message ID
}

export class USSDSMSService {
  private static readonly SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_RETRIES = 3;

  /**
   * Process incoming SMS message
   * Handles USSD-style registration and event code registration
   */
  static async processIncomingSMS(incoming: IncomingSMS): Promise<void> {
    try {
      const phoneNumber = smsService.formatPhoneNumber(incoming.from);
      const message = incoming.body.trim().toUpperCase();

      // Check if this is a command (like *123# or REGISTER)
      if (message.startsWith('*') || message === 'REGISTER' || message === 'START') {
        await this.startRegistrationFlow(phoneNumber);
        return;
      }

      // Check if this is an event code (typically 6-8 characters)
      if (this.looksLikeEventCode(message)) {
        await this.startEventCodeRegistration(phoneNumber, message);
        return;
      }

      // Check for existing session
      const session = await this.getActiveSession(phoneNumber);

      if (session) {
        await this.processSessionResponse(session, message);
      } else {
        // No active session - send help message
        await this.sendHelpMessage(phoneNumber);
      }
    } catch (error) {
      logger.error('Failed to process incoming SMS:', error);
      // Don't throw - we don't want to break the webhook
    }
  }

  /**
   * Start registration flow
   */
  static async startRegistrationFlow(phoneNumber: string): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          status: 'ACTIVE',
        },
      });

      if (existingUser) {
        await smsService.sendSMS({
          to: phoneNumber,
          message: 'You already have an account! Use your email to login or send an event code to register for events.',
        });
        return;
      }

      // Create or update session
      const session = await this.createOrUpdateSession(phoneNumber, 'registration', {
        phoneNumber,
      });

      await this.sendStepMessage(session, 'welcome');
    } catch (error) {
      logger.error(`Failed to start registration flow for ${phoneNumber}:`, error);
      await this.sendErrorMessage(phoneNumber);
    }
  }

  /**
   * Start event code registration
   */
  static async startEventCodeRegistration(phoneNumber: string, eventCode: string): Promise<void> {
    try {
      // Find event by code
      const event = await prisma.event.findFirst({
        where: {
          registrationCode: eventCode,
          status: 'APPROVED',
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          registrationDeadline: true,
          startDate: true,
          isFree: true,
        },
      });

      if (!event) {
        await smsService.sendSMS({
          to: phoneNumber,
          message: `Event code "${eventCode}" not found or event is not available. Please check the code and try again.`,
        });
        return;
      }

      // Check if registration deadline passed
      if (
        event.registrationDeadline &&
        new Date(event.registrationDeadline) < new Date()
      ) {
        await smsService.sendSMS({
          to: phoneNumber,
          message: `Registration for "${event.title}" has closed. The deadline has passed.`,
        });
        return;
      }

      // Check if event already started
      if (new Date(event.startDate) < new Date()) {
        await smsService.sendSMS({
          to: phoneNumber,
          message: `Event "${event.title}" has already started. Registration is closed.`,
        });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: { phoneNumber },
      });

      if (existingUser) {
        // User exists - try to register directly
        try {
          await EventService.registerForEvent(event.id, existingUser.id, {}, undefined, undefined);
          await smsService.sendSMS({
            to: phoneNumber,
            message: `Successfully registered for "${event.title}"! Check your email for ticket details.`,
          });
          return;
        } catch (error) {
          // Registration failed - might need more info
          logger.warn(`Direct registration failed for user ${existingUser.id}:`, error);
        }
      }

      // Create session for event code registration
      const session = await this.createOrUpdateSession(phoneNumber, 'event_code', {
        phoneNumber,
        eventCode,
      });

      await this.sendStepMessage(session, 'welcome');
    } catch (error) {
      logger.error(`Failed to start event code registration for ${phoneNumber}:`, error);
      await this.sendErrorMessage(phoneNumber);
    }
  }

  /**
   * Process response in active session
   */
  private static async processSessionResponse(
    session: { id: string; currentStep: string | null; state: Prisma.JsonValue },
    message: string,
  ): Promise<void> {
    try {
      const state = session.state as unknown as SMSRegistrationState;
      const step = (session.currentStep || 'welcome') as RegistrationStep;

      // Handle special commands
      if (message === 'CANCEL' || message === 'STOP' || message === 'EXIT') {
        await this.cancelSession(session.id, state.phoneNumber);
        return;
      }

      if (message === 'BACK' && step !== 'welcome') {
        // Go back one step (simplified - would need step history)
        await smsService.sendSMS({
          to: state.phoneNumber,
          message: 'To go back, please cancel and start over. Send CANCEL to exit.',
        });
        return;
      }

      // Process based on current step
      switch (step) {
      case 'welcome':
        await this.handleWelcomeStep(session.id, state, message);
        break;
      case 'first_name':
        await this.handleFirstNameStep(session.id, state, message);
        break;
      case 'last_name':
        await this.handleLastNameStep(session.id, state, message);
        break;
      case 'email':
        await this.handleEmailStep(session.id, state, message);
        break;
      case 'phone_confirm':
        await this.handlePhoneConfirmStep(session.id, state, message);
        break;
      case 'company':
        await this.handleCompanyStep(session.id, state, message);
        break;
      case 'industry':
        await this.handleIndustryStep(session.id, state, message);
        break;
      case 'job_title':
        await this.handleJobTitleStep(session.id, state, message);
        break;
      case 'address':
        await this.handleAddressStep(session.id, state, message);
        break;
      case 'city':
        await this.handleCityStep(session.id, state, message);
        break;
      case 'state':
        await this.handleStateStep(session.id, state, message);
        break;
      case 'country':
        await this.handleCountryStep(session.id, state, message);
        break;
      case 'postal_code':
        await this.handlePostalCodeStep(session.id, state, message);
        break;
      case 'event_code':
        await this.handleEventCodeStep(session.id, state, message);
        break;
      case 'confirm':
        await this.handleConfirmStep(session.id, state, message);
        break;
      default:
        await this.sendStepMessage({ id: session.id, currentStep: step, state } as any, step);
      }
    } catch (error) {
      logger.error(`Failed to process session response:`, error);
      await this.sendErrorMessage((session.state as unknown as SMSRegistrationState).phoneNumber);
    }
  }

  /**
   * Handle welcome step
   */
  private static async handleWelcomeStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    // Welcome message already sent, move to first name
    await this.updateSessionStep(sessionId, 'first_name', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'first_name', state } as any,
      'first_name',
    );
  }

  /**
   * Handle first name step
   */
  private static async handleFirstNameStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (!message || message.length < 2) {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Please enter your first name (at least 2 characters).',
      });
      return;
    }

    state.firstName = message;
    await this.updateSessionStep(sessionId, 'last_name', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'last_name', state } as any,
      'last_name',
    );
  }

  /**
   * Handle last name step
   */
  private static async handleLastNameStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (!message || message.length < 2) {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Please enter your last name (at least 2 characters).',
      });
      return;
    }

    state.lastName = message;
    await this.updateSessionStep(sessionId, 'email', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'email', state } as any,
      'email',
    );
  }

  /**
   * Handle email step
   */
  private static async handleEmailStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    const email = message.toLowerCase().trim();

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Please enter a valid email address (e.g., name@example.com).',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'This email is already registered. Please use a different email or login with your account.',
      });
      await this.cancelSession(sessionId, state.phoneNumber);
      return;
    }

    state.email = email;
    await this.updateSessionStep(sessionId, 'phone_confirm', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'phone_confirm', state } as any,
      'phone_confirm',
    );
  }

  /**
   * Handle phone confirmation step
   */
  private static async handlePhoneConfirmStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    const response = message.trim().toUpperCase();

    if (response !== 'YES' && response !== 'Y' && response !== '1') {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Please confirm your phone number by replying YES or 1. Reply NO to cancel.',
      });
      return;
    }

    // Phone confirmed, move to company
    await this.updateSessionStep(sessionId, 'company', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'company', state } as any,
      'company',
    );
  }

  /**
   * Handle company step
   */
  private static async handleCompanyStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.company = undefined;
    } else {
      state.company = message;
    }

    await this.updateSessionStep(sessionId, 'industry', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'industry', state } as any,
      'industry',
    );
  }

  /**
   * Handle industry step
   */
  private static async handleIndustryStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.industry = undefined;
    } else {
      // Validate industry (could be a list)
      const validIndustries = [
        'TECHNOLOGY',
        'HEALTHCARE',
        'FINANCE',
        'EDUCATION',
        'RETAIL',
        'MANUFACTURING',
        'CONSULTING',
        'MEDIA',
        'HOSPITALITY',
        'REAL_ESTATE',
        'OTHER',
      ];

      const industryUpper = message.toUpperCase();
      if (validIndustries.includes(industryUpper)) {
        state.industry = industryUpper;
      } else {
        // Allow free text if not in list
        state.industry = message;
      }
    }

    await this.updateSessionStep(sessionId, 'job_title', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'job_title', state } as any,
      'job_title',
    );
  }

  /**
   * Handle job title step
   */
  private static async handleJobTitleStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.jobTitle = undefined;
    } else {
      state.jobTitle = message;
    }

    await this.updateSessionStep(sessionId, 'address', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'address', state } as any,
      'address',
    );
  }

  /**
   * Handle address step
   */
  private static async handleAddressStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.address = undefined;
    } else {
      state.address = message;
    }

    await this.updateSessionStep(sessionId, 'city', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'city', state } as any,
      'city',
    );
  }

  /**
   * Handle city step
   */
  private static async handleCityStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.city = undefined;
    } else {
      state.city = message;
    }

    await this.updateSessionStep(sessionId, 'state', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'state', state } as any,
      'state',
    );
  }

  /**
   * Handle state step
   */
  private static async handleStateStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.state = undefined;
    } else {
      state.state = message;
    }

    await this.updateSessionStep(sessionId, 'country', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'country', state } as any,
      'country',
    );
  }

  /**
   * Handle country step
   */
  private static async handleCountryStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.country = undefined;
    } else {
      state.country = message;
    }

    await this.updateSessionStep(sessionId, 'postal_code', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'postal_code', state } as any,
      'postal_code',
    );
  }

  /**
   * Handle postal code step
   */
  private static async handlePostalCodeStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0') {
      state.postalCode = undefined;
    } else {
      state.postalCode = message;
    }

    // If event code registration, ask for event code, otherwise go to confirm
    if (state.eventCode) {
      // Event code already provided, go to confirm
      await this.updateSessionStep(sessionId, 'confirm', state);
      await this.sendStepMessage(
        { id: sessionId, currentStep: 'confirm', state } as any,
        'confirm',
      );
    } else {
      // Ask if they want to register for an event
      await this.updateSessionStep(sessionId, 'event_code', state);
      await this.sendStepMessage(
        { id: sessionId, currentStep: 'event_code', state } as any,
        'event_code',
      );
    }
  }

  /**
   * Handle event code step
   */
  private static async handleEventCodeStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    if (message.toUpperCase() === 'SKIP' || message === '0' || message === 'NO') {
      state.eventCode = undefined;
    } else {
      // Validate event code
      const event = await prisma.event.findFirst({
        where: {
          registrationCode: message,
          status: 'APPROVED',
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!event) {
        await smsService.sendSMS({
          to: state.phoneNumber,
          message: `Event code "${message}" not found. Please enter a valid code or reply SKIP to continue without event registration.`,
        });
        return;
      }

      state.eventCode = message;
    }

    await this.updateSessionStep(sessionId, 'confirm', state);
    await this.sendStepMessage(
      { id: sessionId, currentStep: 'confirm', state } as any,
      'confirm',
    );
  }

  /**
   * Handle confirmation step
   */
  private static async handleConfirmStep(
    sessionId: string,
    state: SMSRegistrationState,
    message: string,
  ): Promise<void> {
    const response = message.trim().toUpperCase();

    if (response !== 'YES' && response !== 'Y' && response !== '1') {
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Registration cancelled. Send REGISTER to start over.',
      });
      await this.cancelSession(sessionId, state.phoneNumber);
      return;
    }

    // Complete registration
    await this.completeRegistration(sessionId, state);
  }

  /**
   * Complete registration process
   */
  private static async completeRegistration(
    sessionId: string,
    state: SMSRegistrationState,
  ): Promise<void> {
    try {
      if (!state.firstName || !state.lastName || !state.email) {
        throw new ValidationError('Missing required registration fields');
      }

      // Generate password (user will need to set it via email)
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

      // Create user account
      let user = await prisma.user.findUnique({
        where: { email: state.email },
      });

      if (!user) {
        // Create new user
        const { hashPassword } = await import('../utils/password.js');
        const hashedPassword = await hashPassword(tempPassword);

        user = await prisma.user.create({
          data: {
            email: state.email,
            firstName: state.firstName,
            lastName: state.lastName,
            phoneNumber: state.phoneNumber,
            password: hashedPassword,
            companyAffiliation: state.company,
            role: state.role || UserRole.ATTENDEE,
            status: 'ACTIVE',
            isEmailVerified: false, // Will need email verification
          },
        });

        // Send verification code via email
        try {
          await AuthService.requestRegistrationCode(state.email, state.role || UserRole.ATTENDEE);
        } catch (error) {
          logger.warn(`Failed to send verification email: ${error}`);
        }
      } else {
        // Update existing user with phone number and additional info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phoneNumber: state.phoneNumber,
            companyAffiliation: state.company,
            ...(state.firstName && { firstName: state.firstName }),
            ...(state.lastName && { lastName: state.lastName }),
          },
        });
      }

      // Register for event if event code provided
      if (state.eventCode) {
        try {
          const event = await prisma.event.findFirst({
            where: {
              registrationCode: state.eventCode,
              status: 'APPROVED',
            },
          });

          if (event) {
            await EventService.registerForEvent(event.id, user.id, {
              registrationData: {
                industry: state.industry,
                jobTitle: state.jobTitle,
                address: state.address,
                city: state.city,
                state: state.state,
                country: state.country,
                postalCode: state.postalCode,
                registrationMethod: 'SMS',
              },
            });
          }
        } catch (error) {
          logger.error(`Failed to register for event: ${error}`);
          // Continue with account creation even if event registration fails
        }
      }

      // Mark session as completed
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          completed: true,
          currentStep: 'complete',
        },
      });

      // Send success message
      let successMessage = `Registration successful! Welcome ${state.firstName}!\n\n`;
      successMessage += `Email: ${state.email}\n`;
      if (state.eventCode) {
        successMessage += `You've been registered for the event.\n`;
      }
      successMessage += `Check your email to verify your account and set your password.`;

      await smsService.sendSMS({
        to: state.phoneNumber,
        message: successMessage,
        isCritical: true,
      });
    } catch (error) {
      logger.error(`Failed to complete registration:`, error);
      await smsService.sendSMS({
        to: state.phoneNumber,
        message: 'Registration failed. Please try again or contact support. Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    }
  }

  /**
   * Send step-specific message
   */
  private static async sendStepMessage(
    session: { id: string; currentStep: string | null; state: Prisma.JsonValue },
    step: RegistrationStep,
  ): Promise<void> {
    const state = session.state as unknown as SMSRegistrationState;

    let message = '';

    switch (step) {
    case 'welcome':
      if (state.eventCode) {
        message = `Welcome! Let's register you for the event.\n\n`;
      } else {
        message = `Welcome to EventKnit Registration!\n\n`;
      }
      message += `We'll collect some information. Reply with your answers.\n\n`;
      message += `Step 1/12: What is your first name?`;
      break;

    case 'first_name':
      message = `Step 2/12: What is your last name?`;
      break;

    case 'last_name':
      message = `Step 3/12: What is your email address?\n(Example: name@example.com)`;
      break;

    case 'phone_confirm':
      message = `Step 4/12: Confirm your phone number: ${state.phoneNumber}\n\nReply YES to confirm or NO to cancel.`;
      break;

    case 'company':
      message = `Step 5/12: What company do you work for?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'industry':
      message = `Step 6/12: What industry are you in?\n(Examples: Technology, Healthcare, Finance, Education, etc.)\n(Reply SKIP or 0 to skip)`;
      break;

    case 'job_title':
      message = `Step 7/12: What is your job title?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'address':
      message = `Step 8/12: What is your street address?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'city':
      message = `Step 9/12: What city do you live in?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'state':
      message = `Step 10/12: What state/province?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'country':
      message = `Step 11/12: What country?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'postal_code':
      message = `Step 12/12: What is your postal/zip code?\n(Reply SKIP or 0 to skip)`;
      break;

    case 'event_code':
      message = `Do you have an event code to register for?\n(Enter the code or reply SKIP to continue without event registration)`;
      break;

    case 'confirm':
      message = this.buildConfirmationMessage(state);
      break;

    case 'complete':
      // Already handled in completeRegistration
      return;
    }

    await smsService.sendSMS({
      to: state.phoneNumber,
      message,
    });
  }

  /**
   * Build confirmation message with all collected data
   */
  private static buildConfirmationMessage(state: SMSRegistrationState): string {
    let message = `Please confirm your details:\n\n`;
    message += `Name: ${state.firstName} ${state.lastName}\n`;
    message += `Email: ${state.email}\n`;
    message += `Phone: ${state.phoneNumber}\n`;

    if (state.company) {
      message += `Company: ${state.company}\n`;
    }
    if (state.industry) {
      message += `Industry: ${state.industry}\n`;
    }
    if (state.jobTitle) {
      message += `Job Title: ${state.jobTitle}\n`;
    }
    if (state.address) {
      message += `Address: ${state.address}\n`;
    }
    if (state.city) {
      message += `City: ${state.city}\n`;
    }
    if (state.state) {
      message += `State: ${state.state}\n`;
    }
    if (state.country) {
      message += `Country: ${state.country}\n`;
    }
    if (state.postalCode) {
      message += `Postal Code: ${state.postalCode}\n`;
    }
    if (state.eventCode) {
      message += `Event Code: ${state.eventCode}\n`;
    }

    message += `\nReply YES to confirm or NO to cancel.`;
    return message;
  }

  /**
   * Create or update SMS session
   */
  private static async createOrUpdateSession(
    phoneNumber: string,
    sessionType: SessionType,
    initialState: SMSRegistrationState,
  ) {
    const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT_MS);

    // Check for existing active session
    const existing = await prisma.sMSSession.findFirst({
      where: {
        phoneNumber,
        sessionType,
        completed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Update existing session
      return await prisma.sMSSession.update({
        where: { id: existing.id },
        data: {
          state: initialState as unknown as Prisma.InputJsonValue,
          currentStep: 'welcome',
          expiresAt,
        },
      });
    }

    // Create new session
    return await prisma.sMSSession.create({
      data: {
        phoneNumber,
        sessionType,
        currentStep: 'welcome',
        state: initialState as unknown as Prisma.InputJsonValue,
        eventCode: initialState.eventCode,
        expiresAt,
      },
    });
  }

  /**
   * Update session step
   */
  private static async updateSessionStep(
    sessionId: string,
    step: RegistrationStep,
    state: SMSRegistrationState,
  ) {
    await prisma.sMSSession.update({
      where: { id: sessionId },
      data: {
        currentStep: step,
        state: state as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT_MS), // Extend timeout
      },
    });
  }

  /**
   * Get active session
   */
  private static async getActiveSession(phoneNumber: string) {
    // Clean up expired sessions first
    await prisma.sMSSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        completed: false,
      },
    });

    return await prisma.sMSSession.findFirst({
      where: {
        phoneNumber,
        completed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel session
   */
  private static async cancelSession(sessionId: string, phoneNumber: string) {
    await prisma.sMSSession.update({
      where: { id: sessionId },
      data: { completed: true },
    });

    await smsService.sendSMS({
      to: phoneNumber,
      message: 'Registration cancelled. Send REGISTER to start over anytime.',
    });
  }

  /**
   * Send help message
   */
  private static async sendHelpMessage(phoneNumber: string) {
    const message = `EventKnit SMS Registration\n\n`;
    const helpText = `To register, send:\n`;
    const registerText = `REGISTER or *123#\n\n`;
    const eventText = `Or send an event code to register for a specific event.\n\n`;
    const cancelText = `Send CANCEL anytime to exit.`;

    await smsService.sendSMS({
      to: phoneNumber,
      message: message + helpText + registerText + eventText + cancelText,
    });
  }

  /**
   * Send error message
   */
  private static async sendErrorMessage(phoneNumber: string) {
    await smsService.sendSMS({
      to: phoneNumber,
      message: 'Sorry, something went wrong. Please try again or contact support.',
    });
  }

  /**
   * Check if message looks like an event code
   */
  private static looksLikeEventCode(message: string): boolean {
    // Event codes are typically 4-10 alphanumeric characters
    const codePattern = /^[A-Z0-9]{4,10}$/;
    return codePattern.test(message) && message.length >= 4 && message.length <= 10;
  }

  /**
   * Clean up expired sessions (should be called periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const deleted = await prisma.sMSSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          completed: false,
        },
      });

      logger.info(`Cleaned up ${deleted.count} expired SMS sessions`);
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
    }
  }
}

