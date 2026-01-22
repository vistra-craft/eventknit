import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitation.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class InvitationController {
  /**
   * Create a new invitation link for an event
   */
  static async createInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const invitation = await InvitationService.createInvitation(
        (req.params.eventId as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Invitation link created successfully',
        data: { invitation },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all invitations for an event
   */
  static async getEventInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const invitations = await InvitationService.getEventInvitations(
        (req.params.eventId as string),
        req.user.id,
        req.user.role,
      );

      res.status(200).json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invitation by token (public - for registration form)
   */
  static async getInvitationByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitation = await InvitationService.getInvitationByToken((req.params.token as string));

      res.status(200).json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an invitation
   */
  static async updateInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const invitation = await InvitationService.updateInvitation(
        (req.params.id as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Invitation updated successfully',
        data: { invitation },
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
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await InvitationService.revokeInvitation(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an invitation
   */
  static async deleteInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await InvitationService.deleteInvitation(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Invitation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

