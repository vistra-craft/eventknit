import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { VerificationService } from '../src/services/verification.service';
import type { IdentityVerificationData, BusinessVerificationData } from '../src/services/verification.service';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Verification Service', () => {
  let dbConnected = false;
  let organizerId: string;
  let organizerToken: string;
  let _attendeeId: string;

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
    await prisma.$transaction(async (tx: any) => {
      await cleanupTestData(tx);
    });

    // Create test organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: organizerPassword,
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    organizerId = organizer.id;

    // Create test attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: attendeePassword,
        firstName: 'Test',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    _attendeeId = attendee.id;

    // Login organizer to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@test.com',
        password: 'Organizer123!@$',
      });

    if (loginResponse.status !== 200) {
      logger.error('Login failed:', loginResponse.status, loginResponse.body);
      throw new Error(`Failed to login organizer. Status: ${loginResponse.status}, Body: ${JSON.stringify(loginResponse.body)}`);
    }

    if (loginResponse.body.success && loginResponse.body.data?.accessToken) {
      organizerToken = loginResponse.body.data.accessToken;
      logger.info('✅ Organizer token obtained successfully');
    } else {
      logger.error('Login response missing token:', loginResponse.body);
      throw new Error(`Login succeeded but no token in response: ${JSON.stringify(loginResponse.body)}`);
    }
  });

  describe('Identity Verification', () => {
    describe('submitIdentityVerification', () => {
      it('should submit identity verification with both front and back ID documents', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData: IdentityVerificationData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          idDocumentBackUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        };

        const result = await VerificationService.submitIdentityVerification(organizerId, identityData);

        expect(result.message).toBe('Identity verification submitted successfully');
        expect(result.verificationLevel).toBe(2);
        expect(result.payoutLimit).toBe(2000);

        // Verify user was updated
        const user = await prisma.user.findUnique({
          where: { id: organizerId },
        });

        expect(user?.isIdentityVerified).toBe(true);
        expect(user?.identityVerifiedAt).toBeDefined();
        expect(user?.verificationLevel).toBe(2);
        expect(user?.payoutLimit?.toString()).toBe('2000');
        expect(user?.firstName).toBe('John');
        expect(user?.lastName).toBe('Doe');
      });

      it('should reject identity verification if user is already verified', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        // First verification
        const identityData: IdentityVerificationData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await VerificationService.submitIdentityVerification(organizerId, identityData);

        // Try to verify again
        await expect(
          VerificationService.submitIdentityVerification(organizerId, identityData),
        ).rejects.toThrow('Identity is already verified');
      });

      it('should reject identity verification without front ID document', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData: Partial<IdentityVerificationData> = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await expect(
          VerificationService.submitIdentityVerification(organizerId, identityData as IdentityVerificationData),
        ).rejects.toThrow('All identity verification fields are required, including both ID document images');
      });

      it('should reject identity verification without back ID document', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData: Partial<IdentityVerificationData> = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
        };

        await expect(
          VerificationService.submitIdentityVerification(organizerId, identityData as IdentityVerificationData),
        ).rejects.toThrow('All identity verification fields are required, including both ID document images');
      });

      it('should reject identity verification for non-existent user', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData: IdentityVerificationData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await expect(
          VerificationService.submitIdentityVerification('non-existent-id', identityData),
        ).rejects.toThrow('User not found');
      });

      it('should accept different ID types (passport, drivers_license, national_id)', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const idTypes = ['passport', 'drivers_license', 'national_id'] as const;

        for (const idType of idTypes) {
          // Create a new organizer for each test
          const organizerPassword = await hashPassword('Organizer123!@$');
          const organizer = await prisma.user.create({
            data: {
              email: `organizer-${idType}@test.com`,
              password: organizerPassword,
              firstName: 'Test',
              lastName: 'Organizer',
              role: UserRole.ORGANIZER,
              status: UserStatus.ACTIVE,
              isEmailVerified: true,
            },
          });

          const identityData: IdentityVerificationData = {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'Nairobi',
            state: 'Nairobi',
            zipCode: '00100',
            country: 'Kenya',
            idType,
            idNumber: '12345678',
            idDocumentFrontUrl: 'data:image/png;base64,front',
            idDocumentBackUrl: 'data:image/png;base64,back',
          };

          const result = await VerificationService.submitIdentityVerification(organizer.id, identityData);
          expect(result.verificationLevel).toBe(2);

          // Cleanup
          await prisma.user.delete({ where: { id: organizer.id } });
        }
      });
    });

    describe('API Endpoint: POST /api/v1/verification/identity', () => {
      it('should submit identity verification via API', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        if (!organizerToken) {
          throw new Error('Organizer token is not set. Login may have failed in beforeEach.');
        }

        const identityData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          idDocumentBackUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        };

        const response = await request(app)
          .post('/api/v1/verification/identity')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(identityData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.verificationLevel).toBe(2);
        expect(response.body.data.payoutLimit).toBe(2000);
      });

      it('should reject API request without front ID document', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        const response = await request(app)
          .post('/api/v1/verification/identity')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(identityData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('ID document front');
      });

      it('should reject API request without back ID document', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
        };

        const response = await request(app)
          .post('/api/v1/verification/identity')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(identityData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('ID document back');
      });

      it('should require authentication', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const identityData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await request(app)
          .post('/api/v1/verification/identity')
          .send(identityData)
          .expect(401);
      });
    });
  });

  describe('Business Verification', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Ensure organizer has identity verification first
      const identityData: IdentityVerificationData = {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00100',
        country: 'Kenya',
        idType: 'national_id',
        idNumber: '12345678',
        idDocumentFrontUrl: 'data:image/png;base64,front',
        idDocumentBackUrl: 'data:image/png;base64,back',
      };

      await VerificationService.submitIdentityVerification(organizerId, identityData);
    });

    describe('submitBusinessVerification', () => {
      it('should submit business verification after identity verification', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const businessData: BusinessVerificationData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
          businessLicenseUrl: 'data:image/png;base64,business-license',
          taxDocumentUrl: 'data:image/png;base64,tax-doc',
        };

        const result = await VerificationService.submitBusinessVerification(organizerId, businessData);

        expect(result.message).toBe('Business verification submitted successfully. Your documents are under review.');
        expect(result.verificationLevel).toBe(2); // Still Level 2 until admin approves

        // Verify user was updated
        const user = await prisma.user.findUnique({
          where: { id: organizerId },
        });

        expect(user?.organizationName).toBe('Test Business Inc');
        expect(user?.kycStatus).toBe('PENDING');
        expect(user?.kycSubmittedAt).toBeDefined();

        // Verify KYC documents were created
        const kycDocuments = await prisma.kYCDocument.findMany({
          where: { userId: organizerId },
        });

        expect(kycDocuments.length).toBeGreaterThan(0);
        const businessLicenseDoc = kycDocuments.find((doc: any) => doc.documentType === 'BUSINESS_LICENSE');
        const taxDoc = kycDocuments.find((doc: any) => doc.documentType === 'TAX_ID');

        expect(businessLicenseDoc).toBeDefined();
        expect(taxDoc).toBeDefined();
        expect(taxDoc?.documentNumber).toBe('TAX123456');
      });

      it('should reject business verification without identity verification', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        // Create a new organizer without identity verification
        const organizerPassword = await hashPassword('Organizer123!@$');
        const newOrganizer = await prisma.user.create({
          data: {
            email: 'neworganizer@test.com',
            password: organizerPassword,
            firstName: 'New',
            lastName: 'Organizer',
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
          },
        });

        const businessData: BusinessVerificationData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
        };

        await expect(
          VerificationService.submitBusinessVerification(newOrganizer.id, businessData),
        ).rejects.toThrow('Identity verification is required before business verification');

        // Cleanup
        await prisma.user.delete({ where: { id: newOrganizer.id } });
      });

      it('should reject business verification if already at Level 3', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        // Update organizer to Level 3
        await prisma.user.update({
          where: { id: organizerId },
          data: {
            verificationLevel: 3,
            kycStatus: 'APPROVED',
          },
        });

        const businessData: BusinessVerificationData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
        };

        await expect(
          VerificationService.submitBusinessVerification(organizerId, businessData),
        ).rejects.toThrow('Business verification is already complete');
      });
    });

    describe('API Endpoint: POST /api/v1/verification/business', () => {
      it('should submit business verification via API', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const businessData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
          businessLicenseUrl: 'data:image/png;base64,business-license',
          taxDocumentUrl: 'data:image/png;base64,tax-doc',
        };

        const response = await request(app)
          .post('/api/v1/verification/business')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(businessData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.verificationLevel).toBe(2);
      });

      it('should require authentication', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const businessData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
        };

        await request(app)
          .post('/api/v1/verification/business')
          .send(businessData)
          .expect(401);
      });
    });
  });

  describe('Get Verification Status', () => {
    describe('getVerificationStatus', () => {
      it('should return verification status for unverified user', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const status = await VerificationService.getVerificationStatus(organizerId);

        expect(status.emailVerified).toBe(true);
        expect(status.identityVerified).toBe(false);
        expect(status.verificationLevel).toBe(1);
        expect(status.payoutLimit).toBeNull();
        expect(status.canCreateFreeEvents).toBe(true);
        expect(status.canCreatePaidEvents).toBe(false);
        expect(status.canReceivePayouts).toBe(false);
      });

      it('should return verification status for identity-verified user', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        // Submit identity verification
        const identityData: IdentityVerificationData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await VerificationService.submitIdentityVerification(organizerId, identityData);

        const status = await VerificationService.getVerificationStatus(organizerId);

        expect(status.identityVerified).toBe(true);
        expect(status.verificationLevel).toBe(2);
        expect(status.payoutLimit).toBe(2000);
        expect(status.canCreatePaidEvents).toBe(true);
        expect(status.canReceivePayouts).toBe(false); // Still false until Level 3
      });

      it('should return verification status for fully verified user (Level 3)', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        // Submit identity verification
        const identityData: IdentityVerificationData = {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya',
          idType: 'national_id',
          idNumber: '12345678',
          idDocumentFrontUrl: 'data:image/png;base64,front',
          idDocumentBackUrl: 'data:image/png;base64,back',
        };

        await VerificationService.submitIdentityVerification(organizerId, identityData);

        // Submit business verification
        const businessData: BusinessVerificationData = {
          businessName: 'Test Business Inc',
          businessType: 'corporation',
          taxId: 'TAX123456',
          businessAddress: '456 Business St',
          businessCity: 'Nairobi',
          businessState: 'Nairobi',
          businessZipCode: '00200',
          businessCountry: 'Kenya',
        };

        await VerificationService.submitBusinessVerification(organizerId, businessData);

        // Manually approve KYC (simulating admin action)
        await prisma.user.update({
          where: { id: organizerId },
          data: {
            verificationLevel: 3,
            kycStatus: 'APPROVED',
            kycApprovedAt: new Date(),
          },
        });

        const status = await VerificationService.getVerificationStatus(organizerId);

        expect(status.verificationLevel).toBe(3);
        expect(status.kycStatus).toBe('APPROVED');
        expect(status.canReceivePayouts).toBe(true);
      });

      it('should reject for non-existent user', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        await expect(
          VerificationService.getVerificationStatus('non-existent-id'),
        ).rejects.toThrow('User not found');
      });
    });

    describe('API Endpoint: GET /api/v1/verification/status', () => {
      it('should return verification status via API', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        const response = await request(app)
          .get('/api/v1/verification/status')
          .set('Authorization', `Bearer ${organizerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('emailVerified');
        expect(response.body.data).toHaveProperty('identityVerified');
        expect(response.body.data).toHaveProperty('verificationLevel');
        expect(response.body.data).toHaveProperty('canCreateFreeEvents');
        expect(response.body.data).toHaveProperty('canCreatePaidEvents');
        expect(response.body.data).toHaveProperty('canReceivePayouts');
      });

      it('should require authentication', async () => {
        if (!dbConnected) {
          logger.info('⏭️  Skipping test - database not connected');
          return;
        }

        await request(app)
          .get('/api/v1/verification/status')
          .expect(401);
      });
    });
  });
});
