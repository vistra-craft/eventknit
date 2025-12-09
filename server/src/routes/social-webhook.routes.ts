/**
 * Social Media Webhook Routes
 * 
 * Public routes for receiving webhooks from social media platforms
 */

import { Router } from 'express';
import { SocialWebhookController } from '../controllers/social-webhook.controller';

const router = Router();

// Facebook webhook
router.post('/facebook', SocialWebhookController.handleFacebookWebhook);

// Twitter webhook
router.post('/twitter', SocialWebhookController.handleTwitterWebhook);

// Instagram webhook
router.post('/instagram', SocialWebhookController.handleInstagramWebhook);

export default router;
