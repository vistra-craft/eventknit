import { Router } from 'express';
import { USSDSMSController } from '../controllers/ussd-sms.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const smsRouter = Router();
const ussdRouter = Router();

/**
 * @route   POST /api/v1/sms/webhook
 * @desc    Handle incoming SMS webhook (Twilio)
 * @access  Public (webhook - no auth required, but should verify webhook signature)
 */
smsRouter.post('/webhook', USSDSMSController.handleIncomingSMS);

/**
 * @route   GET /api/v1/admin/sms/sessions/:phoneNumber
 * @desc    Get SMS session status (admin only)
 * @access  Private (ADMIN_STAFF+)
 */
smsRouter.get(
  '/sessions/:phoneNumber',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  USSDSMSController.getSessionStatus,
);

/**
 * @route   POST /api/v1/ussd/webhook
 * @desc    Handle USSD webhook
 * @access  Public (webhook - no auth required, but should verify webhook signature)
 */
ussdRouter.post('/webhook', USSDSMSController.handleUSSD);

export { smsRouter, ussdRouter };

