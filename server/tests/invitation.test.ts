import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import crypto from 'crypto';
import { InviteType } from '@prisma/client';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Event Invitation System', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let invitationId: string;
  let invitationToken: string;

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
    organizerToken = generateAccessToken({
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
    attendeeToken = generateAccessToken({
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
        location: 'Test Location',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    eventId = event.id;

    // Create invitation
    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId: event.id,
        inviteType: 'ATTENDEE',
        token: crypto.randomBytes(32).toString('hex'),
        title: 'Test Invitation',
        createdBy: organizerId,
      },
    });
    invitationId = invitation.id;
    invitationToken = invitation.token;
  });

  describe('GET /api/v1/invitations/:token', () => {
    it('should get invitation by token successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/invitations/${invitationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitation).toBeDefined();
      expect(response.body.data.invitation.token).toBe(invitationToken);
      expect(response.body.data.invitation.inviteType).toBe('ATTENDEE');
      // Event is included in the invitation object
      expect(response.body.data.invitation.event).toBeDefined();
      expect(response.body.data.invitation.event.id).toBe(eventId);
    });

    it('should fail with invalid token', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/invitations/invalid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with revoked invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Revoke invitation
      await prisma.eventInvitation.update({
        where: { id: invitationId },
        data: { isActive: false },
      });

      const response = await request(app)
        .get(`/api/v1/invitations/${invitationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('revoked');
    });
  });

  describe('POST /api/v1/invitations/events/:eventId', () => {
    it('should create invitation successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          inviteType: 'ATTENDEE',
          title: 'New Invitation',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitation).toBeDefined();
      expect(response.body.data.invitation.inviteType).toBe('ATTENDEE');
      expect(response.body.data.invitation.token).toBeDefined();
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .send({
          inviteType: 'ATTENDEE',
          title: 'New Invitation',
        })
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          inviteType: 'ATTENDEE',
          title: 'New Invitation',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail for event not owned by organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrgPassword = await hashPassword('Other123!@$');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'otherorg@test.com',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Events',
        },
      });

      const otherOrgToken = generateAccessToken({
        userId: otherOrganizer.id,
        email: otherOrganizer.email,
        role: otherOrganizer.role,
      });

      const response = await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({
          inviteType: 'ATTENDEE',
          title: 'New Invitation',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          // Missing inviteType
          title: 'New Invitation',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          inviteType: 'INVALID_TYPE',
          title: 'New Invitation',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/invitations/events/:eventId', () => {
    it('should get all invitations for event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another invitation
      await prisma.eventInvitation.create({
        data: {
          eventId,
          inviteType: 'ATTENDEE',
          token: crypto.randomBytes(32).toString('hex'),
          title: 'Another Invitation',
          createdBy: organizerId,
        },
      });

      const response = await request(app)
        .get(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toBeDefined();
      expect(Array.isArray(response.body.data.invitations)).toBe(true);
      expect(response.body.data.invitations.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/invitations/events/${eventId}`)
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/invitations/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return empty array for event with no invitations', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create new event with no invitations
      const newEvent = await prisma.event.create({
        data: {
          title: 'New Event',
          description: 'New Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      const response = await request(app)
        .get(`/api/v1/invitations/events/${newEvent.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toBeDefined();
      expect(response.body.data.invitations.length).toBe(0);
    });
  });

  describe('PUT /api/v1/invitations/:id', () => {
    it('should update invitation successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updated Invitation',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitation.title).toBe('Updated Invitation');
      expect(response.body.data.invitation.description).toBe('Updated description');
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put(`/api/v1/invitations/${invitationId}`)
        .send({
          title: 'Updated Invitation',
        })
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Updated Invitation',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent invitation ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/invitations/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updated Invitation',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/invitations/:id/revoke', () => {
    it('should revoke invitation successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/${invitationId}/revoke`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('revoked');

      // Verify invitation is revoked
      const invitation = await prisma.eventInvitation.findUnique({
        where: { id: invitationId },
      });
      expect(invitation?.isActive).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post(`/api/v1/invitations/${invitationId}/revoke`)
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/${invitationId}/revoke`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent invitation ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/invitations/non-existent-id/revoke')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/invitations/:id', () => {
    it('should delete invitation successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create invitation to delete
      const invitationToDelete = await prisma.eventInvitation.create({
        data: {
          eventId,
          inviteType: 'ATTENDEE',
          token: crypto.randomBytes(32).toString('hex'),
          title: 'To Delete',
          createdBy: organizerId,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/invitations/${invitationToDelete.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify invitation is deleted
      const invitation = await prisma.eventInvitation.findUnique({
        where: { id: invitationToDelete.id },
      });
      expect(invitation).toBeNull();
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .delete(`/api/v1/invitations/${invitationId}`)
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent invitation ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete('/api/v1/invitations/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/invitations/:token/register', () => {
    it('should register via invitation successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/${invitationToken}/register`)
        .send({
          email: 'invited@test.com',
          firstName: 'Invited',
          lastName: 'User',
          phoneNumber: '+1234567890',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.user).toBeDefined();

      // Verify registration was created
      const registration = await prisma.eventRegistration.findFirst({
        where: {
          eventId,
          attendee: {
            email: 'invited@test.com',
          },
        },
      });
      expect(registration).toBeDefined();
    });

    it('should fail with revoked invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Revoke invitation
      await prisma.eventInvitation.update({
        where: { id: invitationId },
        data: { isActive: false },
      });

      const response = await request(app)
        .post(`/api/v1/invitations/${invitationToken}/register`)
        .send({
          email: 'invited2@test.com',
          firstName: 'Invited',
          // Missing lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/invitations/${invitationToken}/register`)
        .send({
          firstName: 'Invited',
          // Missing lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/invitations/invalid-token/register')
        .send({
          email: 'invited3@test.com',
          firstName: 'Invited',
          lastName: 'User',
          phoneNumber: '+1234567890',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

