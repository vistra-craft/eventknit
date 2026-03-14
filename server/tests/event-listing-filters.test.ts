/**
 * Event Listing Filter Tests
 *
 * Covers the GET /api/v1/events endpoint filters for:
 * - status=REJECTED (declined events)
 * - recalledCancelled=true (CANCELLED + recalledAt — recalled events)
 * - declinedOrRecalledCancelled=true (both combined — legacy filter)
 * - recalledPending=true (PENDING + recalledAt)
 * - status=APPROVED + type=PUBLIC (public listing — excludes past events client-side)
 * - date filtering (dateFrom / dateTo)
 * - search, category, isFree filters
 *
 * Ensures that declined and recalled events are correctly separated and that
 * the public listing does not leak non-approved or private events.
 */

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, EventType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = (password: string) => bcrypt.hash(password, 12);

describe('Event Listing Filters', () => {
  let dbConnected = false;
  let adminToken: string;
  let adminId: string;
  let organizerId: string;

  // Shared event IDs set in beforeEach
  let approvedEventId: string;
  let rejectedEventId: string;
  let recalledCancelledEventId: string;
  let recalledPendingEventId: string;
  let pendingEventId: string;
  let privateEventId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Event listing filters test DB connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Event listing filter tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // ignore
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    const hashed = await hashPassword('Test123!@$');

    // Admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@filter-test.com',
        password: hashed,
        firstName: 'Filter',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    adminToken = generateAccessToken({ userId: admin.id, email: admin.email, role: UserRole.ADMIN });

    // Organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@filter-test.com',
        password: hashed,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Filter Test Events',
      },
    });
    organizerId = organizer.id;

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days

    // 1. Approved public event
    const approved = await prisma.event.create({
      data: {
        title: 'Approved Public Event',
        description: 'A live approved public event',
        location: 'Nairobi',
        startDate: futureDate,
        status: EventStatus.APPROVED,
        type: EventType.PUBLIC,
        isFree: true,
        category: 'Technology',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
    approvedEventId = approved.id;

    // 2. Rejected (declined) event
    const rejected = await prisma.event.create({
      data: {
        title: 'Rejected Event',
        description: 'Admin explicitly rejected this submission',
        location: 'Mombasa',
        startDate: futureDate,
        status: EventStatus.REJECTED,
        type: EventType.PUBLIC,
        isFree: false,
        category: 'Music',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: 'Content policy violation',
      },
    });
    rejectedEventId = rejected.id;

    // 3. Recalled-cancelled event (was approved, then admin recalled it permanently)
    const recalledCancelled = await prisma.event.create({
      data: {
        title: 'Recalled Cancelled Event',
        description: 'This was approved then recalled',
        location: 'Kisumu',
        startDate: futureDate,
        status: EventStatus.CANCELLED,
        type: EventType.PUBLIC,
        isFree: true,
        category: 'Arts',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
        approvedBy: adminId,
        approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        recalledBy: adminId,
        recalledAt: new Date(),
        recallReason: 'Safety concerns at venue',
        recallAction: 'CANCELLED',
      },
    });
    recalledCancelledEventId = recalledCancelled.id;

    // 4. Recalled-pending event (admin sent it back for re-approval)
    const recalledPending = await prisma.event.create({
      data: {
        title: 'Recalled Pending Event',
        description: 'Sent back for revision',
        location: 'Eldoret',
        startDate: futureDate,
        status: EventStatus.PENDING,
        type: EventType.PUBLIC,
        isFree: false,
        category: 'Sports',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
        recalledBy: adminId,
        recalledAt: new Date(),
        recallReason: 'Needs updated venue permit',
        recallAction: 'PENDING',
      },
    });
    recalledPendingEventId = recalledPending.id;

    // 5. Plain pending (awaiting approval — no recall)
    const pending = await prisma.event.create({
      data: {
        title: 'Pending Approval Event',
        description: 'Submitted, waiting for admin',
        location: 'Nakuru',
        startDate: futureDate,
        status: EventStatus.PENDING,
        type: EventType.PUBLIC,
        isFree: true,
        category: 'Technology',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
      },
    });
    pendingEventId = pending.id;

    // 6. Approved private event
    const privateEvent = await prisma.event.create({
      data: {
        title: 'Private Corporate Event',
        description: 'Invite-only corporate meetup',
        location: 'Nairobi',
        startDate: futureDate,
        status: EventStatus.APPROVED,
        type: EventType.PRIVATE,
        isFree: false,
        category: 'Corporate',
        organizerId,
        createdBy: organizerId,
        updatedBy: organizerId,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
    privateEventId = privateEvent.id;
  });

  // ─── Declined filter ─────────────────────────────────────────────────────────

  describe('GET /api/v1/events?status=REJECTED', () => {
    it('returns only REJECTED events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=REJECTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(rejectedEventId);
      expect(ids).not.toContain(approvedEventId);
      expect(ids).not.toContain(recalledCancelledEventId);
      expect(ids).not.toContain(recalledPendingEventId);
      expect(ids).not.toContain(pendingEventId);
    });

    it('rejected event contains rejectionReason and rejectedAt', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=REJECTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const event = res.body.data.events.find((e: { id: string }) => e.id === rejectedEventId);
      expect(event).toBeDefined();
      expect(event.rejectionReason).toBe('Content policy violation');
      expect(event.rejectedAt).toBeTruthy();
      expect(event.rejectedBy).toBe(adminId);
    });

    it('does NOT include recalled-cancelled events in REJECTED filter', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=REJECTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(recalledCancelledEventId);
    });
  });

  // ─── Recalled-cancelled filter ───────────────────────────────────────────────

  describe('GET /api/v1/events?recalledCancelled=true', () => {
    it('returns only CANCELLED events with recalledAt set', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(recalledCancelledEventId);
      expect(ids).not.toContain(rejectedEventId);
      expect(ids).not.toContain(approvedEventId);
      expect(ids).not.toContain(recalledPendingEventId);
      expect(ids).not.toContain(pendingEventId);
    });

    it('recalled event contains recallReason and recalledAt', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const event = res.body.data.events.find((e: { id: string }) => e.id === recalledCancelledEventId);
      expect(event).toBeDefined();
      expect(event.recallReason).toBe('Safety concerns at venue');
      expect(event.recalledAt).toBeTruthy();
      expect(event.recalledBy).toBe(adminId);
    });

    it('does NOT include plain CANCELLED events without recalledAt', async () => {
      if (!dbConnected) return;

      // Create a plain cancelled event (organizer cancelled, no recall)
      const plainCancelled = await prisma.event.create({
        data: {
          title: 'Organizer Cancelled Event',
          description: 'Organizer cancelled this themselves',
          location: 'Nairobi',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: EventStatus.CANCELLED,
          type: EventType.PUBLIC,
          isFree: true,
          category: 'Music',
          organizerId,
          createdBy: organizerId,
          updatedBy: organizerId,
          // recalledAt intentionally omitted
        },
      });

      const res = await request(app)
        .get('/api/v1/events?recalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(plainCancelled.id);
      // Clean up
      await prisma.event.delete({ where: { id: plainCancelled.id } });
    });
  });

  // ─── Legacy combined filter ───────────────────────────────────────────────────

  describe('GET /api/v1/events?declinedOrRecalledCancelled=true', () => {
    it('returns both REJECTED and recalled-CANCELLED events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?declinedOrRecalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(rejectedEventId);
      expect(ids).toContain(recalledCancelledEventId);
    });

    it('does NOT include approved, pending or recalled-pending events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?declinedOrRecalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(approvedEventId);
      expect(ids).not.toContain(pendingEventId);
      expect(ids).not.toContain(recalledPendingEventId);
    });
  });

  // ─── Recalled-pending filter ──────────────────────────────────────────────────

  describe('GET /api/v1/events?recalledPending=true', () => {
    it('returns only PENDING events with recalledAt set', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledPending=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(recalledPendingEventId);
      expect(ids).not.toContain(pendingEventId); // plain pending, no recalledAt
      expect(ids).not.toContain(rejectedEventId);
      expect(ids).not.toContain(recalledCancelledEventId);
    });

    it('does NOT include plain PENDING events without recalledAt', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledPending=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(pendingEventId);
    });
  });

  // ─── Public listing (homepage) ────────────────────────────────────────────────

  describe('GET /api/v1/events?status=APPROVED&type=PUBLIC (public listing)', () => {
    it('returns only approved public events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=APPROVED&type=PUBLIC')
        .expect(200);

      expect(res.body.success).toBe(true);
      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(approvedEventId);
      expect(ids).not.toContain(rejectedEventId);
      expect(ids).not.toContain(recalledCancelledEventId);
      expect(ids).not.toContain(recalledPendingEventId);
      expect(ids).not.toContain(pendingEventId);
    });

    it('does NOT include private events even if approved', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=APPROVED&type=PUBLIC')
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(privateEventId);
    });
  });

  // ─── Additional filters ───────────────────────────────────────────────────────

  describe('Search and category filters', () => {
    it('filters approved events by search term (title match)', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=APPROVED&search=Approved+Public')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(approvedEventId);
      expect(ids).not.toContain(privateEventId);
    });

    it('filters events by category', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?category=Technology')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const events = res.body.data.events as { id: string; category: string }[];
      expect(events.every(e => e.category === 'Technology')).toBe(true);
      expect(events.some(e => e.id === approvedEventId)).toBe(true);
    });

    it('filters events by isFree=true', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?isFree=true&status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const events = res.body.data.events as { id: string; isFree: boolean }[];
      expect(events.every(e => e.isFree === true)).toBe(true);
    });

    it('filters events by isFree=false', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?isFree=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const events = res.body.data.events as { id: string; isFree: boolean }[];
      expect(events.every(e => e.isFree === false)).toBe(true);
    });
  });

  describe('Date range filters', () => {
    it('returns events starting on or after dateFrom', async () => {
      if (!dbConnected) return;

      // Create a past event
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const pastEvent = await prisma.event.create({
        data: {
          title: 'Past Approved Event',
          description: 'This event has already started',
          location: 'Nairobi',
          startDate: pastDate,
          status: EventStatus.APPROVED,
          type: EventType.PUBLIC,
          isFree: true,
          category: 'Technology',
          organizerId,
          createdBy: organizerId,
          updatedBy: organizerId,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .get(`/api/v1/events?status=APPROVED&dateFrom=${tomorrow.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(approvedEventId); // future event
      expect(ids).not.toContain(pastEvent.id); // past event excluded

      await prisma.event.delete({ where: { id: pastEvent.id } });
    });

    it('returns events starting on or before dateTo', async () => {
      if (!dbConnected) return;

      const farFutureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const farFutureEvent = await prisma.event.create({
        data: {
          title: 'Far Future Event',
          description: 'Event 90 days away',
          location: 'Nairobi',
          startDate: farFutureDate,
          status: EventStatus.APPROVED,
          type: EventType.PUBLIC,
          isFree: true,
          category: 'Technology',
          organizerId,
          createdBy: organizerId,
          updatedBy: organizerId,
        },
      });

      const cutoff = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

      const res = await request(app)
        .get(`/api/v1/events?status=APPROVED&dateTo=${cutoff.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).toContain(approvedEventId); // 7 days — within cutoff
      expect(ids).not.toContain(farFutureEvent.id); // 90 days — beyond cutoff

      await prisma.event.delete({ where: { id: farFutureEvent.id } });
    });
  });

  // ─── Filter isolation tests ───────────────────────────────────────────────────

  describe('Filter isolation — filters must not bleed into each other', () => {
    it('recalledCancelled filter does not return REJECTED events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledCancelled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(rejectedEventId);
    });

    it('status=REJECTED filter does not return recalled-cancelled events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=REJECTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(recalledCancelledEventId);
    });

    it('recalledPending filter does not return plain pending events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?recalledPending=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      expect(ids).not.toContain(pendingEventId);
    });

    it('public listing does not return recalled, rejected, or pending events', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?status=APPROVED&type=PUBLIC')
        .expect(200);

      const ids = res.body.data.events.map((e: { id: string }) => e.id);
      const forbidden = [
        rejectedEventId,
        recalledCancelledEventId,
        recalledPendingEventId,
        pendingEventId,
        privateEventId,
      ];
      forbidden.forEach(id => expect(ids).not.toContain(id));
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('respects limit parameter', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.events.length).toBeLessThanOrEqual(1);
      expect(res.body.data.limit).toBe(1);
    });

    it('returns pagination metadata', async () => {
      if (!dbConnected) return;

      const res = await request(app)
        .get('/api/v1/events?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('totalPages');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data.page).toBe(1);
    });

    it('page 2 returns different results than page 1', async () => {
      if (!dbConnected) return;

      const page1 = await request(app)
        .get('/api/v1/events?limit=1&page=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const page2 = await request(app)
        .get('/api/v1/events?limit=1&page=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (page1.body.data.events.length > 0 && page2.body.data.events.length > 0) {
        expect(page1.body.data.events[0].id).not.toBe(page2.body.data.events[0].id);
      }
    });
  });
});
