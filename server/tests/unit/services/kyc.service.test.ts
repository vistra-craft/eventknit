import { KYCService, CreateKYCDocumentData, SetEntityTypeData, CreateDirectorData } from '../../../src/services/kyc.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.js';
import { KYCStatus, KYCDocumentType, OrganizerEntityType } from '@prisma/client';
import * as kycRequirements from '../../../src/config/kyc-requirements.config.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    kYCDocument: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    organizerDirector: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');
jest.mock('../../../src/config/kyc-requirements.config.js', () => ({
  getEntityRequirements: jest.fn(),
  getRequiredDocuments: jest.fn(),
  requiresDirectorsOrShareholders: jest.fn(),
}));

describe('KYCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setEntityType', () => {
    it('should set entity type for user without existing type', async () => {
      // Arrange
      const userId = 'user-1';
      const data: SetEntityTypeData = {
        entityType: OrganizerEntityType.INDIVIDUAL,
        industry: 'Events',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        organizerEntityType: null,
        kycStatus: null,
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        organizerEntityType: data.entityType,
      });

      // Act
      const result = await KYCService.setEntityType(userId, data);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          organizerEntityType: data.entityType,
          organizerIndustry: data.industry,
          organizerBusinessName: null,
          organizerRegistrationNumber: null,
        },
      });
      expect(result.requiresReVerification).toBeFalsy();
    });

    it('should reset KYC when entity type changes for approved user', async () => {
      // Arrange
      const userId = 'user-2';
      const data: SetEntityTypeData = {
        entityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        businessName: 'Test Company',
        registrationNumber: 'REG-123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        kycStatus: KYCStatus.APPROVED,
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        organizerEntityType: data.entityType,
      });

      // Act
      const result = await KYCService.setEntityType(userId, data);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          organizerEntityType: data.entityType,
          organizerIndustry: null,
          organizerBusinessName: data.businessName,
          organizerRegistrationNumber: data.registrationNumber,
          kycStatus: null,
          kycSubmittedAt: null,
          kycApprovedAt: null,
        },
      });
      expect(prisma.kYCDocument.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result.requiresReVerification).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(`Entity type changed for user ${userId}, KYC reset`);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(KYCService.setEntityType('nonexistent', {
        entityType: OrganizerEntityType.INDIVIDUAL,
      })).rejects.toThrow(NotFoundError);
    });

    it('should not reset KYC if entity type is the same', async () => {
      // Arrange
      const userId = 'user-3';
      const data: SetEntityTypeData = {
        entityType: OrganizerEntityType.INDIVIDUAL,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        kycStatus: KYCStatus.APPROVED,
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await KYCService.setEntityType(userId, data);

      // Assert
      expect(prisma.kYCDocument.deleteMany).not.toHaveBeenCalled();
      expect(result.requiresReVerification).toBe(false);
    });
  });

  describe('getKYCRequirements', () => {
    it('should return requirements for user with entity type', async () => {
      // Arrange
      const userId = 'user-1';
      const mockRequirements = {
        entityType: OrganizerEntityType.INDIVIDUAL,
        displayName: 'Individual',
        category: 'individual',
      };
      const mockDocuments = [
        { documentType: KYCDocumentType.NATIONAL_ID, description: 'National ID' },
      ];
      const mockDirectorReqs = {
        requiresDirectors: false,
        requiresShareholders: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
      });

      (kycRequirements.getEntityRequirements as jest.Mock).mockReturnValue(mockRequirements);
      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue(mockDocuments);
      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue(mockDirectorReqs);

      // Act
      const result = await KYCService.getKYCRequirements(userId);

      // Assert
      expect(result.entityType).toBe(OrganizerEntityType.INDIVIDUAL);
      expect(result.requirements).toEqual(mockRequirements);
      expect(result.documents).toEqual(mockDocuments);
      expect(result.requiresDirectors).toBe(false);
    });

    it('should return null requirements for user without entity type', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: null,
        organizerIndustry: null,
      });

      // Act
      const result = await KYCService.getKYCRequirements('user-1');

      // Assert
      expect(result.entityType).toBeNull();
      expect(result.requirements).toBeNull();
      expect(result.documents).toEqual([]);
      expect(result.requiresDirectors).toBe(false);
    });

    it('should throw ValidationError for invalid entity type', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
      });

      (kycRequirements.getEntityRequirements as jest.Mock).mockReturnValue(null);

      // Act & Assert
      await expect(KYCService.getKYCRequirements('user-1')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(KYCService.getKYCRequirements('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserKYCDocuments', () => {
    it('should return user documents with requirements status', async () => {
      // Arrange
      const userId = 'user-1';
      const mockDocuments = [
        {
          id: 'doc-1',
          documentType: KYCDocumentType.NATIONAL_ID,
          status: KYCStatus.APPROVED,
        },
        {
          id: 'doc-2',
          documentType: KYCDocumentType.KRA_PIN,
          status: KYCStatus.PENDING,
        },
      ];

      const mockRequirements = [
        {
          documentType: KYCDocumentType.NATIONAL_ID,
          minQuantity: 1,
          isRequired: true,
          description: 'National ID',
        },
        {
          documentType: KYCDocumentType.KRA_PIN,
          minQuantity: 1,
          isRequired: true,
          description: 'KRA PIN',
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
      });

      (prisma.kYCDocument.findMany as jest.Mock).mockResolvedValue(mockDocuments);
      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue(mockRequirements);

      // Act
      const result = await KYCService.getUserKYCDocuments(userId);

      // Assert
      expect(result.documents).toEqual(mockDocuments);
      expect(result.requirementsStatus).toHaveLength(2);
      expect(result.requirementsStatus[0].approvedCount).toBe(1);
      expect(result.requirementsStatus[0].isComplete).toBe(true);
      expect(result.requirementsStatus[1].approvedCount).toBe(0);
      expect(result.requirementsStatus[1].pendingCount).toBe(1);
      expect(result.isComplete).toBe(false); // Not complete because second doc is pending
    });

    it('should handle user without entity type', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: null,
        organizerIndustry: null,
      });

      (prisma.kYCDocument.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await KYCService.getUserKYCDocuments('user-1');

      // Assert
      expect(result.documents).toEqual([]);
      expect(result.requirementsStatus).toEqual([]);
      expect(result.isComplete).toBe(true);
    });
  });

  describe('getKYCDocument', () => {
    it('should return document for authorized user', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        documentType: KYCDocumentType.NATIONAL_ID,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      // Act
      const result = await KYCService.getKYCDocument('doc-1', 'user-1');

      // Assert
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundError if document does not exist', async () => {
      // Arrange
      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(KYCService.getKYCDocument('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for unauthorized access', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        documentType: KYCDocumentType.NATIONAL_ID,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(KYCService.getKYCDocument('doc-1', 'user-2')).rejects.toThrow(ValidationError);
    });
  });

  describe('createKYCDocument', () => {
    it('should create KYC document successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const data: CreateKYCDocumentData = {
        documentType: KYCDocumentType.NATIONAL_ID,
        documentNumber: 'ID-123456',
        documentUrl: 'https://example.com/id.pdf',
      };

      const mockRequirement = {
        documentType: KYCDocumentType.NATIONAL_ID,
        category: 'identity',
        isRequired: true,
        isConditional: false,
        minQuantity: 1,
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          organizerEntityType: OrganizerEntityType.INDIVIDUAL,
          organizerIndustry: null,
        })
        .mockResolvedValueOnce({
          kycDocuments: [{ id: 'doc-1' }],
        });

      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue([mockRequirement]);
      (prisma.kYCDocument.count as jest.Mock).mockResolvedValue(0);
      (prisma.kYCDocument.create as jest.Mock).mockResolvedValue({
        id: 'doc-1',
        ...data,
        status: KYCStatus.PENDING,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await KYCService.createKYCDocument(userId, data);

      // Assert
      expect(result.documentType).toBe(data.documentType);
      expect(result.status).toBe(KYCStatus.PENDING);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          kycStatus: KYCStatus.PENDING,
          kycSubmittedAt: expect.any(Date),
        },
      });
    });

    it('should throw ValidationError if entity type not set', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: null,
        organizerIndustry: null,
      });

      // Act & Assert
      await expect(KYCService.createKYCDocument('user-1', {
        documentType: KYCDocumentType.NATIONAL_ID,
      })).rejects.toThrow('Entity type must be set before uploading documents');
    });

    it('should throw ValidationError for document type not required for entity', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
      });

      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue([]);

      // Act & Assert
      await expect(KYCService.createKYCDocument('user-1', {
        documentType: KYCDocumentType.CERTIFICATE_OF_INCORPORATION,
      })).rejects.toThrow('Document type CERTIFICATE_OF_INCORPORATION is not required for this entity type');
    });

    it('should throw ValidationError if maximum quantity reached', async () => {
      // Arrange
      const mockRequirement = {
        documentType: KYCDocumentType.NATIONAL_ID,
        category: 'identity',
        isRequired: true,
        isConditional: false,
        minQuantity: 1,
        maxQuantity: 2,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
      });

      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue([mockRequirement]);
      (prisma.kYCDocument.count as jest.Mock).mockResolvedValue(2);

      // Act & Assert
      await expect(KYCService.createKYCDocument('user-1', {
        documentType: KYCDocumentType.NATIONAL_ID,
      })).rejects.toThrow('Maximum 2 documents of this type allowed');
    });
  });

  describe('updateKYCDocument', () => {
    it('should update pending document successfully', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        status: KYCStatus.PENDING,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);
      (prisma.kYCDocument.update as jest.Mock).mockResolvedValue({
        ...mockDocument,
        documentNumber: 'NEW-123',
      });

      // Act
      const result = await KYCService.updateKYCDocument('doc-1', 'user-1', {
        documentNumber: 'NEW-123',
      });

      // Assert
      expect(result.documentNumber).toBe('NEW-123');
      expect(prisma.kYCDocument.update).toHaveBeenCalled();
    });

    it('should throw ValidationError when updating approved document', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        status: KYCStatus.APPROVED,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(KYCService.updateKYCDocument('doc-1', 'user-1', {
        documentNumber: 'NEW-123',
      })).rejects.toThrow('Cannot update approved documents');
    });
  });

  describe('deleteKYCDocument', () => {
    it('should delete pending document successfully', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        status: KYCStatus.PENDING,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);
      (prisma.kYCDocument.delete as jest.Mock).mockResolvedValue(mockDocument);

      // Act
      await KYCService.deleteKYCDocument('doc-1', 'user-1');

      // Assert
      expect(prisma.kYCDocument.delete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(logger.info).toHaveBeenCalledWith('KYC document deleted: doc-1 by user: user-1');
    });

    it('should throw ValidationError when deleting approved document', async () => {
      // Arrange
      const mockDocument = {
        id: 'doc-1',
        userId: 'user-1',
        status: KYCStatus.APPROVED,
      };

      (prisma.kYCDocument.findUnique as jest.Mock).mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(KYCService.deleteKYCDocument('doc-1', 'user-1')).rejects.toThrow('Cannot delete approved documents');
    });
  });

  describe('submitKYCForReview', () => {
    it('should submit KYC for review when all requirements are met', async () => {
      // Arrange
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
        kycDocuments: [
          { documentType: KYCDocumentType.NATIONAL_ID, status: KYCStatus.PENDING },
          { documentType: KYCDocumentType.KRA_PIN, status: KYCStatus.PENDING },
        ],
        organizerDirectors: [],
      };

      const mockRequirements = [
        {
          documentType: KYCDocumentType.NATIONAL_ID,
          minQuantity: 1,
          isRequired: true,
          isConditional: false,
          description: 'National ID',
        },
        {
          documentType: KYCDocumentType.KRA_PIN,
          minQuantity: 1,
          isRequired: true,
          isConditional: false,
          description: 'KRA PIN',
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue(mockRequirements);
      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: false,
        requiresShareholders: false,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await KYCService.submitKYCForReview(userId);

      // Assert
      expect(result.message).toBe('KYC submitted for review');
      expect(result.documentsCount).toBe(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          kycStatus: KYCStatus.PENDING,
          kycSubmittedAt: expect.any(Date),
        },
      });
    });

    it('should throw ValidationError if documents are missing', async () => {
      // Arrange
      const mockUser = {
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
        organizerIndustry: null,
        kycDocuments: [],
        organizerDirectors: [],
      };

      const mockRequirements = [
        {
          documentType: KYCDocumentType.NATIONAL_ID,
          minQuantity: 1,
          isRequired: true,
          isConditional: false,
          description: 'National ID',
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue(mockRequirements);
      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: false,
        requiresShareholders: false,
      });

      // Act & Assert
      await expect(KYCService.submitKYCForReview('user-1')).rejects.toThrow(
        /Missing required documents/,
      );
    });

    it('should throw ValidationError if directors are required but missing', async () => {
      // Arrange
      const mockUser = {
        organizerEntityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
        organizerIndustry: null,
        kycDocuments: [
          { documentType: KYCDocumentType.CERTIFICATE_OF_INCORPORATION, status: KYCStatus.PENDING },
        ],
        organizerDirectors: [],
      };

      const mockRequirements = [
        {
          documentType: KYCDocumentType.CERTIFICATE_OF_INCORPORATION,
          minQuantity: 1,
          isRequired: true,
          isConditional: false,
          description: 'Certificate of Incorporation',
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (kycRequirements.getRequiredDocuments as jest.Mock).mockReturnValue(mockRequirements);
      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: true,
        requiresShareholders: true,
        minDirectors: 2,
      });

      // Act & Assert
      await expect(KYCService.submitKYCForReview('user-1')).rejects.toThrow(
        /Directors\/Shareholders/,
      );
    });

    it('should throw ValidationError if entity type not set', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: null,
        kycDocuments: [],
        organizerDirectors: [],
      });

      // Act & Assert
      await expect(KYCService.submitKYCForReview('user-1')).rejects.toThrow(
        'Entity type must be set before submitting KYC',
      );
    });
  });

  describe('getDirectors', () => {
    it('should return directors ordered by top five and share percentage', async () => {
      // Arrange
      const mockDirectors = [
        { id: 'dir-1', isTopFive: true, sharePercentage: 30 },
        { id: 'dir-2', isTopFive: true, sharePercentage: 25 },
      ];

      (prisma.organizerDirector.findMany as jest.Mock).mockResolvedValue(mockDirectors);

      // Act
      const result = await KYCService.getDirectors('user-1');

      // Assert
      expect(result).toEqual(mockDirectors);
      expect(prisma.organizerDirector.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [
          { isTopFive: 'desc' },
          { sharePercentage: 'desc' },
        ],
      });
    });
  });

  describe('createDirector', () => {
    it('should create director successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const data: CreateDirectorData = {
        fullName: 'John Doe',
        nationality: 'KE',
        dateOfBirth: new Date('1980-01-01'),
        documentType: 'National ID',
        documentNumber: 'ID-123',
        kraPin: 'KRA-123',
        sharePercentage: 25,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
      });

      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: true,
        requiresShareholders: true,
        maxDirectorsToCollect: 5,
      });

      (prisma.organizerDirector.count as jest.Mock).mockResolvedValue(3);
      (prisma.organizerDirector.create as jest.Mock).mockResolvedValue({
        id: 'dir-1',
        ...data,
        isTopFive: true,
      });

      // Act
      const result = await KYCService.createDirector(userId, data);

      // Assert
      expect(result.id).toBe('dir-1');
      expect(result.isTopFive).toBe(true);
    });

    it('should mark director as not top five if limit reached', async () => {
      // Arrange
      const data: CreateDirectorData = {
        fullName: 'John Doe',
        nationality: 'KE',
        dateOfBirth: new Date('1980-01-01'),
        documentType: 'National ID',
        documentNumber: 'ID-123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.LIMITED_LIABILITY_COMPANY,
      });

      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: true,
        requiresShareholders: true,
        maxDirectorsToCollect: 5,
      });

      (prisma.organizerDirector.count as jest.Mock).mockResolvedValue(5);
      (prisma.organizerDirector.create as jest.Mock).mockResolvedValue({
        id: 'dir-6',
        ...data,
        isTopFive: false,
      });

      // Act
      const result = await KYCService.createDirector('user-1', data);

      // Assert
      expect(result.isTopFive).toBe(false);
    });

    it('should throw ValidationError if entity type does not require directors', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: OrganizerEntityType.INDIVIDUAL,
      });

      (kycRequirements.requiresDirectorsOrShareholders as jest.Mock).mockReturnValue({
        requiresDirectors: false,
        requiresShareholders: false,
      });

      // Act & Assert
      await expect(KYCService.createDirector('user-1', {
        fullName: 'John Doe',
        nationality: 'KE',
        dateOfBirth: new Date('1980-01-01'),
        documentType: 'National ID',
        documentNumber: 'ID-123',
      })).rejects.toThrow('This entity type does not require directors or shareholders');
    });

    it('should throw ValidationError if entity type not set', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        organizerEntityType: null,
      });

      // Act & Assert
      await expect(KYCService.createDirector('user-1', {
        fullName: 'John Doe',
        nationality: 'KE',
        dateOfBirth: new Date('1980-01-01'),
        documentType: 'National ID',
        documentNumber: 'ID-123',
      })).rejects.toThrow('Entity type must be set before adding directors');
    });
  });

  describe('deleteDirector', () => {
    it('should delete director successfully', async () => {
      // Arrange
      const mockDirector = {
        id: 'dir-1',
        userId: 'user-1',
      };

      (prisma.organizerDirector.findUnique as jest.Mock).mockResolvedValue(mockDirector);
      (prisma.organizerDirector.delete as jest.Mock).mockResolvedValue(mockDirector);

      // Act
      await KYCService.deleteDirector('dir-1', 'user-1');

      // Assert
      expect(prisma.organizerDirector.delete).toHaveBeenCalledWith({
        where: { id: 'dir-1' },
      });
      expect(logger.info).toHaveBeenCalledWith('Director deleted: dir-1 by user: user-1');
    });

    it('should throw NotFoundError if director does not exist', async () => {
      // Arrange
      (prisma.organizerDirector.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(KYCService.deleteDirector('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for unauthorized deletion', async () => {
      // Arrange
      const mockDirector = {
        id: 'dir-1',
        userId: 'user-1',
      };

      (prisma.organizerDirector.findUnique as jest.Mock).mockResolvedValue(mockDirector);

      // Act & Assert
      await expect(KYCService.deleteDirector('dir-1', 'user-2')).rejects.toThrow(
        'You do not have permission to delete this director',
      );
    });
  });
});
