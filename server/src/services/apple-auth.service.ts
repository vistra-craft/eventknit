import appleSignIn, { type AppleIdTokenType } from 'apple-signin-auth';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  AuthenticationError,
  ValidationError,
} from '../utils/errors.js';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config/index.js';
import { AuthService, type AuthResponse } from './auth.service.js';

interface AppleUserData {
  id: string;
  email: string;
  emailVerified: boolean;
  isPrivateEmail: boolean;
}

interface AppleUserInfo {
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export class AppleAuthService {
  /**
   * Verify Apple ID token using Apple's JWKS public keys
   * The apple-signin-auth library handles key fetching and rotation
   */
  static async verifyAppleIdToken(idToken: string): Promise<AppleUserData> {
    try {
      const tokenData: AppleIdTokenType = await appleSignIn.verifyIdToken(idToken, {
        audience: config.apple.clientId,
        ignoreExpiration: false,
      });

      // Validate issuer
      if (tokenData.iss !== 'https://appleid.apple.com') {
        logger.warn(`Apple token issuer mismatch: expected https://appleid.apple.com, got ${tokenData.iss}`);
        throw new AuthenticationError('Invalid Apple token');
      }

      // Validate audience matches our client ID
      if (config.apple.clientId && tokenData.aud !== config.apple.clientId) {
        logger.warn(`Apple token audience mismatch: expected ${config.apple.clientId}, got ${tokenData.aud}`);
        throw new AuthenticationError('Invalid Apple token');
      }

      if (!tokenData.sub) {
        throw new AuthenticationError('Invalid Apple token');
      }

      if (!tokenData.email) {
        throw new AuthenticationError('Apple account does not have an email');
      }

      return {
        id: tokenData.sub,
        email: tokenData.email,
        emailVerified: tokenData.email_verified === 'true' || tokenData.email_verified === true,
        isPrivateEmail: tokenData.is_private_email === 'true' || tokenData.is_private_email === true,
      };
    } catch (error) {
      // Re-throw our own errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      logger.error('Apple token verification failed:', error);
      throw new AuthenticationError('Failed to verify Apple token');
    }
  }

  /**
   * Login or register user with Apple Sign In
   * Apple provides user name only on first authorization — subsequent logins omit it
   */
  static async authenticateWithApple(
    idToken: string,
    role?: UserRole,
    userData?: AppleUserInfo,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Verify ID token and get user data
    const appleUser = await this.verifyAppleIdToken(idToken);

    if (!appleUser.email) {
      throw new ValidationError('Apple account does not have an email address');
    }

    // Normalize email to match validation layer convention
    const normalizedEmail = appleUser.email.toLowerCase().trim();

    // Check if user already exists with this appleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId: appleUser.id },
          { email: normalizedEmail },
        ],
      },
    });

    if (user) {
      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }

      // Update appleId if not set, update last login
      const updateData: Record<string, unknown> = {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      // Link appleId if not set
      if (!user.appleId) {
        updateData.appleId = appleUser.id;
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

      // Apple only sends name on first authorization
      const firstName = userData?.name?.firstName || '';
      const lastName = userData?.name?.lastName || '';

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          appleId: appleUser.id,
          firstName: firstName || null,
          lastName: lastName || null,
          role: selectedRole,
          status: UserStatus.ACTIVE,
          isEmailVerified: true, // Apple-verified emails are trusted
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`User registered with Apple: ${user.email}`);
    }

    // Generate tokens (reuse AuthService to avoid duplication)
    const tokens = await AuthService.generateTokens(user);

    // Save refresh token with hashing (reuse AuthService)
    await AuthService.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

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
