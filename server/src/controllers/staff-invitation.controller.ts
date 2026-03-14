import { Response, NextFunction } from 'express';
import { StaffInvitationService } from '../services/staff-invitation.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole, StaffInvitationStatus } from '@prisma/client';
import { config } from '../config/index.js';
import { parseExpiresIn } from '../utils/jwt.js';

const REFRESH_COOKIE_MAX_AGE_MS = parseExpiresIn(config.jwt.refreshExpiresIn) * 1000;

export class StaffInvitationController {
  /**
   * Invite a staff member (admin or organizer)
   */
  static async inviteStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { email, role, message } = req.body;

      const result = await StaffInvitationService.inviteStaff(
        { email, role: role as UserRole, message },
        req.user.id,
        req.user.role as UserRole,
      );

      res.status(201).json({
        success: true,
        message: `Invitation sent to ${email}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate an invitation token (public endpoint)
   */
  static async validateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await StaffInvitationService.validateToken(token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept an invitation (public endpoint — creates user + returns auth tokens)
   */
  static async acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password, firstName, lastName, phoneNumber } = req.body;

      const result = await StaffInvitationService.acceptInvitation({
        token,
        password,
        firstName,
        lastName,
        phoneNumber,
      });

      // Set refresh token cookie (same pattern as auth controller)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.jwt.cookieSecure,
        sameSite: 'strict',
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend an invitation
   */
  static async resendInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      const result = await StaffInvitationService.resendInvitation(
        id,
        req.user.id,
        req.user.role as UserRole,
      );

      res.status(200).json({
        success: true,
        message: 'Invitation resent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      await StaffInvitationService.revokeInvitation(
        id,
        req.user.id,
        req.user.role as UserRole,
      );

      res.status(200).json({
        success: true,
        message: 'Invitation revoked',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform staff invitations (admin)
   */
  static async getInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, page, limit } = req.query;

      const result = await StaffInvitationService.getInvitations({
        scope: 'PLATFORM',
        status: status as StaffInvitationStatus | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer staff invitations
   */
  static async getOrganizerInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, page, limit } = req.query;

      const result = await StaffInvitationService.getInvitations({
        scope: 'ORGANIZATION',
        inviterId: req.user.id,
        status: status as StaffInvitationStatus | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
