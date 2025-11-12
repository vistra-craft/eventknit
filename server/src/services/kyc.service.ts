import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { KYCStatus } from '@prisma/client';

export interface CreateKYCDocumentData {
  documentType: string;
  documentNumber?: string;
  documentUrl?: string;
}

export interface UpdateKYCDocumentData {
  documentNumber?: string;
  documentUrl?: string;
}

export class KYCService {
  /**
   * Get all KYC documents for a user
   */
  static async getUserKYCDocuments(userId: string) {
    return prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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
   */
  static async createKYCDocument(userId: string, data: CreateKYCDocumentData) {
    // Check if document type already exists for this user
    const existing = await prisma.kYCDocument.findFirst({
      where: {
        userId,
        documentType: data.documentType,
        status: { not: 'REJECTED' }, // Allow re-submission if rejected
      },
    });

    if (existing && existing.status === 'PENDING') {
      throw new ConflictError('A document of this type is already pending review');
    }

    if (existing && existing.status === 'APPROVED') {
      throw new ConflictError('A document of this type is already approved');
    }

    const document = await prisma.kYCDocument.create({
      data: {
        userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl,
        status: KYCStatus.PENDING,
      },
    });

    // Update user KYC status if this is the first document
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycDocuments: true },
    });

    if (user && user.kycDocuments.length === 1) {
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

    // Can only update if pending
    if (document.status !== KYCStatus.PENDING) {
      throw new ValidationError('Can only update documents that are pending review');
    }

    return prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl,
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
   * Submit KYC for review (mark all documents as ready)
   */
  static async submitKYCForReview(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycDocuments: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const pendingDocuments = user.kycDocuments.filter(
      (doc) => doc.status === KYCStatus.PENDING,
    );

    if (pendingDocuments.length === 0) {
      throw new ValidationError('No pending documents to submit');
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
      documentsCount: pendingDocuments.length,
    };
  }
}


