import { USSDSMSService, IncomingSMS } from '../src/services/ussd-sms.service';
import { prisma } from '../src/config/database';
import {
  UserRole,
  UserStatus,
  EventStatus,
  EventType,
} from '@prisma/client';
import { smsService } from '../src/services/sms.service';
import { AuthService } from '../src/services/auth.service';
import { EventService } from '../src/services/event.service';
import { logger } from '../src/utils/logger';
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Mock dependencies
jest.mock('../src/services/sms.service');
jest.mock('../src/services/auth.service');
jest.mock('../src/services/event.service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('USSDSMSService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let eventCode: string;

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

    // Clean up test data
    await prisma.sMSSession.deleteMany({});
    await prisma.eventRegistration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        firstName: 'Organizer',
        lastName: 'Test',
        password: await hashPassword('password123'),
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    organizerId = organizer.id;

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        firstName: 'Attendee',
        lastName: 'Test',
        password: await hashPassword('password123'),
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        phoneNumber: '+1234567890',
      },
    });
    attendeeId = attendee.id;

    // Create test event with registration code
    eventCode = 'TEST123';
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: true,
        type: EventType.PUBLIC,
        status: EventStatus.APPROVED,
        organizerId,
        registrationCode: eventCode,
        registrationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      },
    });
    eventId = event.id;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('processIncomingSMS', () => {
    it('should start registration flow when user sends REGISTER', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567891',
        body: 'REGISTER',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      // Check that session was created
      const session = await prisma.sMSSession.findFirst({
        where: { phoneNumber: '+1234567891' },
      });

      expect(session).toBeTruthy();
      expect(session?.sessionType).toBe('registration');
      expect(session?.currentStep).toBe('welcome');
      expect(smsService.sendSMS).toHaveBeenCalled();
    });

    it('should start registration flow when user sends START', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567892',
        body: 'START',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      const session = await prisma.sMSSession.findFirst({
        where: { phoneNumber: '+1234567892' },
      });

      expect(session).toBeTruthy();
    });

    it('should start registration flow when user sends *123#', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567893',
        body: '*123#',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      const session = await prisma.sMSSession.findFirst({
        where: { phoneNumber: '+1234567893' },
      });

      expect(session).toBeTruthy();
    });

    it('should start event code registration when user sends event code', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567894',
        body: eventCode,
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });
      (EventService.registerForEvent as jest.Mock).mockRejectedValue(new Error('User not found'));

      await USSDSMSService.processIncomingSMS(incoming);

      const session = await prisma.sMSSession.findFirst({
        where: { phoneNumber: '+1234567894', eventCode },
      });

      expect(session).toBeTruthy();
      expect(session?.sessionType).toBe('event_code');
      expect(session?.eventCode).toBe(eventCode);
    });

    it('should send help message when no active session exists', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567895',
        body: 'RANDOM MESSAGE',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1234567895',
          message: expect.stringContaining('EventKnit SMS Registration'),
        }),
      );
    });

    it('should not start registration if user already exists', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567890', // Existing attendee phone number
        body: 'REGISTER',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already have an account'),
        }),
      );
    });
  });

  describe('Registration Flow Steps', () => {
    let sessionId: string;
    let phoneNumber: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      phoneNumber = '+1234567896';
      const session = await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'welcome',
          state: { phoneNumber },
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      sessionId = session.id;

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });
    });

    it('should process first name step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await USSDSMSService['processSessionResponse'](session, 'John');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.firstName).toBe('John');
      expect(updated?.currentStep).toBe('last_name');
      expect(smsService.sendSMS).toHaveBeenCalled();
    });

    it('should reject invalid first name (too short)', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: { currentStep: 'first_name' },
      });

      await USSDSMSService['processSessionResponse'](session, 'A');

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('at least 2 characters'),
        }),
      );
    });

    it('should process last name step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'last_name',
          state: { phoneNumber, firstName: 'John' },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'Doe');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.lastName).toBe('Doe');
      expect(updated?.currentStep).toBe('email');
    });

    it('should process email step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'email',
          state: { phoneNumber, firstName: 'John', lastName: 'Doe' },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'john.doe@test.com');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.email).toBe('john.doe@test.com');
      expect(updated?.currentStep).toBe('phone_confirm');
    });

    it('should reject invalid email', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'email',
          state: { phoneNumber, firstName: 'John', lastName: 'Doe' },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'invalid-email');

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('valid email address'),
        }),
      );
    });

    it('should reject existing email', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'email',
          state: { phoneNumber, firstName: 'John', lastName: 'Doe' },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'attendee@test.com');

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already registered'),
        }),
      );
    });

    it('should process company step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'company',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'Test Company');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.company).toBe('Test Company');
      expect(updated?.currentStep).toBe('industry');
    });

    it('should allow skipping company step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'company',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'SKIP');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.company).toBeUndefined();
      expect(updated?.currentStep).toBe('industry');
    });

    it('should process industry step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'industry',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            company: 'Test Company',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'TECHNOLOGY');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.industry).toBe('TECHNOLOGY');
      expect(updated?.currentStep).toBe('job_title');
    });

    it('should process job title step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'job_title',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            company: 'Test Company',
            industry: 'TECHNOLOGY',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'Software Engineer');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.jobTitle).toBe('Software Engineer');
      expect(updated?.currentStep).toBe('address');
    });

    it('should process address steps', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      const baseState = {
        phoneNumber,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      };

      // Test address
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: { currentStep: 'address', state: baseState },
      });
      await USSDSMSService['processSessionResponse'](session, '123 Main St');

      // Test city
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: { currentStep: 'city', state: { ...baseState, address: '123 Main St' } },
      });
      await USSDSMSService['processSessionResponse'](session, 'New York');

      // Test state
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'state',
          state: { ...baseState, address: '123 Main St', city: 'New York' },
        },
      });
      await USSDSMSService['processSessionResponse'](session, 'NY');

      // Test country
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'country',
          state: {
            ...baseState,
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
          },
        },
      });
      await USSDSMSService['processSessionResponse'](session, 'USA');

      // Test postal code
      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'postal_code',
          state: {
            ...baseState,
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            country: 'USA',
          },
        },
      });
      await USSDSMSService['processSessionResponse'](session, '10001');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.address).toBe('123 Main St');
      expect(state.city).toBe('New York');
      expect(state.state).toBe('NY');
      expect(state.country).toBe('USA');
      expect(state.postalCode).toBe('10001');
    });

    it('should process event code step', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'event_code',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, eventCode);

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      const state = updated?.state as any;

      expect(state.eventCode).toBe(eventCode);
      expect(updated?.currentStep).toBe('confirm');
    });

    it('should reject invalid event code', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await prisma.sMSSession.update({
        where: { id: sessionId },
        data: {
          currentStep: 'event_code',
          state: {
            phoneNumber,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
      });

      await USSDSMSService['processSessionResponse'](session, 'INVALID');

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('should handle CANCEL command', async () => {
      if (!dbConnected) return;

      const session = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      await USSDSMSService['processSessionResponse'](session, 'CANCEL');

      const updated = await prisma.sMSSession.findUnique({ where: { id: sessionId } });
      expect(updated?.completed).toBe(true);
      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('cancelled'),
        }),
      );
    });
  });

  describe('Complete Registration', () => {
    it('should complete registration and create user', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567897';
      const session = await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'confirm',
          state: {
            phoneNumber,
            firstName: 'New',
            lastName: 'User',
            email: 'newuser@test.com',
            company: 'Test Company',
            industry: 'TECHNOLOGY',
            jobTitle: 'Engineer',
          },
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });
      (AuthService.requestRegistrationCode as jest.Mock).mockResolvedValue(undefined);

      await USSDSMSService['completeRegistration'](session.id, session.state as any);

      const user = await prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      });

      expect(user).toBeTruthy();
      expect(user?.firstName).toBe('New');
      expect(user?.lastName).toBe('User');
      expect(user?.phoneNumber).toBe(phoneNumber);
      expect(user?.companyAffiliation).toBe('Test Company');

      const updatedSession = await prisma.sMSSession.findUnique({ where: { id: session.id } });
      expect(updatedSession?.completed).toBe(true);
      expect(updatedSession?.currentStep).toBe('complete');
    });

    it('should register user for event if event code provided', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567898';
      const session = await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'event_code',
          currentStep: 'confirm',
          state: {
            phoneNumber,
            firstName: 'Event',
            lastName: 'User',
            email: 'eventuser@test.com',
            eventCode,
          },
          eventCode,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });
      (AuthService.requestRegistrationCode as jest.Mock).mockResolvedValue(undefined);
      (EventService.registerForEvent as jest.Mock).mockResolvedValue({
        id: 'reg-id',
        eventId,
        attendeeId: 'user-id',
      });

      await USSDSMSService['completeRegistration'](session.id, session.state as any);

      expect(EventService.registerForEvent).toHaveBeenCalledWith(
        eventId,
        expect.any(String),
        expect.objectContaining({
          registrationData: expect.objectContaining({
            registrationMethod: 'SMS',
          }),
        }),
      );
    });

    it('should update existing user if email already exists', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567899';
      const session = await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'confirm',
          state: {
            phoneNumber,
            firstName: 'Updated',
            lastName: 'Name',
            email: 'attendee@test.com', // Existing email
          },
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService['completeRegistration'](session.id, session.state as any);

      const user = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });

      expect(user?.phoneNumber).toBe(phoneNumber);
    });
  });

  describe('Session Management', () => {
    it('should create new session', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567900';
      const initialState = { phoneNumber };

      const session = await USSDSMSService['createOrUpdateSession'](
        phoneNumber,
        'registration',
        initialState,
      );

      expect(session).toBeTruthy();
      expect(session.phoneNumber).toBe(phoneNumber);
      expect(session.sessionType).toBe('registration');
      expect(session.currentStep).toBe('welcome');
    });

    it('should update existing active session', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567901';
      const initialState = { phoneNumber };

      // Create initial session
      await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'first_name',
          state: initialState,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // Try to create again - should update
      const session = await USSDSMSService['createOrUpdateSession'](
        phoneNumber,
        'registration',
        initialState,
      );

      const sessions = await prisma.sMSSession.findMany({
        where: { phoneNumber, completed: false },
      });

      expect(sessions.length).toBe(1);
      expect(session.currentStep).toBe('welcome');
    });

    it('should get active session', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567902';
      const session = await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'first_name',
          state: { phoneNumber },
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const activeSession = await USSDSMSService['getActiveSession'](phoneNumber);

      expect(activeSession).toBeTruthy();
      expect(activeSession?.id).toBe(session.id);
    });

    it('should not return expired sessions', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567903';
      await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'first_name',
          state: { phoneNumber },
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const activeSession = await USSDSMSService['getActiveSession'](phoneNumber);

      expect(activeSession).toBeNull();
    });

    it('should cleanup expired sessions', async () => {
      if (!dbConnected) return;

      const phoneNumber = '+1234567904';
      await prisma.sMSSession.create({
        data: {
          phoneNumber,
          sessionType: 'registration',
          currentStep: 'first_name',
          state: { phoneNumber },
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      await USSDSMSService.cleanupExpiredSessions();

      const sessions = await prisma.sMSSession.findMany({
        where: { phoneNumber, completed: false },
      });

      expect(sessions.length).toBe(0);
    });
  });

  describe('Event Code Registration', () => {
    it('should reject invalid event code', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567905',
        body: 'INVALID',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found'),
        }),
      );
    });

    it('should reject event code for closed registration', async () => {
      if (!dbConnected) return;

      // Create event with passed deadline
      const closedEvent = await prisma.event.create({
        data: {
          title: 'Closed Event',
          description: 'Test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isFree: true,
          type: EventType.PUBLIC,
          status: EventStatus.APPROVED,
          organizerId,
          registrationCode: 'CLOSED',
          registrationDeadline: new Date(Date.now() - 1000), // Passed
        },
      });

      const incoming: IncomingSMS = {
        from: '+1234567906',
        body: 'CLOSED',
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await USSDSMSService.processIncomingSMS(incoming);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('closed'),
        }),
      );
    });

    it('should directly register existing user for event', async () => {
      if (!dbConnected) return;

      const incoming: IncomingSMS = {
        from: '+1234567890', // Existing attendee
        body: eventCode,
      };

      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });
      (EventService.registerForEvent as jest.Mock).mockResolvedValue({
        id: 'reg-id',
        eventId,
        attendeeId,
      });

      await USSDSMSService.processIncomingSMS(incoming);

      expect(EventService.registerForEvent).toHaveBeenCalledWith(
        eventId,
        attendeeId,
        {},
        undefined,
        undefined,
      );
      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Successfully registered'),
        }),
      );
    });
  });
});

