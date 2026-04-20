import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Promo Code System', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let promoCodeId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    // Clean up
    await prisma.$transaction(async (tx) => {
      await tx.promoCodeRedemption.deleteMany();
      await tx.promoCode.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });

    // Create organizer
    const hashedPassword = await hashPassword('Test123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: true,
        verificationLevel: 2,
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create attendee
    const attendee = await prisma.user.create({
      data: {
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
        title: 'Test Event with Promo Codes',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 100,
        ticketTypes: [
          {
            name: 'Regular Ticket',
            price: 100,
            quantity: 100,
          },
          {
            name: 'VIP Ticket',
            price: 200,
            quantity: 50,
          },
        ],
        organizerId,
        status: EventStatus.APPROVED,
      },
    });
    eventId = event.id;
  });

  describe('Promo Code Creation', () => {
    it('should create a percentage discount promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCodeData = {
        code: 'SUMMER20',
        eventId,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        usageLimit: 100,
        maxUsesPerUser: 1,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/promo-codes')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(promoCodeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.promoCode.code).toBe('SUMMER20');
      expect(response.body.data.promoCode.discountType).toBe(DiscountType.PERCENTAGE);
      expect(response.body.data.promoCode.discountValue).toBe('20');
    });

    it('should create a fixed amount discount promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCodeData = {
        code: 'SAVE50',
        eventId,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 50,
        minOrderAmount: 100,
        maxDiscount: 50,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/promo-codes')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(promoCodeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.promoCode.code).toBe('SAVE50');
      expect(response.body.data.promoCode.discountType).toBe(DiscountType.FIXED_AMOUNT);
      expect(response.body.data.promoCode.discountValue).toBe('50');
    });

    it('should reject duplicate promo codes', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCodeData = {
        code: 'UNIQUE',
        eventId,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Create first code
      await request(app)
        .post('/api/v1/promo-codes')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(promoCodeData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/promo-codes')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(promoCodeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Promo Code Validation', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create a test promo code
      const promoCode = await prisma.promoCode.create({
        data: {
          code: 'TEST20',
          organizerId,
          eventId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          usageLimit: 10,
          maxUsesPerUser: 1,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      promoCodeId = promoCode.id;
    });

    it('should validate a valid promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({
          code: 'TEST20',
          eventId,
          ticketType: 'Regular Ticket',
          totalAmount: 100,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.discountAmount).toBe(20); // 20% of 100
    });

    it('should reject invalid promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({
          code: 'INVALID',
          eventId,
          ticketType: 'Regular Ticket',
          totalAmount: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid promo code');
    });

    it('should reject expired promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create expired promo code
      await prisma.promoCode.create({
        data: {
          code: 'EXPIRED',
          organizerId,
          eventId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      });

      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({
          code: 'EXPIRED',
          eventId,
          ticketType: 'Regular Ticket',
          totalAmount: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should reject promo code that exceeds usage limit', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create promo code with usage limit
      const _limitedCode = await prisma.promoCode.create({
        data: {
          code: 'LIMITED',
          organizerId,
          eventId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          usageLimit: 1,
          usedCount: 1, // Already used
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({
          code: 'LIMITED',
          eventId,
          ticketType: 'Regular Ticket',
          totalAmount: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('usage limit');
    });

    it('should reject promo code if minimum order amount not met', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create promo code with minimum order
      await prisma.promoCode.create({
        data: {
          code: 'MIN100',
          organizerId,
          eventId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          minOrderAmount: 100,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({
          code: 'MIN100',
          eventId,
          ticketType: 'Regular Ticket',
          totalAmount: 50, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Minimum order amount');
    });
  });

  describe('Promo Code Application in Registration', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create a test promo code
      const promoCode = await prisma.promoCode.create({
        data: {
          code: 'REG20',
          organizerId,
          eventId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          usageLimit: 100,
          maxUsesPerUser: 1,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      promoCodeId = promoCode.id;
    });

    it('should apply promo code during registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Regular Ticket',
          quantity: 1,
          promoCode: 'REG20',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(Number(response.body.data.registration.totalAmount)).toBe(80); // 100 - 20% = 80

      // Check redemption was created
      const redemption = await prisma.promoCodeRedemption.findFirst({
        where: {
          promoCodeId,
          userId: attendeeId,
        },
      });

      expect(redemption).toBeDefined();
      expect(Number(redemption?.discountAmount)).toBe(20);
      expect(Number(redemption?.originalAmount)).toBe(100);
      expect(Number(redemption?.finalAmount)).toBe(80);
    });

    it('should update promo code used count after application', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCode = await prisma.promoCode.findUnique({
        where: { id: promoCodeId },
      });
      const initialCount = promoCode?.usedCount || 0;

      await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Regular Ticket',
          quantity: 1,
          promoCode: 'REG20',
        })
        .expect(201);

      const updatedCode = await prisma.promoCode.findUnique({
        where: { id: promoCodeId },
      });

      expect(updatedCode?.usedCount).toBe(initialCount + 1);
    });
  });

  describe('Promo Code Management', () => {
    it('should get all promo codes for organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create multiple promo codes
      await prisma.promoCode.createMany({
        data: [
          {
            code: 'CODE1',
            organizerId,
            discountType: DiscountType.PERCENTAGE,
            discountValue: 10,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            code: 'CODE2',
            organizerId,
            discountType: DiscountType.FIXED_AMOUNT,
            discountValue: 25,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/promo-codes')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.promoCodes.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          code: 'UPDATE',
          organizerId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .put(`/api/v1/promo-codes/${promoCode.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          discountValue: 25,
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.promoCode.discountValue).toBe('25');
      expect(response.body.data.promoCode.isActive).toBe(false);
    });

    it('should delete a promo code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          code: 'DELETE',
          organizerId,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/promo-codes/${promoCode.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const deleted = await prisma.promoCode.findUnique({
        where: { id: promoCode.id },
      });
      expect(deleted).toBeNull();
    });
  });
});

