/**
 * Integration tests for admin ticket issuance endpoints:
 *   GET  /api/v1/admin/ticket-issuances
 *   PATCH /api/v1/admin/ticket-issuances/:id/cancel
 *
 * Requires a live database. Tests are skipped gracefully when DB is unavailable.
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hash = (pw: string) => bcrypt.hash(pw, 12);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(user: { id: string; email: string; role: UserRole }) {
  return generateAccessToken({ userId: user.id, email: user.email, role: user.role });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Admin Ticket Issuances API', () => {
  let dbConnected = false;

  // Users
  let adminToken: string;
  let organizerToken: string;
  let attendeeToken: string;

  // Data
  let organizerId: string;
  let packageId: string;

  // Issuance IDs created per test
  let pendingIssuanceId: string;
  let claimedIssuanceId: string;

  // ---------------------------------------------------------------------------
  // DB connection check
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      logger.warn('⚠️  Database not available — ticket issuance admin tests will be skipped.');
    }
  });

  afterAll(async () => {
    if (dbConnected) await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // Seed
  // ---------------------------------------------------------------------------

  beforeEach(async () => {
    if (!dbConnected) return;

    const pw = await hash('Test123!@$');

    await prisma.$transaction(async (tx) => {
      await tx.ticketIssuance.deleteMany();
      await tx.ticketPackage.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });

    // Admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: pw,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminToken = makeToken(admin);

    // Organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: pw,
        firstName: 'Org',
        lastName: 'User',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: true,
        verificationLevel: 2,
      },
    });
    organizerId = organizer.id;
    organizerToken = makeToken(organizer);

    // Attendee (unprivileged)
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: pw,
        firstName: 'Att',
        lastName: 'User',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeToken = makeToken(attendee);

    // Event
    const event = await prisma.event.create({
      data: {
        title: 'Issuance Test Event',
        description: 'desc',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Lagos',
        isFree: false,
        price: 0,
        organizerId,
        status: EventStatus.APPROVED,
      },
    });

    // Complementary package
    const pkg = await prisma.ticketPackage.create({
      data: {
        organizerId,
        eventId: event.id,
        name: 'Speaker Pass',
        type: 'complementary',
        price: 0,
      },
    });
    packageId = pkg.id;

    // PENDING issuance
    const pending = await prisma.ticketIssuance.create({
      data: {
        packageId,
        email: 'pending@test.com',
        quantity: 1,
        status: 'PENDING',
      },
    });
    pendingIssuanceId = pending.id;

    // CLAIMED issuance
    const claimed = await prisma.ticketIssuance.create({
      data: {
        packageId,
        email: 'claimed@test.com',
        quantity: 2,
        status: 'CLAIMED',
        claimedAt: new Date(),
        claimedByUserId: attendee.id,
      },
    });
    claimedIssuanceId = claimed.id;
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/admin/ticket-issuances
  // ---------------------------------------------------------------------------

  describe('GET /api/v1/admin/ticket-issuances', () => {
    it('returns all issuances for an authenticated admin', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/admin/ticket-issuances')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.issuances).toHaveLength(2);
      expect(res.body.data.total).toBe(2);

      // Each issuance includes package + event data
      const issuance = res.body.data.issuances[0];
      expect(issuance).toHaveProperty('email');
      expect(issuance).toHaveProperty('status');
      expect(issuance.package).toHaveProperty('event');
      expect(issuance.package.event).toHaveProperty('title', 'Issuance Test Event');
    });

    it('filters by status=PENDING', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/admin/ticket-issuances?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.issuances).toHaveLength(1);
      expect(res.body.data.issuances[0].email).toBe('pending@test.com');
      expect(res.body.data.issuances[0].status).toBe('PENDING');
    });

    it('filters by status=CLAIMED', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/admin/ticket-issuances?status=CLAIMED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.issuances).toHaveLength(1);
      expect(res.body.data.issuances[0].status).toBe('CLAIMED');
    });

    it('respects pagination — page 1 with limit 1', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/admin/ticket-issuances?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.issuances).toHaveLength(1);
      expect(res.body.data.total).toBe(2); // total count is still 2
    });

    it('returns 401 when no auth token is provided', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/admin/ticket-issuances')
        .expect(401);
    });

    it('returns 403 when caller is an ORGANIZER', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/admin/ticket-issuances')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('returns 403 when caller is an ATTENDEE', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/admin/ticket-issuances')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });

    it('rejects invalid status filter with 400', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/admin/ticket-issuances?status=BOGUS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/v1/admin/ticket-issuances/:id/cancel
  // ---------------------------------------------------------------------------

  describe('PATCH /api/v1/admin/ticket-issuances/:id/cancel', () => {
    it('cancels a PENDING issuance and returns updated record', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${pendingIssuanceId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.issuance.status).toBe('CANCELLED');

      // Verify persisted in DB
      const dbRecord = await prisma.ticketIssuance.findUnique({ where: { id: pendingIssuanceId } });
      expect(dbRecord?.status).toBe('CANCELLED');
    });

    it('returns 400 when trying to cancel a CLAIMED issuance', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${claimedIssuanceId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot cancel/i);
    });

    it('returns 404 for a non-existent issuance id', async () => {
      if (!dbConnected) return;

      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 401 when no auth token is provided', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${pendingIssuanceId}/cancel`)
        .expect(401);
    });

    it('returns 403 when caller is an ORGANIZER', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${pendingIssuanceId}/cancel`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('can cancel issuances from any organizer — no ownership restriction', async () => {
      if (!dbConnected) return;

      // Create a second organizer and their own event + package + issuance
      const pw = await hash('Test123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'other-org@test.com',
          password: pw,
          firstName: 'Other',
          lastName: 'Org',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
      const otherEvent = await prisma.event.create({
        data: {
          title: 'Other Org Event',
          description: 'desc',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Abuja',
          isFree: false,
          price: 0,
          organizerId: otherOrg.id,
          status: EventStatus.APPROVED,
        },
      });
      const otherPkg = await prisma.ticketPackage.create({
        data: {
          organizerId: otherOrg.id,
          eventId: otherEvent.id,
          name: 'Guest Pass',
          type: 'complementary',
          price: 0,
        },
      });
      const otherIssuance = await prisma.ticketIssuance.create({
        data: { packageId: otherPkg.id, email: 'vip@other.com', quantity: 1, status: 'PENDING' },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/ticket-issuances/${otherIssuance.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.issuance.status).toBe('CANCELLED');
    });
  });
});
