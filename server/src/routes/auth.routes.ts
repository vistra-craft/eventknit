import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authValidations } from '../validations/auth.validations.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import cookieParser from 'cookie-parser';

const router = Router();

// Use cookie parser for refresh tokens
router.use(cookieParser());

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
 * @route   POST /api/v1/auth/facebook
 * @desc    Facebook OAuth login/registration
 * @access  Public
 */
router.post(
  '/facebook',
  authRateLimiter,
  validate(authValidations.facebookAuth),
  AuthController.facebookAuth,
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
 * @route   GET /api/v1/auth/verify-invitation
 * @desc    Verify invitation token and get email (for displaying in create account form)
 * @access  Public
 */
router.get(
  '/verify-invitation',
  authRateLimiter,
  AuthController.verifyInvitationToken,
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
 * @route   POST /api/v1/auth/password/setup-request
 * @desc    Request password setup email (Eventbrite-style)
 * @access  Public
 */
router.post(
  '/password/setup-request',
  authRateLimiter,
  validate(authValidations.forgotPassword), // Reuse forgot password validation (just needs email)
  AuthController.requestPasswordSetup,
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
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  validate(authValidations.updateProfile),
  AuthController.updateProfile,
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

export default router;
