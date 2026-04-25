import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, FormStatus, FormPurpose, ParticipantType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = (pw: string) => bcrypt.hash(pw, 12);

describe('Forms API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let eventId: string;
  let formId: string;
  let shareToken: string;

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
      try { await prisma.$disconnect(); } catch { /* ignore */ }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await cleanupTestData();

    const hashed = await hashPassword('Test123!@$');

    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@form-test.com' },
      update: { password: hashed, role: UserRole.ORGANIZER, status: UserStatus.ACTIVE, isEmailVerified: true },
      create: {
        email: 'organizer@form-test.com',
        password: hashed,
        firstName: 'Org',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({ userId: organizer.id, email: organizer.email, role: organizer.role });

    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@form-test.com' },
      update: { password: hashed, role: UserRole.ATTENDEE, status: UserStatus.ACTIVE, isEmailVerified: true },
      create: {
        email: 'attendee@form-test.com',
        password: hashed,
        firstName: 'Att',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeToken = generateAccessToken({ userId: attendee.id, email: attendee.email, role: attendee.role });

    const event = await prisma.event.create({
      data: {
        title: 'Tech Summit 2026',
        description: 'Annual tech conference',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Nairobi',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 500,
      },
    });
    eventId = event.id;

    // Create an ACTIVE speaker application form for public-route tests
    const form = await prisma.eventForm.create({
      data: {
        title: 'Speaker Application',
        description: 'Apply to speak at Tech Summit 2026',
        eventId,
        createdById: organizerId,
        purpose: FormPurpose.SPEAKER_APPLICATION,
        targetParticipantType: ParticipantType.SPEAKER,
        status: FormStatus.ACTIVE,
        isPublic: true,
        questions: [
          { id: 'q1', type: 'short_text', label: 'Talk title', required: true, order: 0 },
          { id: 'q2', type: 'long_text',  label: 'Bio',        required: true, order: 1 },
        ],
      },
    });
    formId = form.id;
    shareToken = form.shareToken;
  });

  // ─── Public: get form ─────────────────────────────────────────────────────

  describe('GET /api/v1/forms/public/:shareToken', () => {
    it('returns the form without authentication', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .get(`/api/v1/forms/public/${shareToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.form.id).toBe(formId);
      expect(res.body.form.title).toBe('Speaker Application');
      expect(res.body.form.event.title).toBe('Tech Summit 2026');
    });

    it('returns 404 for an unknown share token', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await request(app)
        .get('/api/v1/forms/public/does-not-exist')
        .expect(404);
    });

    it('returns 400 for a DRAFT form (not yet active)', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const draft = await prisma.eventForm.create({
        data: {
          title: 'Draft Form',
          eventId,
          createdById: organizerId,
          purpose: FormPurpose.GENERAL_INQUIRY,
          status: FormStatus.DRAFT,
          questions: [],
        },
      });

      await request(app)
        .get(`/api/v1/forms/public/${draft.shareToken}`)
        .expect(400);
    });
  });

  // ─── Public: submit response ──────────────────────────────────────────────

  describe('POST /api/v1/forms/public/:shareToken/submit', () => {
    it('submits a response anonymously', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({
          respondentEmail: 'alice@example.com',
          respondentName: 'Alice Speaker',
          answers: { q1: 'Scaling M-Pesa APIs', q2: 'Engineer at Safaricom' },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.response.respondentEmail).toBe('alice@example.com');
      expect(res.body.response.status).toBe('SUBMITTED');
    });

    it('rejects a duplicate email when allowMultipleResponses is false', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const payload = {
        respondentEmail: 'alice@example.com',
        respondentName: 'Alice Speaker',
        answers: { q1: 'Talk 1', q2: 'Bio 1' },
      };

      await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send(payload)
        .expect(201);

      await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send(payload)
        .expect(400);
    });

    it('returns 400 when submitting to a closed form', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await prisma.eventForm.update({
        where: { id: formId },
        data: { closesAt: new Date(Date.now() - 1000) },
      });

      await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({
          respondentEmail: 'late@example.com',
          respondentName: 'Late Applicant',
          answers: {},
        })
        .expect(400);
    });
  });

  // ─── Organizer: CRUD ──────────────────────────────────────────────────────

  describe('POST /api/v1/forms', () => {
    it('creates a form linked to an event', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Sponsor Application',
          eventId,
          purpose: 'SPONSOR_APPLICATION',
          targetParticipantType: 'SPONSOR',
          questions: [],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.form.title).toBe('Sponsor Application');
      expect(res.body.form.eventId).toBe(eventId);
      expect(res.body.form.shareToken).toBeDefined();
    });

    it('returns 401 when unauthenticated', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await request(app)
        .post('/api/v1/forms')
        .send({ title: 'No auth form' })
        .expect(401);
    });

    it('returns 403 when called by an attendee', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ title: 'Attendee cannot create', purpose: 'GENERAL_INQUIRY' })
        .expect(403);
    });
  });

  describe('GET /api/v1/forms', () => {
    it('lists forms for the organizer', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .get('/api/v1/forms')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.forms)).toBe(true);
      expect(res.body.forms.length).toBeGreaterThanOrEqual(1);
    });

    it('filters forms by eventId', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .get(`/api/v1/forms?eventId=${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.forms.every((f: { eventId: string }) => f.eventId === eventId)).toBe(true);
    });
  });

  describe('PATCH /api/v1/forms/:id', () => {
    it('updates the form title', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Updated Speaker Application' })
        .expect(200);

      expect(res.body.form.title).toBe('Updated Speaker Application');
    });

    it('activates a draft form', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const draft = await prisma.eventForm.create({
        data: {
          title: 'Draft',
          eventId,
          createdById: organizerId,
          purpose: FormPurpose.GENERAL_INQUIRY,
          status: FormStatus.DRAFT,
          questions: [],
        },
      });

      const res = await request(app)
        .patch(`/api/v1/forms/${draft.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(res.body.form.status).toBe('ACTIVE');
    });
  });

  describe('DELETE /api/v1/forms/:id', () => {
    it('deletes a form', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await request(app)
        .delete(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const gone = await prisma.eventForm.findUnique({ where: { id: formId } });
      expect(gone).toBeNull();
    });
  });

  // ─── Responses & review ───────────────────────────────────────────────────

  describe('GET /api/v1/forms/:id/responses', () => {
    it('lists responses for a form', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({ respondentEmail: 'bob@example.com', respondentName: 'Bob', answers: { q1: 'Talk', q2: 'Bio' } });

      const res = await request(app)
        .get(`/api/v1/forms/${formId}/responses`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.responses.length).toBe(1);
      expect(res.body.responses[0].respondentEmail).toBe('bob@example.com');
    });
  });

  describe('PATCH /api/v1/forms/:id/responses/:responseId/review — approve → auto-creates participant', () => {
    it('approves a response and creates an EventParticipant', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const submitRes = await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({
          respondentEmail: 'carol@example.com',
          respondentName: 'Carol Speaker',
          answers: { q1: 'The future of AI in Kenya', q2: 'ML engineer with 5 years experience' },
        })
        .expect(201);

      const responseId = submitRes.body.response.id;

      const reviewRes = await request(app)
        .patch(`/api/v1/forms/${formId}/responses/${responseId}/review`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'APPROVED', createParticipant: true })
        .expect(200);

      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.response.status).toBe('APPROVED');

      // EventParticipant should have been auto-created
      const participant = await prisma.eventParticipant.findFirst({
        where: { eventId, email: 'carol@example.com' },
      });
      expect(participant).not.toBeNull();
      expect(participant!.type).toBe('SPEAKER');
      expect(participant!.name).toBe('Carol Speaker');
    });

    it('does not create a duplicate participant on repeated approval', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const submitRes = await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({
          respondentEmail: 'dave@example.com',
          respondentName: 'Dave',
          answers: { q1: 'Talk', q2: 'Bio' },
        })
        .expect(201);

      const responseId = submitRes.body.response.id;
      const body = { status: 'APPROVED', createParticipant: true };

      await request(app)
        .patch(`/api/v1/forms/${formId}/responses/${responseId}/review`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(body)
        .expect(200);

      // Second call should not error and should not create a second participant
      await request(app)
        .patch(`/api/v1/forms/${formId}/responses/${responseId}/review`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(body)
        .expect(200);

      const count = await prisma.eventParticipant.count({
        where: { eventId, email: 'dave@example.com' },
      });
      expect(count).toBe(1);
    });

    it('rejects a response without creating a participant', async () => {
      if (!dbConnected) { logger.info('⏭️  Skipping'); return; }

      const submitRes = await request(app)
        .post(`/api/v1/forms/public/${shareToken}/submit`)
        .send({
          respondentEmail: 'rejected@example.com',
          respondentName: 'Not Selected',
          answers: { q1: 'Talk', q2: 'Bio' },
        })
        .expect(201);

      await request(app)
        .patch(`/api/v1/forms/${formId}/responses/${submitRes.body.response.id}/review`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'REJECTED' })
        .expect(200);

      const participant = await prisma.eventParticipant.findFirst({
        where: { eventId, email: 'rejected@example.com' },
      });
      expect(participant).toBeNull();
    });
  });
});
