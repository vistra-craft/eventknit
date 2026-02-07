import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus, OrganizerEntityType, KYCDocumentType, KYCStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Dashboard - KYC API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let organizerId: string;
  let attendeeToken: string;
  let _attendeeId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
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

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@kyc.test',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@kyc.test',
        password: attendeePassword,
        firstName: 'Event',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    _attendeeId = attendee.id;

    // Login as organizer
    const organizerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@kyc.test',
        password: 'Organizer123!@$',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@kyc.test',
        password: 'Attendee123!@$',
      });
    attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('POST /api/v1/organizer-dashboard/kyc/entity-type', () => {
    it('should set organizer entity type successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
          industry: 'Technology',
          businessName: 'Tech Events LLC',
          registrationNumber: 'REG123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityType).toBe(OrganizerEntityType.LIMITED_LIABILITY_COMPANY);
      expect(response.body.data.requiresReVerification).toBe(false);

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { id: organizerId },
      });
      expect(user?.organizerEntityType).toBe(OrganizerEntityType.LIMITED_LIABILITY_COMPANY);
      expect(user?.organizerIndustry).toBe('Technology');
      expect(user?.organizerBusinessName).toBe('Tech Events LLC');
      expect(user?.organizerRegistrationNumber).toBe('REG123456');
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .send({
          entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        })
        .expect(401);
    });

    it('should only allow organizers to set entity type', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        })
        .expect(403);
    });

    it('should reset KYC status when entity type changes after approval', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set initial entity type
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);

      // Simulate KYC approval
      await prisma.user.update({
        where: { id: organizerId },
        data: {
          kycStatus: KYCStatus.APPROVED,
          kycApprovedAt: new Date(),
        },
      });

      // Change entity type
      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        })
        .expect(200);

      expect(response.body.data.requiresReVerification).toBe(true);

      // Verify KYC status was reset
      const user = await prisma.user.findUnique({
        where: { id: organizerId },
      });
      expect(user?.kycStatus).toBeNull();
      expect(user?.kycApprovedAt).toBeNull();
    });
  });

  describe('GET /api/v1/organizer-dashboard/kyc/requirements', () => {
    it('should return null requirements when entity type is not set', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/requirements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityType).toBeNull();
      expect(response.body.data.requirements).toBeNull();
      expect(response.body.data.documents).toEqual([]);
    });

    it('should return requirements when entity type is set', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set entity type first
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        })
        .expect(200);

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/requirements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityType).toBe(OrganizerEntityType.LIMITED_LIABILITY_COMPANY);
      expect(response.body.data.requirements).toBeDefined();
      expect(response.body.data.documents).toBeInstanceOf(Array);
      expect(response.body.data.documents.length).toBeGreaterThan(0);
      expect(response.body.data.documents[0]).toHaveProperty('documentType');
      expect(response.body.data.documents[0]).toHaveProperty('category');
      expect(response.body.data.documents[0]).toHaveProperty('isRequired');
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/kyc/requirements')
        .expect(401);
    });
  });

  describe('GET /api/v1/organizer-dashboard/kyc/documents', () => {
    it('should return empty documents list when no documents uploaded', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set entity type first
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toEqual([]);
      expect(response.body.data.requirementsStatus).toBeInstanceOf(Array);
      expect(response.body.data.isComplete).toBe(false);
    });

    it('should return documents with requirements status', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set entity type
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);

      // Upload a document
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents.length).toBe(1);
      expect(response.body.data.documents[0].documentType).toBe(KYCDocumentType.NATIONAL_ID);
      expect(response.body.data.requirementsStatus).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/kyc/documents')
        .expect(401);
    });
  });

  describe('POST /api/v1/organizer-dashboard/kyc/documents', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Set entity type for all document tests
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);
    });

    it('should create a KYC document successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
          issueDate: '2020-01-01T00:00:00Z',
          expiryDate: '2030-01-01T00:00:00Z',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document).toBeDefined();
      expect(response.body.data.document.documentType).toBe(KYCDocumentType.NATIONAL_ID);
      expect(response.body.data.document.documentNumber).toBe('ID123456');
      expect(response.body.data.document.status).toBe(KYCStatus.PENDING);

      // Verify in database
      const document = await prisma.kYCDocument.findFirst({
        where: { userId: organizerId, documentType: KYCDocumentType.NATIONAL_ID },
      });
      expect(document).toBeDefined();
      expect(document?.documentNumber).toBe('ID123456');
    });

    it('should reject document type not required for entity type', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // SOLE_PROPRIETOR doesn't require CR12 (company document)
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.CR12,
          documentNumber: 'CR123456',
          documentUrl: 'https://example.com/cr12.pdf',
        })
        .expect(400);
    });

    it('should require entity type to be set before uploading documents', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a new organizer without entity type
      const newOrgPassword = await hashPassword('NewOrg123!@$');
      const newOrg = await prisma.user.create({
        data: {
          email: 'neworg@kyc.test',
          password: newOrgPassword,
          firstName: 'New',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const newOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'neworg@kyc.test',
          password: 'NewOrg123!@$',
        });
      const newOrgToken = newOrgLogin.body.data.accessToken;

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${newOrgToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: newOrg.id } });
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(401);
    });
  });

  describe('PUT /api/v1/organizer-dashboard/kyc/documents/:documentId', () => {
    let documentId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      // Set entity type
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);

      // Create a document
      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(201);
      documentId = response.body.data.document.id;
    });

    it('should update a KYC document successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentNumber: 'ID789012',
          documentUrl: 'https://example.com/new-doc.pdf',
          expiryDate: '2035-01-01T00:00:00Z',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document.documentNumber).toBe('ID789012');
      expect(response.body.data.document.documentUrl).toBe('https://example.com/new-doc.pdf');

      // Verify in database
      const document = await prisma.kYCDocument.findUnique({
        where: { id: documentId },
      });
      expect(document?.documentNumber).toBe('ID789012');
      expect(document?.status).toBe(KYCStatus.PENDING); // Status should reset to pending
    });

    it('should not allow updating approved documents', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Approve the document
      await prisma.kYCDocument.update({
        where: { id: documentId },
        data: { status: KYCStatus.APPROVED },
      });

      await request(app)
        .put(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentNumber: 'ID999999',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .send({
          documentNumber: 'ID789012',
        })
        .expect(401);
    });

    it('should not allow updating other users documents', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrgPassword = await hashPassword('OtherOrg123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'otherog@kyc.test',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'otherog@kyc.test',
          password: 'OtherOrg123!@$',
        });
      const otherOrgToken = otherOrgLogin.body.data.accessToken;

      await request(app)
        .put(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({
          documentNumber: 'ID999999',
        })
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: otherOrg.id } });
    });
  });

  describe('DELETE /api/v1/organizer-dashboard/kyc/documents/:documentId', () => {
    let documentId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      // Set entity type
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);

      // Create a document
      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/doc.pdf',
        })
        .expect(201);
      documentId = response.body.data.document.id;
    });

    it('should delete a KYC document successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deleted from database
      const document = await prisma.kYCDocument.findUnique({
        where: { id: documentId },
      });
      expect(document).toBeNull();
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .expect(401);
    });

    it('should not allow deleting other users documents', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrgPassword = await hashPassword('OtherOrg123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'otherog2@kyc.test',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'otherog2@kyc.test',
          password: 'OtherOrg123!@$',
        });
      const otherOrgToken = otherOrgLogin.body.data.accessToken;

      await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/documents/${documentId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: otherOrg.id } });
    });
  });

  describe('POST /api/v1/organizer-dashboard/kyc/submit', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Set entity type
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/entity-type')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          entityType: OrganizerEntityType.SOLE_PROPRIETOR,
        })
        .expect(200);
    });

    it('should reject submission when required documents are missing', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/submit')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(400);
    });

    it('should submit KYC for review when all requirements are met', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upload required documents
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.NATIONAL_ID,
          documentNumber: 'ID123456',
          documentUrl: 'https://example.com/id.pdf',
        })
        .expect(201);

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/documents')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          documentType: KYCDocumentType.KRA_PIN,
          documentNumber: 'PIN123456',
          documentUrl: 'https://example.com/pin.pdf',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/submit')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // Verify KYC status updated
      const user = await prisma.user.findUnique({
        where: { id: organizerId },
      });
      expect(user?.kycStatus).toBe(KYCStatus.PENDING);
      expect(user?.kycSubmittedAt).toBeDefined();
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/submit')
        .expect(401);
    });
  });

  describe('GET /api/v1/organizer-dashboard/kyc/directors', () => {
    it('should return empty directors list when none added', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/directors')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.directors).toEqual([]);
    });

    it('should return directors when added', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Add a director
      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/directors')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          fullName: 'John Doe',
          nationality: 'Kenyan',
          dateOfBirth: '1990-01-01',
          documentType: 'National ID',
          documentNumber: 'ID123456',
          kraPin: 'PIN123456',
          sharePercentage: 50,
          position: 'Director',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/kyc/directors')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.directors.length).toBe(1);
      expect(response.body.data.directors[0].fullName).toBe('John Doe');
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/kyc/directors')
        .expect(401);
    });
  });

  describe('POST /api/v1/organizer-dashboard/kyc/directors', () => {
    it('should create a director successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/directors')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          fullName: 'John Doe',
          nationality: 'Kenyan',
          dateOfBirth: '1990-01-01',
          documentType: 'National ID',
          documentNumber: 'ID123456',
          kraPin: 'PIN123456',
          sharePercentage: 50,
          position: 'Director',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.director).toBeDefined();
      expect(response.body.data.director.fullName).toBe('John Doe');
      expect(response.body.data.director.nationality).toBe('Kenyan');
      expect(response.body.data.director.sharePercentage).toBe(50);

      // Verify in database
      const director = await prisma.organizerDirector.findFirst({
        where: { userId: organizerId },
      });
      expect(director).toBeDefined();
      expect(director?.fullName).toBe('John Doe');
    });

    it('should mark top 5 shareholders correctly', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create 6 directors with different share percentages
      const sharePercentages = [30, 25, 20, 15, 5, 4];
      for (let i = 0; i < sharePercentages.length; i++) {
        await request(app)
          .post('/api/v1/organizer-dashboard/kyc/directors')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            fullName: `Director ${i + 1}`,
            nationality: 'Kenyan',
            dateOfBirth: '1990-01-01',
            documentType: 'National ID',
            documentNumber: `ID${i + 1}`,
            sharePercentage: sharePercentages[i],
          })
          .expect(201);
      }

      // Check which directors are marked as top 5
      const directors = await prisma.organizerDirector.findMany({
        where: { userId: organizerId },
        orderBy: { sharePercentage: 'desc' },
      });

      // Top 5 should be marked
      const topFive = directors.slice(0, 5);
      expect(topFive.every((d) => d.isTopFive === true)).toBe(true);

      // 6th should not be marked
      if (directors.length > 5) {
        expect(directors[5].isTopFive).toBe(false);
      }
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/kyc/directors')
        .send({
          fullName: 'John Doe',
          nationality: 'Kenyan',
          dateOfBirth: '1990-01-01',
          documentType: 'National ID',
          documentNumber: 'ID123456',
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/organizer-dashboard/kyc/directors/:directorId', () => {
    let directorId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      // Create a director
      const response = await request(app)
        .post('/api/v1/organizer-dashboard/kyc/directors')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          fullName: 'John Doe',
          nationality: 'Kenyan',
          dateOfBirth: '1990-01-01',
          documentType: 'National ID',
          documentNumber: 'ID123456',
          sharePercentage: 50,
        })
        .expect(201);
      directorId = response.body.data.director.id;
    });

    it('should delete a director successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/directors/${directorId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deleted from database
      const director = await prisma.organizerDirector.findUnique({
        where: { id: directorId },
      });
      expect(director).toBeNull();
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/directors/${directorId}`)
        .expect(401);
    });

    it('should not allow deleting other users directors', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrgPassword = await hashPassword('OtherOrg123!@$');
      const otherOrg = await prisma.user.create({
        data: {
          email: 'otherog3@kyc.test',
          password: otherOrgPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'otherog3@kyc.test',
          password: 'OtherOrg123!@$',
        });
      const otherOrgToken = otherOrgLogin.body.data.accessToken;

      await request(app)
        .delete(`/api/v1/organizer-dashboard/kyc/directors/${directorId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: otherOrg.id } });
    });
  });
});
