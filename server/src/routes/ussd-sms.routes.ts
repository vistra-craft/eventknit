import { Router } from 'express';
import { USSDSMSController } from '../controllers/ussd-sms.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const smsRouter = Router();
const ussdRouter = Router();
const mpesaRouter = Router();

/**
 * @route   POST /api/v1/sms/webhook
 * @desc    Handle incoming SMS webhook (Twilio)
 * @access  Public (webhook - no auth required, but should verify webhook signature)
 */
smsRouter.post('/webhook', USSDSMSController.handleIncomingSMS);

/**
 * @route   GET /api/v1/admin/sms/sessions/:phoneNumber
 * @desc    Get SMS session status (admin only)
 * @access  Private (ADMIN+)
 */
smsRouter.get(
  '/sessions/:phoneNumber',
  authenticate,
  requireMinRole(UserRole.ADMIN),
  USSDSMSController.getSessionStatus,
);

/**
 * @route   POST /api/v1/ussd/webhook
 * @desc    Handle USSD webhook
 * @access  Public (webhook - no auth required, but should verify webhook signature)
 */
ussdRouter.post('/webhook', USSDSMSController.handleUSSD);

/**
 * @route   POST /api/v1/mpesa/callback
 * @desc    Handle M-Pesa STK Push callback
 * @access  Public (webhook from Safaricom)
 */
mpesaRouter.post('/callback', USSDSMSController.handleMpesaCallback);

/**
 * @route   POST /api/v1/mpesa/timeout
 * @desc    Handle M-Pesa timeout callback
 * @access  Public (webhook from Safaricom)
 */
mpesaRouter.post('/timeout', USSDSMSController.handleMpesaTimeout);

export { smsRouter, ussdRouter, mpesaRouter };

