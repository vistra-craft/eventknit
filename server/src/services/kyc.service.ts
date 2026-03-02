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
import { DEFAULT_KYC_REQUIREMENTS } from '../config/default-kyc-requirements.js';

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
      const isComplete = (approvedCount + pendingCount) >= req.minQuantity;
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
      isComplete: requirementsStatus.filter((req) => req.isRequired).every((req) => req.isComplete),
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

  // ─── Admin Review Methods ───────────────────────────────────────────────

  /**
   * List KYC submissions for admin review (paginated, filterable)
   */
  static async listKYCSubmissions(filters: {
    status?: KYCStatus;
    entityType?: OrganizerEntityType;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      // Only organizer users who have submitted KYC
      kycStatus: filters.status || { not: null },
      organizerEntityType: filters.entityType ? filters.entityType : { not: null },
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { organizationName: { contains: filters.search, mode: 'insensitive' } },
        { organizerBusinessName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = filters.sortBy || 'kycSubmittedAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          organizationName: true,
          organizerEntityType: true,
          organizerBusinessName: true,
          organizerIndustry: true,
          kycStatus: true,
          kycSubmittedAt: true,
          kycApprovedAt: true,
          verificationLevel: true,
          avatar: true,
          _count: {
            select: { kycDocuments: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      submissions: users.map((u) => ({
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        organizationName: u.organizationName,
        entityType: u.organizerEntityType,
        businessName: u.organizerBusinessName,
        industry: u.organizerIndustry,
        kycStatus: u.kycStatus,
        submittedAt: u.kycSubmittedAt,
        approvedAt: u.kycApprovedAt,
        verificationLevel: u.verificationLevel,
        avatar: u.avatar,
        documentCount: u._count.kycDocuments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get full KYC details for a specific organizer (admin view)
   */
  static async getOrganizerKYCDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        organizationName: true,
        organizerEntityType: true,
        organizerBusinessName: true,
        organizerIndustry: true,
        organizerCountry: true,
        organizerRegistrationNumber: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycApprovedAt: true,
        verificationLevel: true,
        isIdentityVerified: true,
        avatar: true,
        createdAt: true,
        kycDocuments: {
          orderBy: { createdAt: 'asc' },
        },
        organizerDirectors: {
          orderBy: [{ isTopFive: 'desc' }, { sharePercentage: 'desc' }],
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get requirements to show completeness
    let requirementsStatus: Array<{
      documentType: string;
      description: string;
      category: string;
      isRequired: boolean;
      minQuantity: number;
      uploadedCount: number;
      approvedCount: number;
      pendingCount: number;
      rejectedCount: number;
      isComplete: boolean;
    }> = [];

    if (user.organizerEntityType) {
      const requirements = getRequiredDocuments(
        user.organizerEntityType,
        user.organizerIndustry || undefined,
      );

      const documentsByType = new Map<string, typeof user.kycDocuments>();
      user.kycDocuments.forEach((doc) => {
        if (!documentsByType.has(doc.documentType)) {
          documentsByType.set(doc.documentType, []);
        }
        documentsByType.get(doc.documentType)!.push(doc);
      });

      requirementsStatus = requirements.map((req) => {
        const uploadedDocs = documentsByType.get(req.documentType) || [];
        return {
          documentType: req.documentType,
          description: req.description,
          category: req.category,
          isRequired: req.isRequired,
          minQuantity: req.minQuantity,
          uploadedCount: uploadedDocs.length,
          approvedCount: uploadedDocs.filter((d) => d.status === KYCStatus.APPROVED).length,
          pendingCount: uploadedDocs.filter((d) => d.status === KYCStatus.PENDING).length,
          rejectedCount: uploadedDocs.filter((d) => d.status === KYCStatus.REJECTED).length,
          isComplete: uploadedDocs.filter((d) => d.status === KYCStatus.APPROVED).length >= req.minQuantity,
        };
      });
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        organizationName: user.organizationName,
        entityType: user.organizerEntityType,
        businessName: user.organizerBusinessName,
        industry: user.organizerIndustry,
        country: user.organizerCountry,
        registrationNumber: user.organizerRegistrationNumber,
        kycStatus: user.kycStatus,
        submittedAt: user.kycSubmittedAt,
        approvedAt: user.kycApprovedAt,
        verificationLevel: user.verificationLevel,
        isIdentityVerified: user.isIdentityVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      documents: user.kycDocuments,
      directors: user.organizerDirectors,
      requirementsStatus,
    };
  }

  /**
   * Approve a single KYC document
   */
  static async approveKYCDocument(documentId: string, adminId: string) {
    const document = await prisma.kYCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundError('KYC document not found');
    }

    if (document.status === KYCStatus.APPROVED) {
      throw new ValidationError('Document is already approved');
    }

    const updated = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: KYCStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    logger.info(`KYC document ${documentId} approved by admin ${adminId}`);
    return updated;
  }

  /**
   * Reject a single KYC document
   */
  static async rejectKYCDocument(documentId: string, adminId: string, rejectionReason: string) {
    const document = await prisma.kYCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundError('KYC document not found');
    }

    if (document.status === KYCStatus.REJECTED) {
      throw new ValidationError('Document is already rejected');
    }

    const updated = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: KYCStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    logger.info(`KYC document ${documentId} rejected by admin ${adminId}: ${rejectionReason}`);
    return updated;
  }

  /**
   * Approve an organizer's entire KYC (all required docs must be approved first)
   */
  static async approveOrganizerKYC(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycDocuments: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.kycStatus === KYCStatus.APPROVED) {
      throw new ValidationError('KYC is already approved');
    }

    if (!user.organizerEntityType) {
      throw new ValidationError('User has no entity type set');
    }

    // Validate all required documents are approved
    const requirements = getRequiredDocuments(
      user.organizerEntityType,
      user.organizerIndustry || undefined,
    );

    const documentsByType = new Map<string, typeof user.kycDocuments>();
    user.kycDocuments.forEach((doc) => {
      if (!documentsByType.has(doc.documentType)) {
        documentsByType.set(doc.documentType, []);
      }
      documentsByType.get(doc.documentType)!.push(doc);
    });

    const unapproved: string[] = [];
    for (const req of requirements) {
      if (!req.isRequired) continue;
      const docs = documentsByType.get(req.documentType) || [];
      const approvedCount = docs.filter((d) => d.status === KYCStatus.APPROVED).length;
      if (approvedCount < req.minQuantity) {
        unapproved.push(req.description);
      }
    }

    if (unapproved.length > 0) {
      throw new ValidationError(
        `Cannot approve KYC. The following required documents are not yet approved: ${unapproved.join(', ')}`,
      );
    }

    // Approve: update user KYC status, verification level, identity
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.APPROVED,
        kycApprovedAt: new Date(),
        verificationLevel: 3,
        isIdentityVerified: true,
        identityVerifiedAt: new Date(),
        payoutLimit: null, // Remove payout limit (unlimited)
      },
    });

    logger.info(`KYC approved for user ${userId} by admin ${adminId}`);

    return { message: 'KYC approved successfully' };
  }

  /**
   * Reject an organizer's entire KYC
   */
  static async rejectOrganizerKYC(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.kycStatus) {
      throw new ValidationError('User has not submitted KYC');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.REJECTED,
      },
    });

    logger.info(`KYC rejected for user ${userId} by admin ${adminId}: ${reason}`);

    return { message: 'KYC rejected' };
  }

  /**
   * Get KYC stats for admin dashboard
   */
  static async getKYCStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalPending, approvedThisMonth, rejectedThisMonth, totalSubmissions] = await Promise.all([
      prisma.user.count({ where: { kycStatus: KYCStatus.PENDING } }),
      prisma.user.count({
        where: {
          kycStatus: KYCStatus.APPROVED,
          kycApprovedAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count({
        where: {
          kycStatus: KYCStatus.REJECTED,
          updatedAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count({ where: { kycStatus: { not: null } } }),
    ]);

    return {
      totalPending,
      approvedThisMonth,
      rejectedThisMonth,
      totalSubmissions,
    };
  }

  // ─── Entity Requirements Management ─────────────────────────────────────

  /**
   * Get all entity types
   */
  static async getAllEntityTypes() {
    // Return all enum values from OrganizerEntityType
    return Object.values(OrganizerEntityType);
  }

  /**
   * Get document requirements for a specific entity type
   * Returns stored requirements, or defaults from kyc_document.md if none exist
   */
  static async getEntityRequirements(entityType: OrganizerEntityType) {
    let requirements = await prisma.entityRequirement.findMany({
      where: { entityType },
      orderBy: [{ displayOrder: 'asc' }, { documentType: 'asc' }],
    });

    // If no requirements exist, create them from defaults
    if (requirements.length === 0) {
      const defaults = DEFAULT_KYC_REQUIREMENTS[entityType];
      if (defaults && defaults.length > 0) {
        logger.info(`Creating default requirements for ${entityType}`);
        
        // Create all default requirements
        const created = await Promise.all(
          defaults.map((req, index) =>
            prisma.entityRequirement.create({
              data: {
                entityType,
                documentType: req.documentType,
                description: req.description,
                isRequired: req.isRequired,
                displayOrder: index,
              },
            }),
          ),
        );
        
        requirements = created;
      }
    }

    return requirements;
  }

  /**
   * Add a document requirement for an entity type
   */
  static async addEntityRequirement(
    entityType: OrganizerEntityType,
    documentType: string,
    description?: string,
    isRequired: boolean = true,
  ) {
    // Check if requirement already exists
    const existing = await prisma.entityRequirement.findUnique({
      where: {
        entityType_documentType: {
          entityType,
          documentType,
        },
      },
    });

    if (existing) {
      throw new ValidationError(`Requirement for ${documentType} already exists for ${entityType}`);
    }

    // Get the max display order for this entity type
    const maxOrder = await prisma.entityRequirement.aggregate({
      where: { entityType },
      _max: { displayOrder: true },
    });

    const requirement = await prisma.entityRequirement.create({
      data: {
        entityType,
        documentType,
        description,
        isRequired,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    });

    logger.info(`Added requirement ${documentType} for ${entityType}`);
    return requirement;
  }

  /**
   * Update a document requirement
   */
  static async updateEntityRequirement(
    requirementId: string,
    description?: string,
    isRequired?: boolean,
  ) {
    const requirement = await prisma.entityRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new NotFoundError('Requirement not found');
    }

    const updated = await prisma.entityRequirement.update({
      where: { id: requirementId },
      data: {
        ...(description !== undefined && { description }),
        ...(isRequired !== undefined && { isRequired }),
      },
    });

    logger.info(`Updated requirement ${requirementId}`);
    return updated;
  }

  /**
   * Delete a document requirement
   */
  static async deleteEntityRequirement(requirementId: string) {
    const requirement = await prisma.entityRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new NotFoundError('Requirement not found');
    }

    await prisma.entityRequirement.delete({
      where: { id: requirementId },
    });

    logger.info(`Deleted requirement ${requirementId}`);
  }
}
