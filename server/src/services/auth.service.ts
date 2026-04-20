import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, checkPasswordBreach, hashToken } from '../utils/password.js';
import { logger } from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiresIn,
  type TokenPayload,
} from '../utils/jwt.js';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
} from '../utils/errors.js';
import { emailService } from './email.service.js';
import { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config/index.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';

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
    onboardingCompleted?: boolean; // For organizers - tracks if onboarding is complete
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Request registration verification code (email with SMS backup)
   */
  static async requestRegistrationCode(
    email: string,
    role?: UserRole,
    phoneNumber?: string,
  ): Promise<void> {
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

    // All new registrations default to ATTENDEE role
    // Users can become organizers later by creating events (unified dashboard approach)
    const selectedRole = UserRole.ATTENDEE;

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // Send verification code via email (primary)
    try {
      await emailService.sendVerificationCode(email, code);
      logger.info(`Registration code sent via email to: ${email} for role: ${selectedRole}`);
    } catch (emailError) {
      logger.warn(`Failed to send verification code via email: ${emailError}`);
      
      // If email fails and phone number provided, try SMS as backup
      if (phoneNumber) {
        try {
          const { smsService } = await import('./sms.service.js');
          if (smsService.isEnabled()) {
            const smsResult = await smsService.sendVerificationCode(phoneNumber, code);
            if (smsResult.success) {
              logger.info(`Registration code sent via SMS backup to: ${phoneNumber} for role: ${selectedRole}`);
            } else {
              throw new Error('Both email and SMS delivery failed');
            }
          } else {
            throw emailError; // SMS not enabled, throw original email error
          }
        } catch (smsError) {
          logger.error(`SMS backup also failed: ${smsError}`);
          throw emailError; // Throw original email error
        }
      } else {
        throw emailError; // No phone number, throw email error
      }
    }

    // If phone number provided and SMS is enabled, also send via SMS (dual send option)
    if (phoneNumber) {
      try {
        const { smsService } = await import('./sms.service.js');
        if (smsService.isEnabled()) {
          // Send via SMS as well (dual channel for reliability)
          await smsService.sendVerificationCode(phoneNumber, code);
          logger.info(`Registration code also sent via SMS to: ${phoneNumber}`);
        }
      } catch (smsError) {
        // SMS is optional, don't fail if it doesn't work
        logger.warn(`Optional SMS send failed (non-critical): ${smsError}`);
      }
    }
  }

  /**
   * Verify registration code and create user account
   * Now requires password (traditional registration)
   */
  static async verifyRegistrationCode(
    email: string,
    code: string,
    password: string,
    firstName: string,
    lastName: string,
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

    // Check password against known breaches
    const breachCount = await checkPasswordBreach(password);
    if (breachCount > 0) {
      throw new ValidationError(
        `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
      );
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
        firstName,
        lastName,
        role: userRole,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        // Set onboardingCompleted to false for ALL new users (unified onboarding)
        // Will be set to true after completing onboarding flow
        onboardingCompleted: false,
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
        onboardingCompleted: user.onboardingCompleted,
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
    // Only allow ATTENDEE or ORGANIZER for self-registration (defense-in-depth)
    const userRole = data.role || UserRole.ATTENDEE;
    if (userRole !== UserRole.ATTENDEE && userRole !== UserRole.ORGANIZER) {
      throw new ValidationError('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
    }

    // Organizers require admin approval; all other roles are auto-approved
    const userStatus = userRole === UserRole.ORGANIZER ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE;

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
        status: userStatus,
        isEmailVerified: false, // Email verification still required
        organizationName: data.organizationName,
        businessEmail: data.businessEmail,
      },
    });

    // If organizer, send pending notification and alert admins
    if (userRole === UserRole.ORGANIZER) {
      // Fire-and-forget: notify organizer their application is under review
      emailService.sendOrganizerPendingEmail(user.email, user.firstName || '').catch((err) => {
        logger.error('Failed to send organizer pending email:', err);
      });

      // Fire-and-forget: notify admins about new organizer
      this.notifyAdminsOfNewOrganizer(user).catch((err) => {
        logger.error('Failed to notify admins of new organizer:', err);
      });
    }

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
   * Notify all active admins (SUPERADMIN + ADMIN_STAFF) about a new organizer registration
   */
  private static async notifyAdminsOfNewOrganizer(organizer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    organizationName: string | null;
  }): Promise<void> {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPERADMIN, UserRole.ADMIN_STAFF] },
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: { email: true, firstName: true },
    });

    if (admins.length === 0) {
      logger.warn('No active admins found to notify about new organizer registration');
      return;
    }

    await Promise.allSettled(
      admins.map((admin) =>
        emailService.sendAdminNewOrganizerNotification(
          admin.email,
          admin.firstName || 'Admin',
          {
            firstName: organizer.firstName || '',
            lastName: organizer.lastName || '',
            email: organizer.email,
            organizationName: organizer.organizationName,
          },
        ),
      ),
    );
  }

  /**
   * Request Email OAuth code (code-based passwordless login/registration)
   * Works for both new and existing users - sends code to email
   */
  static async requestEmailOAuthCode(email: string, _role?: UserRole): Promise<void> {
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

    // All new registrations default to ATTENDEE role
    // Users can become organizers later by creating events (unified dashboard approach)
    const selectedRole = UserRole.ATTENDEE;

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
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
  static async login(data: LoginData, ipAddress?: string, userAgent?: string, rememberMe: boolean = false): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Log failed login attempt (user not found)
      await createAuditLog({
        action: AuditActions.LOGIN_FAILURE,
        entity: 'User',
        metadata: {
          email: data.email,
          reason: 'User not found',
        },
        ipAddress,
        userAgent,
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      
      // Log locked account login attempt
      await createAuditLog({
        userId: user.id,
        action: AuditActions.LOGIN_ATTEMPT_LOCKED,
        entity: 'User',
        entityId: user.id,
        metadata: {
          email: data.email,
          minutesLeft,
        },
        ipAddress,
        userAgent,
      });

      throw new AuthenticationError(`Account is locked. Try again in ${minutesLeft} minute(s)`);
    }

    // Check account status
    // SUSPENDED users cannot login (banned)
    // DEACTIVATED users can login but cannot perform actions
    if (user.status === UserStatus.SUSPENDED) {
      // Log suspended account login attempt
      await createAuditLog({
        userId: user.id,
        action: AuditActions.SUSPICIOUS_ACTIVITY,
        entity: 'User',
        entityId: user.id,
        metadata: {
          email: data.email,
          reason: 'Suspended account login attempt',
        },
        ipAddress,
        userAgent,
      });

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

      // Log failed login attempt
      await createAuditLog({
        userId: user.id,
        action: lockUntil ? AuditActions.LOGIN_ATTEMPT_LOCKED : AuditActions.LOGIN_FAILURE,
        entity: 'User',
        entityId: user.id,
        metadata: {
          email: data.email,
          failedAttempts,
          locked: !!lockUntil,
        },
        ipAddress,
        userAgent,
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

    // Save refresh token (match DB expiry to cookie duration)
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent, rememberMe);

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
        onboardingCompleted: user.onboardingCompleted,
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

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Replay detection: if a revoked token is reused, it indicates token theft.
    // Revoke ALL refresh tokens for this user (token family revocation per OWASP).
    if (tokenDoc.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: tokenDoc.userId, revoked: false },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: 'replay_detection',
        },
      });

      logger.warn(`Refresh token replay detected for user ${tokenDoc.userId} — all tokens revoked`);

      await createAuditLog({
        userId: tokenDoc.userId,
        action: AuditActions.SUSPICIOUS_ACTIVITY,
        entity: 'RefreshToken',
        entityId: tokenDoc.id,
        metadata: {
          reason: 'Refresh token replay detected',
          revokedTokenId: tokenDoc.id,
          ipAddress: tokenDoc.ipAddress,
        },
      });

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
    // Hash the incoming token to match the stored hash
    const tokenHash = hashToken(token);
    const verification = await prisma.emailVerification.findUnique({
      where: { token: tokenHash },
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
  static async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return;
    }

    // Generate reset token — store SHA-256 hash in DB, send raw token to user
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
        ipAddress,
      },
    });

    // Send raw (unhashed) token to user via email
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
  static async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<void> {
    // Hash the incoming token to match the stored hash
    const tokenHash = hashToken(token);
    const reset = await prisma.passwordReset.findUnique({
      where: { token: tokenHash },
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

    // Log if reset is being used from a different IP than the one that requested it
    if (reset.ipAddress && ipAddress && reset.ipAddress !== ipAddress) {
      logger.warn(`Password reset token used from different IP. Requested from: ${reset.ipAddress}, Used from: ${ipAddress}, User: ${reset.user.email}`);
      await createAuditLog({
        userId: reset.userId,
        action: AuditActions.SUSPICIOUS_ACTIVITY,
        entity: 'PasswordReset',
        entityId: reset.id,
        metadata: {
          reason: 'Password reset used from different IP',
          requestedFrom: reset.ipAddress,
          usedFrom: ipAddress,
        },
        ipAddress,
      });
    }

    // Check password against known breaches
    const breachCount = await checkPasswordBreach(newPassword);
    if (breachCount > 0) {
      throw new ValidationError(
        `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
      );
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

    // Revoke all existing refresh tokens (force re-login on all devices)
    await this.revokeAllUserTokens(reset.userId, 'password_change');
  }

  /**
   * Generate email verification token
   */
  private static async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get user to get email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Store hashed token in DB, send raw token to user
    await prisma.emailVerification.create({
      data: {
        userId,
        email: user.email,
        token: tokenHash,
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
  static async generateTokens(user: { id: string; email: string; role: UserRole }): Promise<{
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
   * Revoke all active refresh tokens for a user
   */
  private static async revokeAllUserTokens(userId: string, reason: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  /**
   * Save refresh token to database
   */
  static async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe: boolean = false,
  ): Promise<void> {
    const expiresAt = new Date();
    const daysToExpire = rememberMe ? 30 : 7;
    expiresAt.setDate(expiresAt.getDate() + daysToExpire);

    // Use upsert to handle potential duplicate tokens (shouldn't happen but safety measure)
    await prisma.refreshToken.upsert({
      where: { token },
      update: {
        userId,
        expiresAt,
        ipAddress,
        userAgent,
        revoked: false,
        revokedAt: null,
        revokedReason: null,
      },
      create: {
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

    // Check password against known breaches
    const breachCount = await checkPasswordBreach(newPassword);
    if (breachCount > 0) {
      throw new ValidationError(
        `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
      );
    }

    // If user has no password, allow setting initial password (currentPassword can be empty)
    if (!user.password) {
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      // Revoke all existing refresh tokens (force re-login on other devices)
      await this.revokeAllUserTokens(userId, 'password_change');

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

    // Revoke all existing refresh tokens (force re-login on other devices)
    await this.revokeAllUserTokens(userId, 'password_change');

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

    // Check password against known breaches
    const breachCount = await checkPasswordBreach(newPassword);
    if (breachCount > 0) {
      throw new ValidationError(
        `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
      );
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

    // Revoke all existing refresh tokens (force re-login on other devices)
    await this.revokeAllUserTokens(userId, 'password_change');

    logger.info(`Password set for user: ${user.email}`);
  }

  /**
   * Create account from invitation token (for guest users who registered for events)
   * Verifies token, loads existing guest account, sets password, and returns auth response
   */
  static async createAccountFromInvitation(token: string, password: string): Promise<AuthResponse> {
    // Hash the incoming token to match the stored hash
    const tokenHash = hashToken(token);

    // Find email verification record with the hashed token
    const emailVerification = await prisma.emailVerification.findUnique({
      where: { token: tokenHash },
      include: {
        user: true,
      },
    });

    if (!emailVerification) {
      throw new NotFoundError('Invalid or expired invitation link');
    }

    // Check if token is expired
    if (emailVerification.expiresAt && new Date(emailVerification.expiresAt) < new Date()) {
      throw new ValidationError('Invitation link has expired');
    }

    // Check if already used
    if (emailVerification.verified) {
      throw new ValidationError('This invitation link has already been used');
    }

    const user = emailVerification.user;

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
    }

    // Check if password already exists
    if (user.password) {
      throw new ValidationError('Account already has a password. Use login or password reset instead.');
    }

    // Validate password
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check password against known breaches
    const breachCount = await checkPasswordBreach(password);
    if (breachCount > 0) {
      throw new ValidationError(
        `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Mark email verification as used
    await prisma.emailVerification.update({
      where: { id: emailVerification.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(updatedUser);

    // Save refresh token
    await this.saveRefreshToken(updatedUser.id, tokens.refreshToken);

    logger.info(`Account created from invitation for user: ${user.email}`);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        otherName: updatedUser.otherName,
        companyAffiliation: updatedUser.companyAffiliation,
        role: updatedUser.role,
        status: updatedUser.status,
        isEmailVerified: updatedUser.isEmailVerified,
        organizationName: updatedUser.organizationName,
        verificationLevel: updatedUser.verificationLevel,
      },
      ...tokens,
    };
  }

  /**
   * Resend account invitation email for passwordless users
   * Invalidates old tokens and sends a new invitation
   */
  static async resendAccountInvitation(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      // Return success to prevent email enumeration
      return;
    }

    // Check if user already has a password
    if (user.password) {
      throw new ValidationError('Account already has a password. Use login or password reset instead.');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
    }

    // Find and invalidate existing unverified account invitation tokens
    await prisma.emailVerification.updateMany({
      where: {
        userId: user.id,
        email: user.email,
        verified: false,
        // Only invalidate tokens that haven't expired yet (or are close to expiring)
        expiresAt: {
          gte: new Date(),
        },
      },
      data: {
        verified: true, // Mark as used to invalidate
        verifiedAt: new Date(),
      },
    });

    // Generate new account invitation token — store hash, send raw token
    const accountInvitationToken = crypto.randomBytes(32).toString('hex');
    const accountInvitationTokenHash = hashToken(accountInvitationToken);
    const accountInvitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store hashed token in DB
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        token: accountInvitationTokenHash,
        expiresAt: accountInvitationExpiresAt,
        verified: false,
      },
    });

    // Send raw (unhashed) token in the email link
    const accountCreationUrl = `${config.frontend.url}/auth/create-account?token=${accountInvitationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Create Your EventKnit Account</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4a6cf7 0%, #5b7cfa 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to EventKnit!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Create Your Account</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333;">Create Your Account</h2>
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                You've requested a new account invitation link. Create your EventKnit account to easily manage your tickets, view your event history, and register for future events.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${accountCreationUrl}" style="background-color: #4a6cf7; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(74, 108, 247, 0.3);">
                  Create Account
                </a>
              </div>

              <p style="margin: 20px 0 0 0; color: #999; font-size: 14px; text-align: center;">
                This link will expire in 7 days. If you didn't request this, you can safely ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center;">
                Need help? Contact us at <a href="mailto:support@eventknit.com" style="color: #4a6cf7; text-decoration: none;">support@eventknit.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #bbb; text-align: center;">
                This is an automated message. Please do not reply.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: 'Create Your EventKnit Account',
      html,
      isCritical: false, // Not critical - user can request again
    });

    if (emailResult.success) {
      if (emailResult.attempts > 1) {
        logger.info(`Account invitation email resent to: ${user.email} after ${emailResult.attempts} attempts`);
      } else {
        logger.info(`Account invitation email resent to: ${user.email}`);
      }
    } else {
      logger.warn(`Failed to resend account invitation email to ${user.email} after ${emailResult.attempts} attempts:`, emailResult.error);
      throw new ServiceUnavailableError('Failed to send account invitation email. Please try again later.');
    }
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

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email
    await prisma.emailVerification.deleteMany({
      where: {
        email: user.email,
        verified: false,
      },
    });

    // Create new verification code
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        code,
        expiresAt,
      },
    });

    // Send verification code email
    await emailService.sendVerificationCode(user.email, code);

    logger.info(`Email verification code requested for user: ${user.email}`);
  }

  /**
   * Verify email with code (alternative to token-based)
   */
  static async verifyEmailWithCode(email: string, code: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

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

    // Mark verification as complete and update user
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
    ]);

    logger.info(`Email verified with code for user: ${user.email}`);
  }

  /**
   * Request magic link login (send email with login link)
   */
  static async requestMagicLink(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('This account has been suspended. Please contact support.');
    }

    // Generate secure token — store hash, send raw token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete ALL existing unused magic link tokens for this user (not just expired)
    await prisma.magicLinkToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new magic link token with hashed value
    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
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
    // Hash the incoming token to match the stored hash
    const tokenHash = hashToken(token);
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token: tokenHash },
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
        organizationName: user.organizationName,
        verificationLevel: user.verificationLevel,
        onboardingCompleted: user.onboardingCompleted,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Request email change — requires password confirmation.
   * Sends a verification code to the NEW email and a notification to the OLD email.
   */
  static async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Cannot change to the same email (newEmail is already normalized by Joi validation)
    if (user.email === newEmail) {
      throw new ValidationError('New email must be different from your current email');
    }

    // Require password confirmation to prevent session-hijack attacks
    if (!user.password) {
      throw new ValidationError('You must set a password before changing your email. Use the password setup flow first.');
    }
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Delete any existing pending email change requests for this user
    await prisma.pendingEmailChange.deleteMany({
      where: { userId, verified: false },
    });

    // Generate verification code for the NEW email
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.pendingEmailChange.create({
      data: {
        userId,
        oldEmail: user.email,
        newEmail,
        code,
        expiresAt,
      },
    });

    // Send verification code to the NEW email
    await emailService.sendVerificationCode(newEmail, code);

    // Send notification to the OLD email (security alert, not a code)
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Email Change Requested - EventKnit',
        html: `
          <p>Hello ${user.firstName || 'there'},</p>
          <p>A request was made to change your EventKnit account email to <strong>${newEmail}</strong>.</p>
          <p>If this was you, no action is needed — the change will complete once the new email is verified.</p>
          <p>If this wasn't you, please <a href="${config.frontend.url}/auth/signin">log in and change your password immediately</a>, or contact support.</p>
          <p>— The EventKnit Team</p>
        `,
        isCritical: true,
      });
    } catch (notifyError) {
      // Non-blocking — the change can still proceed
      logger.warn(`Failed to send email change notification to old email: ${notifyError}`);
    }

    logger.info(`Email change requested for user ${userId}: ${user.email} → ${newEmail}`);
  }

  /**
   * Confirm email change with the verification code sent to the new email.
   * Updates the user's email and sends a final confirmation to the old address.
   */
  static async confirmEmailChange(
    userId: string,
    code: string,
  ): Promise<{ newEmail: string }> {
    const pending = await prisma.pendingEmailChange.findFirst({
      where: {
        userId,
        code,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      throw new ValidationError('Invalid verification code');
    }

    if (pending.expiresAt < new Date()) {
      throw new ValidationError('Verification code has expired. Please request a new email change.');
    }

    // Re-check that the new email is still available (race condition guard)
    const existingUser = await prisma.user.findUnique({
      where: { email: pending.newEmail },
    });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Atomically update the email and mark the change as verified
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { email: pending.newEmail },
      }),
      prisma.pendingEmailChange.update({
        where: { id: pending.id },
        data: { verified: true, verifiedAt: new Date() },
      }),
    ]);

    // Revoke all refresh tokens — force re-login with new email in token payload
    await this.revokeAllUserTokens(userId, 'email_change');

    // Send confirmation to the OLD email
    try {
      await emailService.sendEmail({
        to: pending.oldEmail,
        subject: 'Your Email Has Been Changed - EventKnit',
        html: `
          <p>Hello,</p>
          <p>Your EventKnit account email has been successfully changed to <strong>${pending.newEmail}</strong>.</p>
          <p>If this wasn't you, please contact support immediately at <a href="mailto:support@eventknit.com">support@eventknit.com</a>.</p>
          <p>— The EventKnit Team</p>
        `,
        isCritical: true,
      });
    } catch (notifyError) {
      logger.warn(`Failed to send email change confirmation to old email: ${notifyError}`);
    }

    logger.info(`Email changed for user ${userId}: ${pending.oldEmail} → ${pending.newEmail}`);

    return { newEmail: pending.newEmail };
  }
}

