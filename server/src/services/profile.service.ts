import type { Request } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { uploadImageToCloudinary } from './cloudinary.service.js';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  otherName?: string | null;
  phoneNumber?: string | null;
  companyAffiliation?: string | null;
  organizationName?: string | null;
  businessEmail?: string | null;
  avatar?: string | null;
}

export interface ProfileUpdateResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
  organizationName: string | null;
  businessEmail: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileService {
  /**
   * Update user profile with avatar handling
   */
  static async updateProfileWithAvatar(
    userId: string,
    file: Request['file'],
    updateData: UpdateProfileData,
  ): Promise<ProfileUpdateResult> {
    // Fetch current user to validate
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // NOTE: Email changes are handled via the dedicated /email/request-change flow.
    // The Joi validation schema strips email from updateData before it reaches here.

    let avatarUrl: string | null | undefined = undefined;

    // Handle avatar upload if file is provided
    if (file) {
      const uploadOptions = {
        width: 400,
        height: 400,
        quality: 'auto' as const,
        format: 'auto' as const,
      };
      const uploadResult = await uploadImageToCloudinary(
        file.buffer,
        'user-avatars',
        uploadOptions,
      );
      avatarUrl = uploadResult.secureUrl;
    } else if (updateData.avatar !== undefined) {
      // If avatar URL is provided directly (not a file upload)
      avatarUrl = updateData.avatar && updateData.avatar.trim() !== '' ? updateData.avatar.trim() : null;
    }

    // Sanitize and prepare update data
    const sanitizedData: {
      firstName?: string;
      lastName?: string;
      otherName?: string | null;
      phoneNumber?: string | null;
      companyAffiliation?: string | null;
      organizationName?: string | null;
      businessEmail?: string | null;
      avatar?: string | null;
    } = {};

    if (updateData.firstName !== undefined) sanitizedData.firstName = updateData.firstName.trim();
    if (updateData.lastName !== undefined) sanitizedData.lastName = updateData.lastName.trim();
    if (updateData.otherName !== undefined) {
      sanitizedData.otherName = updateData.otherName && updateData.otherName.trim() !== '' ? updateData.otherName.trim() : null;
    }
    if (updateData.phoneNumber !== undefined) {
      sanitizedData.phoneNumber = updateData.phoneNumber && updateData.phoneNumber.trim() !== '' ? updateData.phoneNumber.trim() : null;
    }
    if (updateData.companyAffiliation !== undefined) {
      sanitizedData.companyAffiliation = updateData.companyAffiliation && updateData.companyAffiliation.trim() !== '' ? updateData.companyAffiliation.trim() : null;
    }
    if (updateData.organizationName !== undefined) {
      sanitizedData.organizationName = updateData.organizationName && updateData.organizationName.trim() !== '' ? updateData.organizationName.trim() : null;
    }
    if (updateData.businessEmail !== undefined) {
      sanitizedData.businessEmail = updateData.businessEmail && updateData.businessEmail.trim() !== '' ? updateData.businessEmail.trim() : null;
    }
    if (avatarUrl !== undefined) {
      sanitizedData.avatar = avatarUrl;
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Profile updated for user: ${user.email}`);

    return user as ProfileUpdateResult;
  }

  /**
   * Get user profile by ID
   */
  static async getProfileById(userId: string): Promise<ProfileUpdateResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user as ProfileUpdateResult;
  }
}
