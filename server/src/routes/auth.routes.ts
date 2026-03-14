import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller.js';
import { StaffInvitationController } from '../controllers/staff-invitation.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authValidations } from '../validations/auth.validations.js';
import { staffInvitationValidations } from '../validations/staff-invitation.validations.js';
import { authRateLimiter, ipAuthRateLimiter } from '../middleware/rateLimiter.middleware.js';
import cookieParser from 'cookie-parser';

const router = Router();

// Use cookie parser for refresh tokens
router.use(cookieParser());

// Apply IP-based rate limiting to all auth routes (credential stuffing protection)
router.use(ipAuthRateLimiter);

/**
 * @route   POST /api/v1/auth/register-code/request
 * @desc    Request registration verification code (email-only registration)
 * @access  Public
 */
router.post(
  '/register-code/request',
  authRateLimiter,
  validate(authValidations.requestRegistrationCode),
  AuthController.requestRegistrationCode,
);

/**
 * @route   POST /api/v1/auth/register-code/verify
 * @desc    Verify registration code and create account
 * @access  Public
 */
router.post(
  '/register-code/verify',
  authRateLimiter,
  validate(authValidations.verifyRegistrationCode),
  AuthController.verifyRegistrationCode,
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (legacy endpoint)
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate(authValidations.register),
  AuthController.register,
);

// Alias for backward compatibility
router.post(
  '/signup',
  authRateLimiter,
  validate(authValidations.register),
  AuthController.register,
);

/**
 * @route   POST /api/v1/auth/email-oauth/request
 * @desc    Request Email OAuth code (code-based passwordless login/registration)
 * @access  Public
 */
router.post(
  '/email-oauth/request',
  authRateLimiter,
  validate(authValidations.requestEmailOAuthCode),
  AuthController.requestEmailOAuthCode,
);

/**
 * @route   POST /api/v1/auth/email-oauth/verify
 * @desc    Verify Email OAuth code and authenticate user (creates account if new, logs in if existing)
 * @access  Public
 */
router.post(
  '/email-oauth/verify',
  authRateLimiter,
  validate(authValidations.verifyEmailOAuthCode),
  AuthController.verifyEmailOAuthCode,
);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth login/registration
 * @access  Public
 */
router.post(
  '/google',
  authRateLimiter,
  validate(authValidations.googleAuth),
  AuthController.googleAuth,
);

/**
 * @route   POST /api/v1/auth/apple
 * @desc    Apple Sign In login/registration
 * @access  Public
 */
router.post(
  '/apple',
  authRateLimiter,
  validate(authValidations.appleAuth),
  AuthController.appleAuth,
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validate(authValidations.login),
  AuthController.login,
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidations.refreshToken),
  AuthController.refreshToken,
);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify email with token (for email links)
 * @access  Public
 */
router.get('/verify-email', AuthController.verifyEmail);

/**
 * @route   POST /api/v1/auth/verify-email/request
 * @desc    Request email verification code
 * @access  Public
 */
router.post(
  '/verify-email/request',
  authRateLimiter,
  validate(authValidations.requestEmailVerification),
  AuthController.requestEmailVerification,
);

/**
 * @route   POST /api/v1/auth/verify-email/confirm
 * @desc    Confirm email verification with code
 * @access  Public
 */
router.post(
  '/verify-email/confirm',
  authRateLimiter,
  validate(authValidations.confirmEmailVerification),
  AuthController.confirmEmailVerification,
);

/**
 * @route   POST /api/v1/auth/password/reset-request
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/password/reset-request',
  authRateLimiter,
  validate(authValidations.forgotPassword),
  AuthController.forgotPassword,
);

// Alias for backward compatibility
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(authValidations.forgotPassword),
  AuthController.forgotPassword,
);

/**
 * @route   POST /api/v1/auth/password/reset-confirm
 * @desc    Confirm password reset
 * @access  Public
 */
router.post(
  '/password/reset-confirm',
  authRateLimiter,
  validate(authValidations.resetPassword),
  AuthController.resetPassword,
);

// Alias for backward compatibility
router.post(
  '/reset-password',
  authRateLimiter,
  validate(authValidations.resetPassword),
  AuthController.resetPassword,
);

/**
 * @route   POST /api/v1/auth/create-account
 * @desc    Create account from invitation token (for guest users)
 * @access  Public
 */
router.post(
  '/create-account',
  authRateLimiter,
  validate(authValidations.createAccountFromInvitation),
  AuthController.createAccountFromInvitation,
);

/**
 * @route   POST /api/v1/auth/resend-invitation
 * @desc    Resend account invitation email (for passwordless users)
 * @access  Public
 */
router.post(
  '/resend-invitation',
  authRateLimiter,
  validate(authValidations.resendAccountInvitation),
  AuthController.resendAccountInvitation,
);

/**
 * @route   POST /api/v1/auth/magic-link/request
 * @desc    Request magic link login (send email with login link)
 * @access  Public
 */
router.post(
  '/magic-link/request',
  authRateLimiter,
  validate(authValidations.requestMagicLink),
  AuthController.requestMagicLink,
);

/**
 * @route   GET /api/v1/auth/magic-link/verify
 * @desc    Verify magic link token and auto-login user
 * @access  Public
 */
router.get(
  '/magic-link/verify',
  authRateLimiter,
  AuthController.verifyMagicLink,
);

/**
 * @route   GET /api/v1/auth/public-key
 * @desc    Get Ed25519 public key for ticket signature verification
 * @access  Public
 * @note    Mobile apps use this to verify ticket signatures offline
 */
router.get('/public-key', AuthController.getPublicKey);

/**
 * @route   POST /api/v1/auth/staff-invitation/validate
 * @desc    Validate a staff invitation token (for accept page)
 * @access  Public
 */
router.post(
  '/staff-invitation/validate',
  authRateLimiter,
  validate(staffInvitationValidations.validateToken),
  StaffInvitationController.validateToken,
);

/**
 * @route   POST /api/v1/auth/staff-invitation/accept
 * @desc    Accept a staff invitation and create account
 * @access  Public
 */
router.post(
  '/staff-invitation/accept',
  authRateLimiter,
  validate(staffInvitationValidations.acceptInvitation),
  StaffInvitationController.acceptInvitation,
);

// Protected routes
router.use(authenticate);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', AuthController.getProfile);

// Alias for backward compatibility
router.get('/profile', AuthController.getProfile);

/**
 * Wrapper for multer middleware to handle errors
 * Only runs multer if the request is multipart/form-data
 */
const handleMulterUpload = (req: Request, res: Response, next: NextFunction): void => {
  const isErrorWithCode = (value: unknown): value is { code: string; message?: string } => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    if (!('code' in value)) {
      return false;
    }
    const codeValue = value.code;
    return typeof codeValue === 'string';
  };

  // Skip multer if not a multipart request
  const contentType = req.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    next();
    return;
  }

  import('../utils/upload.js').then(({ uploadSingleImage }) => {
    uploadSingleImage(req, res, (err: unknown) => {
      // If no error, proceed to next middleware
      if (!err) {
        next();
        return;
      }

      // Handle multer-specific errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            success: false,
            message: 'File too large. Maximum file size is 5MB.',
          });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            success: false,
            message: 'Too many files. Only one file is allowed.',
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
        return;
      }

      // Handle other errors with code property
      if (isErrorWithCode(err) && err.code.startsWith('LIMIT_')) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload limit exceeded',
        });
        return;
      }

      // Handle file filter errors (e.g., "Only image files are allowed")
      if (err instanceof Error && err.message.includes('Only image files are allowed')) {
        res.status(400).json({
          success: false,
          message: err.message,
        });
        return;
      }

      // Pass any other errors to the error handler
      next(err);
    });
  }).catch(next);
};

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  handleMulterUpload,
  validate(authValidations.updateProfile),
  AuthController.updateProfile,
);

/**
 * @route   POST /api/v1/auth/email/request-change
 * @desc    Request email address change (sends code to new email, notification to old)
 * @access  Private
 */
router.post(
  '/email/request-change',
  authRateLimiter,
  validate(authValidations.requestEmailChange),
  AuthController.requestEmailChange,
);

/**
 * @route   POST /api/v1/auth/email/confirm-change
 * @desc    Confirm email change with verification code
 * @access  Private
 */
router.post(
  '/email/confirm-change',
  authRateLimiter,
  validate(authValidations.confirmEmailChange),
  AuthController.confirmEmailChange,
);

/**
 * @route   POST /api/v1/auth/password/change
 * @desc    Change password (authenticated users)
 * @access  Private
 */
router.post(
  '/password/change',
  validate(authValidations.changePassword),
  AuthController.changePassword,
);

/**
 * @route   POST /api/v1/auth/password/setup
 * @desc    Setup password for guest users (users without password)
 * @access  Private
 */
router.post(
  '/password/setup',
  validate(authValidations.setupPassword),
  AuthController.setupPassword,
);

export default router;
