import { prisma } from '../config/database.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface IdentityVerificationData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  idType: string; // 'passport' | 'drivers_license' | 'national_id'
  idNumber: string;
  idDocumentFrontUrl: string; // URL to uploaded front document
  idDocumentBackUrl?: string | null; // URL to uploaded back document (optional)
}

export interface BusinessVerificationData {
  businessName: string;
  businessType: string; // 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship' | 'non-profit'
  taxId: string; // EIN or Tax ID
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessCountry: string;
  businessLicenseUrl?: string;
  taxDocumentUrl?: string;
}

export class VerificationService {
  /**
   * Submit identity verification (Level 2)
   */
  static async submitIdentityVerification(userId: string, data: IdentityVerificationData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isIdentityVerified) {
      throw new ValidationError('Identity is already verified');
    }

    // Validate required fields
    // Note: idDocumentBackUrl is optional (front is required, back is optional)
    if (!data.firstName || !data.lastName || !data.address || !data.idDocumentFrontUrl) {
      throw new ValidationError('All required identity verification fields must be provided, including ID document photo');
    }

    // Update user with identity information and mark as verified
    // In production, this would go through admin review first
    // For now, we'll auto-approve but set verification level to 2
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        isIdentityVerified: true,
        identityVerifiedAt: new Date(),
        verificationLevel: 2,
        payoutLimit: new Decimal(2000), // $2,000 monthly limit for Level 2
        // Store additional identity info (you might want a separate table for this)
        phoneNumber: user.phoneNumber || undefined,
      },
    });

    logger.info(`Identity verification submitted for user: ${userId}`);

    return {
      message: 'Identity verification submitted successfully',
      verificationLevel: 2,
      payoutLimit: 2000,
      user: updatedUser,
    };
  }

  /**
   * Submit business verification / KYC (Level 3)
   */
  static async submitBusinessVerification(userId: string, data: BusinessVerificationData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycDocuments: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isIdentityVerified) {
      throw new ValidationError('Identity verification is required before business verification');
    }

    if (user.verificationLevel === 3) {
      throw new ValidationError('Business verification is already complete');
    }

    // Validate required fields
    if (!data.businessName || !data.businessType || !data.taxId) {
      throw new ValidationError('All business verification fields are required');
    }

    // Create or update KYC documents
    const documentTypes = [
      { type: 'BUSINESS_LICENSE', url: data.businessLicenseUrl },
      { type: 'TAX_ID', url: data.taxDocumentUrl, number: data.taxId },
    ];

    for (const doc of documentTypes) {
      if (doc.url) {
        // Check if document already exists
        const existing = await prisma.kYCDocument.findFirst({
          where: {
            userId,
            documentType: doc.type,
          },
        });

        if (existing) {
          await prisma.kYCDocument.update({
            where: { id: existing.id },
            data: {
              documentUrl: doc.url,
              documentNumber: doc.number,
              status: 'PENDING', // Reset to pending for review
            },
          });
        } else {
          await prisma.kYCDocument.create({
            data: {
              userId,
              documentType: doc.type,
              documentUrl: doc.url,
              documentNumber: doc.number,
              status: 'PENDING',
            },
          });
        }
      }
    }

    // Update user with business information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizationName: data.businessName,
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date(),
        // Note: verificationLevel and payoutLimit will be updated by admin after approval
      },
    });

    logger.info(`Business verification submitted for user: ${userId}`);

    return {
      message: 'Business verification submitted successfully. Your documents are under review.',
      verificationLevel: 2, // Still Level 2 until admin approves
      user: updatedUser,
    };
  }

  /**
   * Get verification status for a user
   */
  static async getVerificationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      emailVerified: user.isEmailVerified,
      identityVerified: user.isIdentityVerified,
      identityVerifiedAt: user.identityVerifiedAt,
      verificationLevel: user.verificationLevel,
      payoutLimit: user.payoutLimit ? Number(user.payoutLimit) : null,
      kycStatus: user.kycStatus,
      kycSubmittedAt: user.kycSubmittedAt,
      kycApprovedAt: user.kycApprovedAt,
      kycDocuments: user.kycDocuments,
      canCreateFreeEvents: true, // Always allowed
      canCreatePaidEvents: user.isIdentityVerified,
      canReceivePayouts: user.verificationLevel === 3 && user.kycStatus === 'APPROVED',
    };
  }
}

