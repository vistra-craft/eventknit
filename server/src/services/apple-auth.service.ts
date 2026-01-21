import appleSignin from 'apple-signin-auth';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  parseExpiresIn,
  type TokenPayload,
} from '../utils/jwt.js';
import {
  AuthenticationError,
  ValidationError,
} from '../utils/errors.js';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config/index.js';
import type { AuthResponse } from './auth.service.js';

interface AppleTokenResponse {
  sub: string; // Apple user ID (unique identifier)
  email?: string; // User's email (may be relay email)
  email_verified?: boolean;
  is_private_email?: boolean;
}

interface AppleUserInfo {
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export class AppleAuthService {
  /**
   * Verify Apple ID token and return user info
   * @param idToken - The ID token from Apple Sign In
   * @returns Apple user information
   */
  static async verifyIdToken(idToken: string): Promise<AppleTokenResponse> {
    try {
      const clientId = process.env.APPLE_CLIENT_ID;

      if (!clientId) {
        throw new AuthenticationError('Apple Sign In is not configured');
      }

      // Verify the token with Apple's public keys
      const result = await appleSignin.verifyIdToken(idToken, {
        audience: clientId,
        ignoreExpiration: false,
      });

      logger.info('Apple ID token verified successfully', {
        sub: result.sub,
        email: result.email,
      });

      return {
        sub: result.sub,
        email: result.email,
        email_verified: result.email_verified === 'true' || result.email_verified === true,
        is_private_email: result.is_private_email === 'true' || result.is_private_email === true,
      };
    } catch (error) {
      logger.error('Failed to verify Apple ID token', { error });
      throw new AuthenticationError('Invalid Apple ID token');
    }
  }

  /**
   * Generate tokens for user
   */
  private static async generateTokens(user: { id: string; email: string; role: UserRole }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresIn = parseExpiresIn(config.jwt.expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Save refresh token to database
   */
  private static async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Login or register user with Apple Sign In
   */
  static async authenticateWithApple(
    idToken: string,
    role?: UserRole,
    userInfo?: AppleUserInfo,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Verify token and get user data
    const appleUser = await this.verifyIdToken(idToken);

    if (!appleUser.email && !appleUser.sub) {
      throw new ValidationError('Apple Sign In did not provide user information');
    }

    // Use email or create a unique email from sub
    const email = appleUser.email || `${appleUser.sub}@privaterelay.appleid.com`;

    // Check if user already exists with this appleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId: appleUser.sub },
          { email },
        ],
      },
    });

    if (user) {
      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }

      // Update appleId if not set and update last login
      const updateData: Record<string, unknown> = {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      if (!user.appleId) {
        updateData.appleId = appleUser.sub;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      logger.info(`User logged in with Apple: ${user.email}`);
    } else {
      // Create new user account
      const selectedRole = role || UserRole.ATTENDEE;

      // Validate role - only allow ATTENDEE or ORGANIZER for new registrations
      if (selectedRole !== UserRole.ATTENDEE && selectedRole !== UserRole.ORGANIZER) {
        throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
      }

      // Parse name from Apple user info (only provided on first sign in)
      const firstName = userInfo?.name?.firstName || '';
      const lastName = userInfo?.name?.lastName || '';

      user = await prisma.user.create({
        data: {
          email,
          appleId: appleUser.sub,
          firstName: firstName || null,
          lastName: lastName || null,
          role: selectedRole,
          status: UserStatus.ACTIVE,
          isEmailVerified: appleUser.email_verified || true,
          emailVerifiedAt: appleUser.email_verified ? new Date() : null,
        },
      });

      logger.info(`User registered with Apple: ${user.email}`);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        otherName: user.otherName,
        companyAffiliation: user.companyAffiliation,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        organizationName: user.organizationName,
        verificationLevel: user.verificationLevel,
      },
      ...tokens,
    };
  }
}
