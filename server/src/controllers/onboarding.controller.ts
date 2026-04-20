import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import { ValidationError } from '../utils/errors.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

export class OnboardingController {
  /**
   * Save onboarding progress (can be called multiple times during the flow)
   */
  static async saveProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { preferences } = req.body;

      if (!preferences) {
        throw new ValidationError('Onboarding preferences are required');
      }

      // Get existing preferences (if any) and merge with new data
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { eventPreferences: true },
      });

      const existingPreferences = user?.eventPreferences as Record<string, any> || {};
      const mergedPreferences = { ...existingPreferences, ...preferences };

      // Update user preferences without marking onboarding as complete
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          eventPreferences: mergedPreferences,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          onboardingCompleted: true,
          eventPreferences: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Onboarding progress saved',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark onboarding as complete
   * SMART ROLE UPGRADE: Upgrades user role based on their intent
   */
  static async completeOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { preferences } = req.body;

      // Get existing preferences and merge with final data
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { eventPreferences: true, role: true },
      });

      const existingPreferences = user?.eventPreferences as Record<string, any> || {};
      const finalPreferences = preferences
        ? { ...existingPreferences, ...preferences }
        : existingPreferences;

      // Smart role upgrade based on intent
      let upgradedRole = user?.role;
      const intent = finalPreferences?.intent;

      if (intent === 'organize' || intent === 'both') {
        // User wants to organize events → upgrade to ORGANIZER
        upgradedRole = 'ORGANIZER';
      } else if (intent === 'attend') {
        // User only wants to attend → keep as ATTENDEE
        upgradedRole = 'ATTENDEE';
      }
      // If no intent specified, keep current role

      // Determine if status should change to PENDING_APPROVAL for new organizers
      const isUpgradingToOrganizer = upgradedRole === 'ORGANIZER' && user?.role !== 'ORGANIZER';

      // Mark onboarding as complete and upgrade role if needed
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          eventPreferences: finalPreferences,
          role: upgradedRole, // Smart role upgrade
          ...(isUpgradingToOrganizer ? { status: UserStatus.PENDING_APPROVAL } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          isEmailVerified: true,
          onboardingCompleted: true,
          onboardingCompletedAt: true,
          eventPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If upgrading to organizer, send pending notification and alert admins
      if (isUpgradingToOrganizer) {
        emailService.sendOrganizerPendingEmail(updatedUser.email, updatedUser.firstName || '').catch((err) => {
          logger.error('Failed to send organizer pending email:', err);
        });

        // Notify admins about new organizer
        prisma.user.findMany({
          where: {
            role: { in: [UserRole.SUPERADMIN, UserRole.ADMIN_STAFF] },
            status: UserStatus.ACTIVE,
            deletedAt: null,
          },
          select: { email: true, firstName: true },
        }).then((admins) => {
          Promise.allSettled(
            admins.map((admin) =>
              emailService.sendAdminNewOrganizerNotification(
                admin.email,
                admin.firstName || 'Admin',
                {
                  firstName: updatedUser.firstName || '',
                  lastName: updatedUser.lastName || '',
                  email: updatedUser.email,
                  organizationName: null,
                },
              ),
            ),
          );
        }).catch((err) => {
          logger.error('Failed to notify admins of new organizer:', err);
        });
      }

      res.status(200).json({
        success: true,
        message: 'Onboarding completed successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Skip onboarding (mark as complete with no preferences)
   */
  static async skipOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Mark onboarding as complete (skipped)
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          // eventPreferences stays as is (could be null or have partial data)
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          isEmailVerified: true,
          onboardingCompleted: true,
          onboardingCompletedAt: true,
          eventPreferences: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Onboarding skipped',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current onboarding status and saved preferences
   */
  static async getOnboardingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          onboardingCompleted: true,
          onboardingCompletedAt: true,
          eventPreferences: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          onboardingCompleted: user.onboardingCompleted,
          onboardingCompletedAt: user.onboardingCompletedAt,
          savedPreferences: user.eventPreferences || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
