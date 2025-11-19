import { Request, Response, NextFunction } from 'express';
import { USSDSMSService, IncomingSMS } from '../services/ussd-sms.service.js';
import { logger } from '../utils/logger.js';

export class USSDSMSController {
  /**
   * Handle incoming SMS webhook (Twilio)
   * POST /api/v1/sms/webhook
   */
  static async handleIncomingSMS(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Twilio webhook format
      const from = req.body.From || req.body.from;
      const body = req.body.Body || req.body.body || req.body.message;
      const messageSid = req.body.MessageSid || req.body.messageId;

      if (!from || !body) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: From and Body',
        });
        return;
      }

      const incoming: IncomingSMS = {
        from,
        body,
        messageId: messageSid,
      };

      // Process asynchronously (don't wait for completion)
      USSDSMSService.processIncomingSMS(incoming).catch((error) => {
        logger.error('Failed to process incoming SMS:', error);
      });

      // Respond immediately to webhook (Twilio expects quick response)
      res.status(200).json({
        success: true,
        message: 'SMS received and processing',
      });
    } catch (error) {
      logger.error('Failed to handle incoming SMS webhook:', error);
      // Still return 200 to prevent webhook retries
      res.status(200).json({
        success: false,
        message: 'Error processing SMS',
      });
    }
  }

  /**
   * Handle USSD webhook (if using USSD gateway)
   * POST /api/v1/ussd/webhook
   */
  static async handleUSSD(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const phoneNumber = req.body.phoneNumber || req.body.msisdn;
      const sessionId = req.body.sessionId;
      const userInput = req.body.text || req.body.input || '';

      if (!phoneNumber || !sessionId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: phoneNumber and sessionId',
        });
        return;
      }

      // Convert USSD to SMS format for processing
      const incoming: IncomingSMS = {
        from: phoneNumber,
        body: userInput || 'START',
        messageId: sessionId,
      };

      // Process USSD input
      await USSDSMSService.processIncomingSMS(incoming);

      // USSD requires immediate response
      // Get the response message (this would need to be stored in session)
      res.status(200).send('END Registration service is processing. You will receive an SMS shortly.');
    } catch (error) {
      logger.error('Failed to handle USSD webhook:', error);
      res.status(200).send('END Error processing request. Please try again.');
    }
  }

  /**
   * Get SMS session status (for debugging/admin)
   * GET /api/v1/admin/sms/sessions/:phoneNumber
   */
  static async getSessionStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { phoneNumber } = req.params;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      // This would need to be implemented in the service
      // For now, just return a placeholder
      res.status(200).json({
        success: true,
        message: 'Session status endpoint - to be implemented',
      });
    } catch (error) {
      next(error);
    }
  }
}




