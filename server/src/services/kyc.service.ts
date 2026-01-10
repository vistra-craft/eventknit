import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { KYCStatus, KYCDocumentType, OrganizerEntityType } from '@prisma/client';
import {
  getEntityRequirements,
  getRequiredDocuments,
  requiresDirectorsOrShareholders,
  DocumentRequirement,
} from '../config/kyc-requirements.config.js';

export interface CreateKYCDocumentData {
  documentType: KYCDocumentType;
  documentNumber?: string;
  documentUrl?: string;
  issueDate?: Date;
  expiryDate?: Date;
}

export interface UpdateKYCDocumentData {
  documentNumber?: string;
  documentUrl?: string;
  issueDate?: Date;
  expiryDate?: Date;
}

export interface SetEntityTypeData {
  entityType: OrganizerEntityType;
  industry?: string;
  businessName?: string;
  registrationNumber?: string;
}

export interface CreateDirectorData {
  fullName: string;
  nationality: string;
  dateOfBirth: Date;
  documentType: string;
  documentNumber: string;
  kraPin?: string;
  sharePercentage?: number;
  position?: string;
}

export class KYCService {
  /**
   * Set organizer entity type and related information
   */
  static async setEntityType(userId: string, data: SetEntityTypeData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizerEntityType: true,
        kycStatus: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If entity type is changing and KYC was already submitted/approved, mark as needing update
    const entityTypeChanged = user.organizerEntityType && user.organizerEntityType !== data.entityType;
    const needsReVerification = entityTypeChanged && (user.kycStatus === KYCStatus.APPROVED || user.kycStatus === KYCStatus.PENDING);

    if (needsReVerification) {
      // Reset KYC status to require new documents
      await prisma.user.update({
        where: { id: userId },
        data: {
          organizerEntityType: data.entityType,
          organizerIndustry: data.industry || null,
          organizerBusinessName: data.businessName || null,
          organizerRegistrationNumber: data.registrationNumber || null,
          kycStatus: null,
          kycSubmittedAt: null,
          kycApprovedAt: null,
        },
      });

      // Delete existing KYC documents (or mark as obsolete)
      await prisma.kYCDocument.deleteMany({
        where: { userId },
      });

      logger.info(`Entity type changed for user ${userId}, KYC reset`);
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          organizerEntityType: data.entityType,
          organizerIndustry: data.industry || null,
          organizerBusinessName: data.businessName || null,
          organizerRegistrationNumber: data.registrationNumber || null,
        },
      });
    }

    return {
      entityType: data.entityType,
      requiresReVerification: needsReVerification,
    };
  }

  /**
   * Get KYC requirements for a user based on their entity type
   */
  static async getKYCRequirements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizerEntityType: true,
        organizerIndustry: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.organizerEntityType) {
      return {
        entityType: null,
        requirements: null,
        documents: [],
        requiresDirectors: false,
        requiresShareholders: false,
      };
    }

    const requirements = getEntityRequirements(user.organizerEntityType);
    if (!requirements) {
      throw new ValidationError('Invalid entity type');
    }

    const documents = getRequiredDocuments(user.organizerEntityType, user.organizerIndustry || undefined);
    const directorRequirements = requiresDirectorsOrShareholders(user.organizerEntityType);

    return {
      entityType: user.organizerEntityType,
      requirements,
      documents,
      requiresDirectors: directorRequirements.requiresDirectors,
      requiresShareholders: directorRequirements.requiresShareholders,
      minDirectors: directorRequirements.minDirectors,
      maxDirectorsToCollect: directorRequirements.maxDirectorsToCollect,
    };
  }

  /**
   * Get all KYC documents for a user with their requirements status
   */
  static async getUserKYCDocuments(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizerEntityType: true,
        organizerIndustry: true,
      },
    });

    const documents = await prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get requirements to check completeness
    let requirements: DocumentRequirement[] = [];
    if (user?.organizerEntityType) {
      requirements = getRequiredDocuments(user.organizerEntityType, user.organizerIndustry || undefined);
    }

    // Map documents by type to check quantities
    const documentsByType = new Map<string, typeof documents>();
    documents.forEach((doc) => {
      const type = doc.documentType;
      if (!documentsByType.has(type)) {
        documentsByType.set(type, []);
      }
      documentsByType.get(type)!.push(doc);
    });

    // Check which requirements are met
    const requirementsStatus = requirements.map((req) => {
      const uploadedDocs = documentsByType.get(req.documentType) || [];
      const approvedCount = uploadedDocs.filter((d) => d.status === KYCStatus.APPROVED).length;
      const pendingCount = uploadedDocs.filter((d) => d.status === KYCStatus.PENDING).length;
      const isComplete = approvedCount >= req.minQuantity;
      const hasMinimum = (approvedCount + pendingCount) >= req.minQuantity;

      return {
        ...req,
        uploadedCount: uploadedDocs.length,
        approvedCount,
        pendingCount,
        isComplete,
        hasMinimum,
      };
    });

    return {
      documents,
      requirementsStatus,
      isComplete: requirementsStatus.every((req) => req.isRequired && req.isComplete),
    };
  }

  /**
   * Get a single KYC document
   */
  static async getKYCDocument(documentId: string, userId: string) {
    const document = await prisma.kYCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundError('KYC document not found');
    }

    if (document.userId !== userId) {
      throw new ValidationError('You do not have permission to access this document');
    }

    return document;
  }

  /**
   * Create a new KYC document
   * Allows multiple documents of the same type (for quantity requirements)
   */
  static async createKYCDocument(userId: string, data: CreateKYCDocumentData) {
    // Validate entity type is set
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizerEntityType: true,
        organizerIndustry: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.organizerEntityType) {
      throw new ValidationError('Entity type must be set before uploading documents');
    }

    // Get requirements to validate document type
    const requirements = getRequiredDocuments(user.organizerEntityType, user.organizerIndustry || undefined);
    const docRequirement = requirements.find((req) => req.documentType === data.documentType);

    if (!docRequirement) {
      throw new ValidationError(`Document type ${data.documentType} is not required for this entity type`);
    }

    // Validate document validity if expiry date is provided
    if (data.expiryDate && docRequirement.validityPeriodDays) {
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() - docRequirement.validityPeriodDays);

      if (data.expiryDate < validityDate) {
        throw new ValidationError(
          `Document must be valid (less than ${docRequirement.validityPeriodDays} days old). Document appears to be expired or too old.`,
        );
      }
    }

    // Check quantity limits (we allow multiple, but validate max if specified)
    const existingCount = await prisma.kYCDocument.count({
      where: {
        userId,
        documentType: data.documentType,
        status: { not: 'REJECTED' },
      },
    });

    if (docRequirement.maxQuantity && existingCount >= docRequirement.maxQuantity) {
      throw new ValidationError(`Maximum ${docRequirement.maxQuantity} documents of this type allowed`);
    }

    // Get document category from requirement
    const documentCategory = docRequirement.category;

    const document = await prisma.kYCDocument.create({
      data: {
        userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl,
        documentCategory,
        issueDate: data.issueDate || null,
        expiryDate: data.expiryDate || null,
        isRequired: docRequirement.isRequired,
        isConditional: docRequirement.isConditional,
        status: KYCStatus.PENDING,
      },
    });

    // Update user KYC status if this is the first document
    const userWithDocs = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycDocuments: true },
    });

    if (userWithDocs && userWithDocs.kycDocuments.length === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: KYCStatus.PENDING,
          kycSubmittedAt: new Date(),
        },
      });
    }

    logger.info(`KYC document created: ${document.id} for user: ${userId}`);

    return document;
  }

  /**
   * Update a KYC document
   */
  static async updateKYCDocument(
    documentId: string,
    userId: string,
    data: UpdateKYCDocumentData,
  ) {
    const document = await this.getKYCDocument(documentId, userId);

    // Can only update if pending or rejected
    if (document.status === KYCStatus.APPROVED) {
      throw new ValidationError('Cannot update approved documents');
    }

    return prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        status: KYCStatus.PENDING, // Reset to pending if it was rejected
      },
    });
  }

  /**
   * Delete a KYC document
   */
  static async deleteKYCDocument(documentId: string, userId: string) {
    const document = await this.getKYCDocument(documentId, userId);

    // Can only delete if pending or rejected
    if (document.status === KYCStatus.APPROVED) {
      throw new ValidationError('Cannot delete approved documents');
    }

    await prisma.kYCDocument.delete({
      where: { id: documentId },
    });

    logger.info(`KYC document deleted: ${documentId} by user: ${userId}`);
  }

  /**
   * Submit KYC for review (validate all requirements are met)
   */
  static async submitKYCForReview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: true,
        organizerDirectors: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.organizerEntityType) {
      throw new ValidationError('Entity type must be set before submitting KYC');
    }

    // Get requirements
    const requirements = getRequiredDocuments(user.organizerEntityType, user.organizerIndustry || undefined);
    const directorRequirements = requiresDirectorsOrShareholders(user.organizerEntityType);

    // Validate documents
    const documentsByType = new Map<string, typeof user.kycDocuments>();
    user.kycDocuments.forEach((doc) => {
      if (!documentsByType.has(doc.documentType)) {
        documentsByType.set(doc.documentType, []);
      }
      documentsByType.get(doc.documentType)!.push(doc);
    });

    const missingDocuments: string[] = [];
    const _incompleteDocuments: string[] = [];

    for (const req of requirements) {
      if (!req.isRequired || req.isConditional) continue; // Skip conditionals for now

      const uploadedDocs = documentsByType.get(req.documentType) || [];
      const approvedCount = uploadedDocs.filter((d) => d.status === KYCStatus.APPROVED).length;
      const pendingCount = uploadedDocs.filter((d) => d.status === KYCStatus.PENDING).length;
      const totalCount = approvedCount + pendingCount;

      if (totalCount < req.minQuantity) {
        missingDocuments.push(`${req.description} (need at least ${req.minQuantity}, have ${totalCount})`);
      }
    }

    // Validate directors/shareholders if required
    if (directorRequirements.requiresDirectors) {
      const directorsCount = user.organizerDirectors.length;
      const minDirectors = directorRequirements.minDirectors || 1;

      if (directorsCount < minDirectors) {
        missingDocuments.push(
          `Directors/Shareholders (need at least ${minDirectors}, have ${directorsCount})`,
        );
      }
    }

    if (missingDocuments.length > 0) {
      throw new ValidationError(
        `Missing required documents or information:\n${missingDocuments.join('\n')}`,
      );
    }

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.PENDING,
        kycSubmittedAt: new Date(),
      },
    });

    logger.info(`KYC submitted for review: ${userId}`);

    return {
      message: 'KYC submitted for review',
      documentsCount: user.kycDocuments.filter((d) => d.status === KYCStatus.PENDING).length,
    };
  }

  /**
   * Get all directors/shareholders for a user
   */
  static async getDirectors(userId: string) {
    return prisma.organizerDirector.findMany({
      where: { userId },
      orderBy: [
        { isTopFive: 'desc' },
        { sharePercentage: 'desc' },
      ],
    });
  }

  /**
   * Create a director/shareholder
   */
  static async createDirector(userId: string, data: CreateDirectorData) {
    // Validate entity type requires directors
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizerEntityType: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.organizerEntityType) {
      throw new ValidationError('Entity type must be set before adding directors');
    }

    const directorRequirements = requiresDirectorsOrShareholders(user.organizerEntityType);
    if (!directorRequirements.requiresDirectors && !directorRequirements.requiresShareholders) {
      throw new ValidationError('This entity type does not require directors or shareholders');
    }

    // Check if we're at the limit (for top 5 requirement)
    let isTopFive = true;
    if (directorRequirements.maxDirectorsToCollect) {
      const existingCount = await prisma.organizerDirector.count({
        where: { userId, isTopFive: true },
      });

      if (existingCount >= directorRequirements.maxDirectorsToCollect) {
        // If adding another, mark it as not top 5
        isTopFive = false;
      }
    }

    const director = await prisma.organizerDirector.create({
      data: {
        userId,
        fullName: data.fullName,
        nationality: data.nationality,
        dateOfBirth: data.dateOfBirth,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        kraPin: data.kraPin || null,
        sharePercentage: data.sharePercentage || null,
        position: data.position || null,
        isTopFive,
      },
    });

    logger.info(`Director created: ${director.id} for user: ${userId}`);

    return director;
  }

  /**
   * Delete a director/shareholder
   */
  static async deleteDirector(directorId: string, userId: string) {
    const director = await prisma.organizerDirector.findUnique({
      where: { id: directorId },
    });

    if (!director) {
      throw new NotFoundError('Director not found');
    }

    if (director.userId !== userId) {
      throw new ValidationError('You do not have permission to delete this director');
    }

    await prisma.organizerDirector.delete({
      where: { id: directorId },
    });

    logger.info(`Director deleted: ${directorId} by user: ${userId}`);
  }
}



