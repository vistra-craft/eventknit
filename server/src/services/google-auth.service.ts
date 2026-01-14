import axios from 'axios';
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

interface GoogleUserData {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface GoogleTokenInfo {
  email: string;
  email_verified: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub: string;
}

export class GoogleAuthService {
  /**
   * Verify Google ID token and get user data
   * This handles the ID token from Google Sign-In
   */
  static async verifyGoogleIdToken(idToken: string): Promise<GoogleUserData> {
    try {
      // Verify the ID token with Google's tokeninfo endpoint
      const response = await axios.get<GoogleTokenInfo>(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      const data = response.data;

      // Verify the token is for our app
      if (config.google.clientId && data.sub) {
        // Token is valid
        return {
          id: data.sub,
          email: data.email,
          verified_email: data.email_verified === 'true',
          name: data.name,
          given_name: data.given_name,
          family_name: data.family_name,
          picture: data.picture,
        };
      }

      throw new AuthenticationError('Invalid Google token');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error('Google token verification failed:', error.response.data);
      } else {
        logger.error('Google token verification failed:', error);
      }
      throw new AuthenticationError('Failed to verify Google token');
    }
  }

  /**
   * Verify Google access token and get user data
   * This handles the access token from OAuth flow
   */
  static async verifyGoogleAccessToken(accessToken: string): Promise<GoogleUserData> {
    try {
      const response = await axios.get<GoogleUserData>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.data.email) {
        throw new AuthenticationError('Google account does not have an email');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error('Google access token verification failed:', error.response.data);
      } else {
        logger.error('Google access token verification failed:', error);
      }
      throw new AuthenticationError('Failed to verify Google access token');
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
   * Login or register user with Google
   * Supports both ID token (from Google Sign-In) and access token (from OAuth flow)
   */
  static async authenticateWithGoogle(
    token: string,
    tokenType: 'id_token' | 'access_token' = 'id_token',
    role?: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Verify token and get user data
    const googleUser = tokenType === 'id_token'
      ? await this.verifyGoogleIdToken(token)
      : await this.verifyGoogleAccessToken(token);

    if (!googleUser.email) {
      throw new ValidationError('Google account does not have an email address');
    }

    // Check if user already exists with this googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }

      // Update googleId if not set, update last login and avatar if not set
      const updateData: Record<string, unknown> = {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      // Update googleId if not set
      if (!user.googleId) {
        updateData.googleId = googleUser.id;
      }

      // Update avatar if user doesn't have one and Google provides one
      if (!user.avatar && googleUser.picture) {
        updateData.avatar = googleUser.picture;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      logger.info(`User logged in with Google: ${user.email}`);
    } else {
      // Create new user account
      const selectedRole = role || UserRole.ATTENDEE;

      // Validate role - only allow ATTENDEE or ORGANIZER for new registrations
      if (selectedRole !== UserRole.ATTENDEE && selectedRole !== UserRole.ORGANIZER) {
        throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
      }

      // Parse name from Google data
      const firstName = googleUser.given_name || googleUser.name?.split(' ')[0] || '';
      const lastName = googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '';

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.id,
          firstName: firstName || null,
          lastName: lastName || null,
          avatar: googleUser.picture || null,
          role: selectedRole,
          status: UserStatus.ACTIVE,
          isEmailVerified: googleUser.verified_email || true, // Google emails are considered verified
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`User registered with Google: ${user.email}`);
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
