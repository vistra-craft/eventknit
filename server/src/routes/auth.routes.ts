import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authValidations } from '../validations/auth.validations';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import cookieParser from 'cookie-parser';

const router = Router();

// Use cookie parser for refresh tokens
router.use(cookieParser());

// Public routes
router.post(
  '/signup',
  authRateLimiter,
  validate(authValidations.register),
  AuthController.register,
);

router.post(
  '/login',
  authRateLimiter,
  validate(authValidations.login),
  AuthController.login,
);

router.post(
  '/refresh',
  validate(authValidations.refreshToken),
  AuthController.refreshToken,
);

router.get('/verify-email', AuthController.verifyEmail);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(authValidations.forgotPassword),
  AuthController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate(authValidations.resetPassword),
  AuthController.resetPassword,
);

// Protected routes
router.use(authenticate);

router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);

export default router;

