/**
 * Social Media OAuth Controller
 * 
 * Handles OAuth flows for connecting social media accounts
 */

import { Request, Response, NextFunction } from 'express';
import { SocialMediaOAuthService } from '../services/social-media/oauth.service';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SocialOAuthController {
  /**
   * Initiate OAuth flow - get authorization URL
   * GET /api/v1/organizer/social-media/oauth/:platform/authorize
   */
  static async authorize(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { platform } = req.params;
      const { redirectUri } = req.query;

      const { url, state } = SocialMediaOAuthService.getAuthorizationUrl(
        platform,
        req.user.id,
        redirectUri as string,
      );

      res.json({
        success: true,
        data: {
          authorizationUrl: url,
          state,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle OAuth callback
   * GET /api/v1/organizer/social-media/oauth/:platform/callback
   */
  static async callback(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        res.status(400).json({
          success: false,
          message: 'Missing code or state parameter',
        });
        return;
      }

      const account = await SocialMediaOAuthService.handleCallback(
        platform,
        code as string,
        state as string,
      );

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/organizer/social-media?connected=${platform}&success=true`);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/organizer/social-media?error=connection_failed`);
    }
  }

  /**
   * Get connected accounts for organizer
   * GET /api/v1/organizer/social-media/accounts
   */
  static async getAccounts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Note: This would need to be implemented to get accounts linked to organizer
      // For now, we'll use the admin-level SocialAccount model
      // You may want to create an OrganizerSocialAccount model or add organizerId to SocialAccount

      res.json({
        success: true,
        data: {
          accounts: [],
          message: 'Account retrieval not yet implemented - use admin endpoints',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect account
   * DELETE /api/v1/organizer/social-media/accounts/:accountId
   */
  static async disconnectAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { accountId } = req.params;
      await SocialMediaOAuthService.disconnectAccount(accountId);

      res.json({
        success: true,
        message: 'Account disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
