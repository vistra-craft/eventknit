import { Request, Response, NextFunction } from 'express';
import { USSDSMSService, IncomingSMS } from '../services/ussd-sms.service.js';
import { USSDService } from '../services/ussd.service.js';
import { logger } from '../utils/logger.js';

export class USSDSMSController {
  /**
   * Handle incoming SMS webhook (Twilio)
   * POST /api/v1/sms/webhook
   */
  static async handleIncomingSMS(
    req: Request,
    res: Response,
    _next: NextFunction,
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
   * Handle USSD webhook (Africa's Talking format)
   * POST /api/v1/ussd/webhook
   *
   * Africa's Talking sends:
   * - sessionId: Unique session identifier
   * - serviceCode: USSD code dialed (e.g., *123#)
   * - phoneNumber: User's phone number (MSISDN)
   * - text: User input, accumulated with * separator
   *
   * Response format:
   * - CON <message>: Continue session (wait for more input)
   * - END <message>: End session
   */
  static async handleUSSD(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      // Africa's Talking format
      const sessionId = req.body.sessionId;
      const serviceCode = req.body.serviceCode || '*384*123#';
      const phoneNumber = req.body.phoneNumber || req.body.msisdn;
      const text = req.body.text || '';

      logger.info(`USSD request: sessionId=${sessionId}, phone=${phoneNumber}, text="${text}"`);

      if (!phoneNumber || !sessionId) {
        // Return END response for invalid requests
        res.set('Content-Type', 'text/plain');
        res.status(200).send('END Invalid request. Please try again.');
        return;
      }

      // Process USSD request using the new USSDService
      const response = await USSDService.handleRequest({
        sessionId,
        serviceCode,
        phoneNumber,
        text,
      });

      // Return plain text response (Africa's Talking format)
      res.set('Content-Type', 'text/plain');
      res.status(200).send(response);
    } catch (error) {
      logger.error('Failed to handle USSD webhook:', error);
      res.set('Content-Type', 'text/plain');
      res.status(200).send('END An error occurred. Please try again.');
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
      const phoneNumber = (req.params.phoneNumber as string) as string;

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

  /**
   * Handle M-Pesa STK Push callback
   * POST /api/v1/mpesa/callback
   */
  static async handleMpesaCallback(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      logger.info('M-Pesa callback received:', JSON.stringify(req.body));

      const callbackData = req.body;

      // Validate callback structure
      if (!callbackData?.Body?.stkCallback) {
        logger.warn('Invalid M-Pesa callback structure');
        res.status(200).json({ success: true }); // Always return 200 to M-Pesa
        return;
      }

      const callback = callbackData.Body.stkCallback;
      const checkoutRequestId = callback.CheckoutRequestID;
      const resultCode = callback.ResultCode;
      const resultDesc = callback.ResultDesc;

      // Extract receipt number from callback metadata if payment was successful
      let mpesaReceiptNumber: string | undefined;
      let amount: number | undefined;

      if (resultCode === 0 && callback.CallbackMetadata?.Item) {
        for (const item of callback.CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') {
            mpesaReceiptNumber = item.Value?.toString();
          }
          if (item.Name === 'Amount') {
            amount = Number(item.Value);
          }
        }
      }

      // Process callback asynchronously for both SMS and USSD sessions
      Promise.all([
        USSDSMSService.handleMpesaCallback(
          checkoutRequestId,
          resultCode,
          resultDesc,
          mpesaReceiptNumber,
          amount,
        ),
        USSDService.handleMpesaCallback(
          checkoutRequestId,
          resultCode,
          resultDesc,
          mpesaReceiptNumber,
          amount,
        ),
      ]).catch((error) => {
        logger.error('Failed to process M-Pesa callback:', error);
      });

      // Always respond with 200 to prevent M-Pesa from retrying
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Callback received successfully',
      });
    } catch (error) {
      logger.error('Failed to handle M-Pesa callback:', error);
      // Still return 200 to prevent retries
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Callback processed',
      });
    }
  }

  /**
   * Handle M-Pesa timeout callback
   * POST /api/v1/mpesa/timeout
   */
  static async handleMpesaTimeout(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      logger.info('M-Pesa timeout received:', JSON.stringify(req.body));

      // Timeout means the request took too long
      // The payment might still complete, so we don't mark it as failed immediately

      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Timeout acknowledged',
      });
    } catch (error) {
      logger.error('Failed to handle M-Pesa timeout:', error);
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Timeout processed',
      });
    }
  }
}




