/**
 * Social Media OAuth Service
 *
 * Handles OAuth flows for connecting social media accounts
 * Tokens are encrypted at rest using AES-256-GCM
 */

import { platformManager } from './platform-manager.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { SocialPlatform } from '@prisma/client';
import crypto from 'crypto';
import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js';

export class SocialMediaOAuthService {
  /**
   * Generate OAuth state token for CSRF protection
   */
  static generateStateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get OAuth authorization URL for a platform
   */
  static getAuthorizationUrl(
    platform: string,
    organizerId: string,
    redirectUri?: string,
  ): { url: string; state: string } {
    const platformAdapter = platformManager.getPlatform(platform);
    if (!platformAdapter) {
      throw new ValidationError(`Platform ${platform} is not available or not configured`);
    }

    const state = this.generateStateToken();
    const finalRedirectUri = redirectUri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/organizer/social-media/callback?platform=${platform}`;

    // Store state in database for verification (optional, can use session instead)
    // For now, we'll include organizerId in state token

    const url = platformAdapter.getAuthorizationUrl(finalRedirectUri, `${state}:${organizerId}`);

    return { url, state };
  }

  /**
   * Handle OAuth callback and connect account
   */
  static async handleCallback(
    platform: string,
    code: string,
    state: string,
    redirectUri?: string,
  ) {
    const platformAdapter = platformManager.getPlatform(platform);
    if (!platformAdapter) {
      throw new ValidationError(`Platform ${platform} is not available`);
    }

    // Extract organizerId from state (format: state:organizerId)
    const [_stateToken, organizerId] = state.split(':');
    if (!organizerId) {
      throw new ValidationError('Invalid state token');
    }

    // Verify organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    const finalRedirectUri = redirectUri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/organizer/social-media/callback?platform=${platform}`;

    // Exchange code for token
    const tokenResponse = await platformAdapter.exchangeCodeForToken(code, finalRedirectUri);

    // Get user profile
    const profile = await platformAdapter.getUserProfile(tokenResponse.accessToken);

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        platform_accountId: {
          platform: platform.toUpperCase() as SocialPlatform,
          accountId: profile.id,
        },
      },
    });

    if (existingAccount) {
      // Update existing account with encrypted tokens
      const encryptedAccessToken = encrypt(tokenResponse.accessToken);
      const encryptedRefreshToken = tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : existingAccount.refreshToken;

      const updated = await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: tokenResponse.expiresIn
            ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
            : null,
          accountName: profile.name,
          accountHandle: profile.username,
          followers: profile.followers || 0,
          following: profile.following || 0,
          lastSyncedAt: new Date(),
          metadata: profile.metadata as any,
        },
      });

      logger.info(`Updated social account connection: ${platform} for organizer ${organizerId}`);
      return updated;
    }

    // Create new account connection with encrypted tokens
    const encryptedAccessToken = encrypt(tokenResponse.accessToken);
    const encryptedRefreshToken = tokenResponse.refreshToken
      ? encrypt(tokenResponse.refreshToken)
      : null;

    const account = await prisma.socialAccount.create({
      data: {
        platform: platform.toUpperCase() as SocialPlatform,
        accountId: profile.id,
        accountName: profile.name,
        accountHandle: profile.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: tokenResponse.expiresIn
          ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
          : null,
        followers: profile.followers || 0,
        following: profile.following || 0,
        metadata: profile.metadata as any,
      },
    });

    logger.info(`Connected social account: ${platform} for organizer ${organizerId}`);
    return account;
  }

  /**
   * Refresh access token for an account
   */
  static async refreshAccountToken(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundError('Social account not found');
    }

    if (!account.refreshToken) {
      throw new ValidationError('No refresh token available for this account');
    }

    const platformAdapter = platformManager.getPlatform(account.platform.toLowerCase());
    if (!platformAdapter) {
      throw new ValidationError(`Platform ${account.platform} is not available`);
    }

    try {
      // Decrypt refresh token before using
      const decryptedRefreshToken = isEncrypted(account.refreshToken)
        ? decrypt(account.refreshToken)
        : account.refreshToken;

      const tokenResponse = await platformAdapter.refreshToken(decryptedRefreshToken);

      // Encrypt new tokens before storing
      const encryptedAccessToken = encrypt(tokenResponse.accessToken);
      const encryptedRefreshToken = tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : account.refreshToken;

      const updated = await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: tokenResponse.expiresIn
            ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
            : null,
          lastSyncedAt: new Date(),
        },
      });

      logger.info(`Refreshed token for account: ${accountId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to refresh token for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Validate and refresh token if needed
   * Returns the decrypted access token ready for use
   */
  static async ensureValidToken(accountId: string): Promise<string> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundError('Social account not found');
    }

    if (!account.accessToken) {
      throw new ValidationError('No access token available');
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = new Date();
    const expiresSoon = account.tokenExpiry && account.tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000;

    if (!account.tokenExpiry || expiresSoon) {
      // Try to refresh token
      if (account.refreshToken) {
        try {
          const refreshed = await this.refreshAccountToken(accountId);
          // Decrypt the refreshed token before returning
          if (refreshed.accessToken) {
            return isEncrypted(refreshed.accessToken)
              ? decrypt(refreshed.accessToken)
              : refreshed.accessToken;
          }
          return '';
        } catch (error) {
          logger.warn(`Failed to refresh token, using existing token: ${error}`);
        }
      }
    }

    // Decrypt access token for use
    const decryptedAccessToken = isEncrypted(account.accessToken)
      ? decrypt(account.accessToken)
      : account.accessToken;

    // Validate token with platform
    const platformAdapter = platformManager.getPlatform(account.platform.toLowerCase());
    if (platformAdapter) {
      const isValid = await platformAdapter.validateToken(decryptedAccessToken);
      if (!isValid && account.refreshToken) {
        // Token invalid, try to refresh
        const refreshed = await this.refreshAccountToken(accountId);
        if (refreshed.accessToken) {
          return isEncrypted(refreshed.accessToken)
            ? decrypt(refreshed.accessToken)
            : refreshed.accessToken;
        }
        return '';
      }
    }

    return decryptedAccessToken;
  }

  /**
   * Disconnect social account
   */
  static async disconnectAccount(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundError('Social account not found');
    }

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
      },
    });

    logger.info(`Disconnected social account: ${accountId}`);
    return { success: true };
  }
}
