import axios from 'axios';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  parseExpiresIn,
  type TokenPayload,
} from '../utils/jwt';
import {
  AuthenticationError,
  ValidationError,
} from '../utils/errors';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config';
import type { AuthResponse } from './auth.service';

interface FacebookUserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export class FacebookAuthService {
  /**
   * Verify Facebook access token and get user data
   */
  static async verifyFacebookToken(accessToken: string): Promise<FacebookUserData> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email,first_name,last_name,name`,
      );

      if (response.data.error) {
        throw new AuthenticationError('Invalid Facebook token');
      }

      return response.data as FacebookUserData;
    } catch (error) {
      logger.error('Facebook token verification failed:', error);
      throw new AuthenticationError('Failed to verify Facebook token');
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
   * Login or register user with Facebook
   */
  static async authenticateWithFacebook(
    accessToken: string,
    role?: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Verify Facebook token and get user data
    const facebookUser = await this.verifyFacebookToken(accessToken);

    if (!facebookUser.email) {
      throw new ValidationError('Facebook account does not have an email address');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: facebookUser.email },
    });

    if (user) {
      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      logger.info(`User logged in with Facebook: ${user.email}`);
    } else {
      // Create new user account
      const selectedRole = role || UserRole.ATTENDEE;
      
      // Validate role - only allow ATTENDEE or ORGANIZER for new registrations
      if (selectedRole !== UserRole.ATTENDEE && selectedRole !== UserRole.ORGANIZER) {
        throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
      }

      // Parse name from Facebook data
      const firstName = facebookUser.first_name || facebookUser.name?.split(' ')[0] || '';
      const lastName = facebookUser.last_name || facebookUser.name?.split(' ').slice(1).join(' ') || '';

      user = await prisma.user.create({
        data: {
          email: facebookUser.email,
          firstName: firstName || null,
          lastName: lastName || null,
          role: selectedRole,
          status: UserStatus.ACTIVE,
          isEmailVerified: true, // Facebook emails are considered verified
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`User registered with Facebook: ${user.email}`);
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

