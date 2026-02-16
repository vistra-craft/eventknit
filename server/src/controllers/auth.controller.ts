import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { TicketSecurityService } from '../services/ticket-security.service.js';

export class AuthController {
  /**
   * Request registration verification code (email-only registration)
   * Note: role parameter is now optional and ignored (all users default to ATTENDEE)
   */
  static async requestRegistrationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Role parameter is optional and will be ignored - all users default to ATTENDEE
      await AuthService.requestRegistrationCode(req.body.email);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify registration code and create account
   */
  static async verifyRegistrationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.verifyRegistrationCode(
        req.body.email,
        req.body.code,
        req.body.password,
        req.body.firstName,
        req.body.lastName,
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new user (legacy endpoint - kept for backward compatibility)
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Signup successful. Please check your email to verify your account.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      const rememberMe = req.body.rememberMe === true;

      const result = await AuthService.login(req.body, ipAddress, userAgent, rememberMe);

      // Set refresh token as HttpOnly cookie
      // If rememberMe is true, extend cookie to 30 days, otherwise 7 days
      const cookieMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 7 * 24 * 60 * 60 * 1000; // 7 days

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Only accept refresh token from HttpOnly cookie (not request body)
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await AuthService.refreshToken(refreshToken, ipAddress, userAgent);

      // Update refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      await AuthService.forgotPassword(req.body.email, ipAddress);

      // Always return success (don't reveal if email exists)
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      await AuthService.resetPassword(req.body.token, req.body.password, ipAddress);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          status: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          organizationName: true,
          businessEmail: true,
          kycStatus: true,
          onboardingCompleted: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          password: true, // Only used for hasPassword check below — never sent in response
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const hasPassword = !!user.password;
      const { password: _password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...userWithoutPassword,
            hasPassword,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // NOTE: email is NOT accepted here — use the dedicated /email/request-change flow
      const { firstName, lastName, otherName, phoneNumber, companyAffiliation, organizationName, businessEmail, avatar } = req.body;

      const { ProfileService } = await import('../services/profile.service.js');

      // Update profile using ProfileService
      const user = await ProfileService.updateProfileWithAvatar(
        req.user.id,
        req.file,
        {
          firstName,
          lastName,
          otherName,
          phoneNumber,
          companyAffiliation,
          organizationName,
          businessEmail,
          avatar,
        },
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      // Handle Cloudinary configuration errors
      if (error instanceof Error &&
          (error.message.includes('not configured') || error.message.includes('CLOUDINARY'))) {
        res.status(400).json({
          success: false,
          message: 'Cloudinary is not configured. Please configure Cloudinary credentials or provide an avatar URL instead of uploading a file.',
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Request Email OAuth code (code-based passwordless login/registration)
   * Note: role parameter is now optional and ignored (all users default to ATTENDEE)
   */
  static async requestEmailOAuthCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Role parameter is optional and will be ignored - all users default to ATTENDEE
      await AuthService.requestEmailOAuthCode(req.body.email);

      res.status(200).json({
        success: true,
        message: 'Verification code has been sent to your email.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email OAuth code and authenticate user (creates account if new, logs in if existing)
   */
  static async verifyEmailOAuthCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await AuthService.verifyEmailOAuthCode(
        req.body.email,
        req.body.code,
        ipAddress,
        userAgent,
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth login/registration
   * Note: role parameter is now optional and ignored (all new users default to ATTENDEE)
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const { GoogleAuthService } = await import('../services/google-auth.service.js');
      const result = await GoogleAuthService.authenticateWithGoogle(
        req.body.token,
        req.body.tokenType || 'id_token',
        undefined, // Role parameter no longer used - all new users default to ATTENDEE
        ipAddress,
        userAgent,
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apple OAuth login/registration
   * Note: role parameter is now optional and ignored (all new users default to ATTENDEE)
   */
  static async appleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const { AppleAuthService } = await import('../services/apple-auth.service.js');
      const result = await AppleAuthService.authenticateWithApple(
        req.body.idToken,
        undefined, // Role parameter no longer used - all new users default to ATTENDEE
        req.body.user,
        ipAddress,
        userAgent,
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Apple authentication successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await AuthService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup password for guest users (users without password)
   */
  static async setupPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await AuthService.setPassword(req.user.id, req.body.password);

      res.status(200).json({
        success: true,
        message: 'Password set successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create account from invitation token (for guest users)
   */
  static async createAccountFromInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.createAccountFromInvitation(req.body.token, req.body.password);

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend account invitation email
   */
  static async resendAccountInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resendAccountInvitation(req.body.email);

      res.status(200).json({
        success: true,
        message: 'Account invitation email sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request email verification code
   */
  static async requestEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.requestEmailVerificationCode(req.body.email);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm email verification with code
   */
  static async confirmEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // For now, this will throw an error since code-based verification isn't fully implemented
      // In production, you'd implement it similar to phone verification
      await AuthService.verifyEmailWithCode(req.body.email, req.body.code);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request magic link login (send email with login link)
   */
  static async requestMagicLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.requestMagicLink(req.body.email);

      res.status(200).json({
        success: true,
        message: 'Magic link sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify magic link token and auto-login user
   */
  static async verifyMagicLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string || req.body.token;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await AuthService.verifyMagicLink(token, ipAddress, userAgent);

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request email change — sends code to new email, notifies old email
   */
  static async requestEmailChange(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await AuthService.requestEmailChange(
        req.user.id,
        req.body.newEmail,
        req.body.currentPassword,
      );

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your new email address',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm email change with the verification code
   */
  static async confirmEmailChange(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await AuthService.confirmEmailChange(
        req.user.id,
        req.body.code,
      );

      res.status(200).json({
        success: true,
        message: 'Email changed successfully. Please log in again with your new email.',
        data: { newEmail: result.newEmail },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Ed25519 public key for ticket signature verification
   * Mobile apps use this to verify ticket signatures offline
   */
  static async getPublicKey(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicKey = TicketSecurityService.getPublicKey();

      res.status(200).json({
        success: true,
        data: {
          publicKey,
          algorithm: 'Ed25519',
          format: 'hex',
          usage: 'ticket-verification',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

