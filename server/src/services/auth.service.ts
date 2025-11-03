import crypto from 'crypto';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { logger } from '../utils/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiresIn,
  type TokenPayload,
} from '../utils/jwt';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import { emailService } from './email.service';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  organizationName?: string;
  businessEmail?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    organizationName?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate role requirements
    if (data.role === UserRole.ORGANIZER) {
      if (!data.organizationName || !data.businessEmail) {
        throw new ValidationError('Organization name and business email are required for organizers');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        status: UserStatus.PENDING_VERIFICATION,
        isEmailVerified: false,
        organizationName: data.organizationName,
        businessEmail: data.businessEmail,
      },
    });

    // Generate email verification token
    await this.generateEmailVerificationToken(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        organizationName: user.organizationName,
      },
      ...tokens,
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AuthenticationError(`Account is locked. Try again in ${minutesLeft} minute(s)`);
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new AuthenticationError('Account is not active. Please contact support');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const lockUntil = failedAttempts >= config.security.maxLoginAttempts
        ? new Date(Date.now() + config.security.lockoutDuration * 60 * 1000)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockUntil,
        },
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        organizationName: user.organizationName,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<Omit<AuthResponse, 'user'>> {
    // Verify refresh token (throws if invalid)
    verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenDoc = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenDoc || tokenDoc.revoked || tokenDoc.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = tokenDoc.user;

    // Check if user is still active
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new AuthenticationError('User account is not active');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenDoc.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'token_rotation',
      },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Save new refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    return tokens;
  }

  /**
   * Logout user (revoke refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'user_logout',
      },
    });
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundError('Invalid verification token');
    }

    if (verification.verified) {
      throw new ValidationError('Email already verified');
    }

    if (verification.expiresAt < new Date()) {
      throw new ValidationError('Verification token has expired');
    }

    // Verify email
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: verification.userId },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          status: verification.user.status === UserStatus.PENDING_VERIFICATION
            ? UserStatus.ACTIVE
            : verification.user.status,
        },
      }),
    ]);
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      // Don't throw error - token is still valid
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      throw new NotFoundError('Invalid reset token');
    }

    if (reset.used) {
      throw new ValidationError('Reset token has already been used');
    }

    if (reset.expiresAt < new Date()) {
      throw new ValidationError('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * Generate email verification token
   */
  private static async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Get user to send email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      try {
        await emailService.sendVerificationEmail(user.email, token);
      } catch (error) {
        logger.error('Failed to send verification email:', error);
      }
    }

    return token;
  }

  /**
   * Generate JWT tokens
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
   * Change password (for authenticated users)
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Request email verification code (alternative to token-based)
   */
  static async requestEmailVerificationCode(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Generate verification token (same as registration)
    await this.generateEmailVerificationToken(user.id);

    logger.info(`Email verification code requested for user: ${user.email}`);
  }

  /**
   * Verify email with code (alternative to token-based)
   */
  static async verifyEmailWithCode(email: string, _code: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // For now, we'll use the token-based verification
    // In a full implementation, we'd store codes similar to phone verification
    // This is a placeholder that shows the interface
    throw new ValidationError('Code-based email verification not yet implemented. Use token-based verification.');
  }
}

