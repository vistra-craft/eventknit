import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Onboarding routes
 * All routes require authentication
 * Base path: /api/v1/onboarding
 */

// Get current onboarding status
router.get('/status', authenticate, OnboardingController.getOnboardingStatus);

// Save onboarding progress (can be called multiple times)
router.post('/progress', authenticate, OnboardingController.saveProgress);

// Complete onboarding
router.post('/complete', authenticate, OnboardingController.completeOnboarding);

// Skip onboarding
router.post('/skip', authenticate, OnboardingController.skipOnboarding);

export default router;
