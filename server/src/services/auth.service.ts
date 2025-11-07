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
  ServiceUnavailableError,
} from '../utils/errors';
import { emailService } from './email.service';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  otherName?: string; // Middle name or other names
  phoneNumber?: string;
  companyAffiliation?: string; // Company or institutional affiliation
  role?: UserRole; // Optional - defaults to ATTENDEE
  organizationName?: string; // Optional - can be added later
  businessEmail?: string; // Optional - can be added later
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
    otherName?: string | null;
    companyAffiliation?: string | null;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    organizationName?: string | null;
    verificationLevel?: number; // Added for tests
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Request registration verification code (email-only registration)
   */
  static async requestRegistrationCode(email: string, role?: UserRole): Promise<void> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // SUSPENDED users are permanently banned - cannot re-register
      if (existingUser.status === UserStatus.SUSPENDED) {
        throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
      }
      
      // DEACTIVATED users are temporarily banned - cannot re-register until appeal/expiration
      if (existingUser.status === UserStatus.DEACTIVATED) {
        throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
      }
      
      // ACTIVE users cannot re-register
      if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Validate role - only allow ATTENDEE or ORGANIZER for new registrations
    const selectedRole = role || UserRole.ATTENDEE;
    if (selectedRole !== UserRole.ATTENDEE && selectedRole !== UserRole.ORGANIZER) {
      throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email,
        verified: false,
        expiresAt: { lt: new Date() },
      },
    });

    // Delete any existing unverified codes for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email,
        verified: false,
      },
    });

    // Create new verification record with role
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        role: selectedRole,
        expiresAt,
      },
    });

    // Send verification code email
    await emailService.sendVerificationCode(email, code);

    logger.info(`Registration code sent to: ${email} for role: ${selectedRole}`);
  }

  /**
   * Verify registration code and create user account
   * Now requires password (traditional registration)
   */
  static async verifyRegistrationCode(email: string, code: string, password: string): Promise<AuthResponse> {
    // Find verification record
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      throw new ValidationError('Invalid verification code');
    }

    if (verification.expiresAt < new Date()) {
      throw new ValidationError('Verification code has expired');
    }

    // Check if user already exists (race condition check)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // SUSPENDED users are permanently banned - cannot re-register
      if (existingUser.status === UserStatus.SUSPENDED) {
        throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
      }
      
      // DEACTIVATED users are temporarily banned - cannot re-register until appeal/expiration
      if (existingUser.status === UserStatus.DEACTIVATED) {
        throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
      }
      
      // ACTIVE users cannot re-register
      if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Use role from verification record, default to ATTENDEE if not set
    const userRole = verification.role || UserRole.ATTENDEE;

    // Create new user account with selected role and password
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    logger.info(`Created new user via code: ${email}`);

    // Mark verification as verified
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

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

  /**
   * Register a new user (legacy method - kept for backward compatibility)
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Default role to ATTENDEE if not provided
    // All users start as ATTENDEE and can create events after verification
    const userRole = data.role || UserRole.ATTENDEE;

    // Auto-approve registration (no manual approval needed)
    // Users are ACTIVE immediately, but must verify email before full access
    // Admins can later suspend or deactivate users if needed
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        otherName: data.otherName,
        phoneNumber: data.phoneNumber,
        companyAffiliation: data.companyAffiliation,
        role: userRole,
        status: UserStatus.ACTIVE, // Auto-approved - no manual approval needed
        isEmailVerified: false, // Email verification still required
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

  /**
   * Request Email OAuth code (code-based passwordless login/registration)
   * Works for both new and existing users - sends code to email
   */
  static async requestEmailOAuthCode(email: string, role?: UserRole): Promise<void> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // SUSPENDED users are permanently banned - cannot use Email OAuth
      if (existingUser.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }
      
      // DEACTIVATED users can use Email OAuth (they can login but actions restricted)
      // No need to block them here
    }

    // Validate role if provided (only for new users)
    const selectedRole = role || UserRole.ATTENDEE;
    if (selectedRole !== UserRole.ATTENDEE && selectedRole !== UserRole.ORGANIZER) {
      throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed.');
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email,
        verified: false,
      },
    });

    // Create verification record
    // Store role for new user creation if user doesn't exist
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        role: existingUser ? null : selectedRole, // Only store role for new users
        expiresAt,
      },
    });

    // Send verification code email
    await emailService.sendVerificationCode(email, code);

    logger.info(`Email OAuth code sent to: ${email}`);
  }

  /**
   * Verify Email OAuth code and authenticate user (passwordless login/registration)
   * Creates account if new, logs in if existing (like Facebook OAuth)
   */
  static async verifyEmailOAuthCode(
    email: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Find verification record
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      throw new ValidationError('Invalid verification code');
    }

    if (verification.expiresAt < new Date()) {
      throw new ValidationError('Verification code has expired');
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Existing user - log them in
      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        throw new AuthenticationError('Your account has been suspended. Please contact support');
      }
      // DEACTIVATED users can login but will be restricted from actions

      // Mark verification as verified
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          userId: user.id,
        },
      });

      // Update user email verification status if not already verified
      if (!user.isEmailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
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

      logger.info(`User logged in via Email OAuth: ${user.email}`);
    } else {
      // New user - create account (like Facebook OAuth)
      const userRole = verification.role || UserRole.ATTENDEE;

      // Create new user account
      user = await prisma.user.create({
        data: {
          email,
          role: userRole,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`Created new user via Email OAuth: ${email}`);

      // Mark verification as verified
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          userId: user.id,
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

  /**
   * Login user with email and password (traditional login)
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

    // Check account status
    // SUSPENDED users cannot login (banned)
    // DEACTIVATED users can login but cannot perform actions
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Your account has been suspended. Please contact support');
    }
    // DEACTIVATED users can login but will be restricted from actions in middleware

    // Verify password - password is now required
    if (!user.password) {
      throw new AuthenticationError('Invalid email or password');
    }

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

    // Check account status for token refresh
    // SUSPENDED users cannot refresh tokens
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Your account has been suspended. Please contact support');
    }
    // DEACTIVATED users can refresh tokens but will be restricted from actions

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
    if (!verification.userId) {
      throw new ValidationError('Invalid verification token');
    }

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
          // Status remains ACTIVE (already set during registration)
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

    // Get user to get email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.emailVerification.create({
      data: {
        userId,
        email: user.email, // Required field
        token,
        expiresAt,
      },
    });

    try {
      await emailService.sendVerificationEmail(user.email, token);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
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
   * If user has no password, this sets their initial password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If user has no password, allow setting initial password (currentPassword can be empty)
    if (!user.password) {
      // For initial password setup, we can skip current password verification
      // But we should validate that currentPassword is provided (even if empty string)
      // In practice, frontend should call setPassword for initial setup
      const hashedPassword = await hashPassword(newPassword);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      logger.info(`Initial password set for user: ${user.email}`);
      return;
    }

    // User has existing password - verify current password
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
   * Set initial password (for users who registered without a password)
   */
  static async setPassword(userId: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if password already exists
    if (user.password) {
      throw new ValidationError('Password already set. Use change password to update it.');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Set password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info(`Password set for user: ${user.email}`);
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

  /**
   * Request magic link login (send email with login link)
   */
  static async requestMagicLink(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('This account has been suspended. Please contact support.');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing unused magic link tokens for this user
    await prisma.magicLinkToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { lt: new Date() },
      },
    });

    // Create new magic link token
    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send magic link email
    try {
      await emailService.sendMagicLinkEmail(user.email, token);
      logger.info(`Magic link sent to: ${user.email}`);
    } catch (error) {
      logger.error('Failed to send magic link email:', error);
      throw new ServiceUnavailableError('Failed to send magic link email. Please try again later.');
    }
  }

  /**
   * Verify magic link token and auto-login user
   */
  static async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new AuthenticationError('Invalid magic link');
    }

    // Check if already used
    if (magicLink.used) {
      throw new AuthenticationError('This magic link has already been used');
    }

    // Check if expired
    if (magicLink.expiresAt < new Date()) {
      throw new AuthenticationError('Magic link has expired. Please request a new one.');
    }

    const user = magicLink.user;

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('This account has been suspended. Please contact support.');
    }

    // Mark token as used
    await prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: {
        used: true,
        usedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts on successful login
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    logger.info(`Magic link login successful for user: ${user.email}`);

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
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

