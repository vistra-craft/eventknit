/**
 * Attendee Dashboard Tests
 *
 * Covers:
 * - Ticket endpoint returns seat allocation data
 * - Seat fields are correctly shaped (seatIdentifier, sectionId, rowLabel, seatLabel, seatType, reservationStatus)
 * - Registrations without seats return seat: undefined
 * - Proper AuthenticationError / AuthorizationError responses for ticket access
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, 12);

describe('Attendee Dashboard — Ticket & Seat Data', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let seatedAttendeeToken: string;
  let otherAttendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let seatedAttendeeId: string;
  let eventId: string;
  let registrationId: string;
  let seatedRegistrationId: string;

  beforeAll(async () => {
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-ticket-service-minimum-32-bytes-long';
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Attendee dashboard test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Attendee dashboard tests will be skipped.');
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

    const hashedPassword = await hashPassword('Test123!@$');

    // Create organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'dash-organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Dash',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Dash Events Inc',
      },
      create: {
        email: 'dash-organizer@test.com',
        password: hashedPassword,
        firstName: 'Dash',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Dash Events Inc',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create primary attendee
    const attendee = await prisma.user.upsert({
      where: { email: 'dash-attendee@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Dash',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'dash-attendee@test.com',
        password: hashedPassword,
        firstName: 'Dash',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeId = attendee.id;
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });

    // Create other attendee (for authorization tests)
    const otherAttendee = await prisma.user.upsert({
      where: { email: 'dash-other@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Other',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'dash-other@test.com',
        password: hashedPassword,
        firstName: 'Other',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    otherAttendeeToken = generateAccessToken({
      userId: otherAttendee.id,
      email: otherAttendee.email,
      role: otherAttendee.role,
    });

    // Create seated attendee (separate user to avoid unique constraint on eventId+attendeeId)
    const seatedAttendee = await prisma.user.upsert({
      where: { email: 'dash-seated@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Seated',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'dash-seated@test.com',
        password: hashedPassword,
        firstName: 'Seated',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    seatedAttendeeId = seatedAttendee.id;
    seatedAttendeeToken = generateAccessToken({
      userId: seatedAttendee.id,
      email: seatedAttendee.email,
      role: seatedAttendee.role,
    });

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Attendee Dashboard Test Event',
        description: 'Testing seat allocation on attendee dashboard',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Arena, Nairobi',
        isFree: false,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 200,
      },
    });
    eventId = event.id;

    // Create a basic registration WITHOUT seat
    const basicRegistration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 50,
        ticketType: 'General Admission',
        backupCode: 'GENTEST01',
      },
    });
    registrationId = basicRegistration.id;

    // Create a seat map + seat + seated registration
    const seatMap = await prisma.seatMap.create({
      data: {
        eventId,
        name: 'Main Hall',
        layout: {
          sections: [
            {
              id: 'section-vip',
              name: 'VIP',
              type: 'seated',
              rows: [{ id: 'row-A', label: 'A', seats: [{ id: 'seat-A1', label: '1' }] }],
            },
          ],
        },
        isActive: true,
      },
    });

    const seat = await prisma.seat.create({
      data: {
        seatMapId: seatMap.id,
        seatIdentifier: 'VIP-A-1',
        sectionId: 'section-vip',
        rowId: 'row-A',
        rowLabel: 'A',
        seatLabel: '1',
        seatType: 'VIP',
        status: 'RESERVED',
        basePrice: 150,
        currentPrice: 150,
      },
    });

    const seatedRegistration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: seatedAttendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 150,
        ticketType: 'VIP',
        backupCode: 'VIPTEST01',
      },
    });
    seatedRegistrationId = seatedRegistration.id;

    // Link seat to registration via SeatReservation
    await prisma.seatReservation.create({
      data: {
        seatId: seat.id,
        registrationId: seatedRegistration.id,
        priceAtReservation: 150,
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Ticket without seat allocation
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/tickets/:registrationId — no seat', () => {
    it('returns ticket data without seat field when no seat is reserved', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrationId).toBe(registrationId);
      expect(response.body.data.qrCode).toBeDefined();
      // seat should be absent when not reserved
      expect(response.body.data.seat).toBeUndefined();
    });

    it('returns correct ticket metadata', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const { data } = response.body;
      expect(data.ticketType).toBe('General Admission');
      expect(data.backupCode).toBe('GENTEST01');
      expect(data.attendeeEmail).toBe('dash-attendee@test.com');
      expect(data.eventId).toBe(eventId);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Ticket WITH seat allocation
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/tickets/:registrationId — with seat', () => {
    it('returns seat allocation data when a seat is reserved', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${seatedRegistrationId}`)
        .set('Authorization', `Bearer ${seatedAttendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const { seat } = response.body.data;
      expect(seat).toBeDefined();
      expect(seat.seatIdentifier).toBe('VIP-A-1');
      expect(seat.sectionId).toBe('section-vip');
      expect(seat.rowLabel).toBe('A');
      expect(seat.seatLabel).toBe('1');
      expect(seat.seatType).toBe('VIP');
      expect(seat.reservationStatus).toBe('confirmed');
    });

    it('organizer can view seating details for their event tickets', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${seatedRegistrationId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.seat).toBeDefined();
      expect(response.body.data.seat.seatType).toBe('VIP');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Authorization
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/tickets/:registrationId — authorization', () => {
    it('returns 401 when no token is provided', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('returns 403 when another attendee tries to access the ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('returns 404 for a non-existent registration ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/tickets/non-existent-registration-id')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Public ticket view
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/tickets/:registrationId/view — public', () => {
    it('allows public access with matching email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${seatedRegistrationId}/view`)
        .query({ email: 'dash-seated@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.seat).toBeDefined();
      expect(response.body.data.seat.seatIdentifier).toBe('VIP-A-1');
    });

    it('returns 403 when email does not match', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: 'wrong-email@test.com' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('returns 400 when email query param is missing', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping — database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
