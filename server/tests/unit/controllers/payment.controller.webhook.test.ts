import { Request, Response, NextFunction } from 'express';
import { PaymentController } from '../../../src/controllers/payment.controller.js';
import { paymentService } from '../../../src/services/payment.service.js';

// Mock the payment service
vi.mock('../../../src/services/payment.service.js', () => ({
  paymentService: {
    verifyWebhookSignature: vi.fn(),
    handleWebhook: vi.fn(),
  },
}));

// Mock the logger to suppress output during tests
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

type WebhookRequest = Request & { rawBody?: string };

const makeReq = (overrides: Partial<WebhookRequest> = {}): WebhookRequest => ({
  headers: {},
  body: {},
  query: {},
  params: {},
  rawBody: undefined,
  ...overrides,
} as WebhookRequest);

const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
};

describe('PaymentController.handleWebhook', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('Signature detection', () => {
    it('should return 400 when no signature header is present', async () => {
      const req = makeReq({ headers: {}, body: {} });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Missing webhook signature' }),
      );
      expect(paymentService.verifyWebhookSignature).not.toHaveBeenCalled();
    });

    it('should detect Paystack via x-paystack-signature header', async () => {
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const body = { event: 'charge.success', data: { id: 'evt_001', reference: 'ref_001' } };
      const req = makeReq({
        headers: { 'x-paystack-signature': 'valid-paystack-sig' },
        body,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      // Paystack: controller delegates signature verification to gateway via handleWebhook
      expect(paymentService.verifyWebhookSignature).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(
        'charge.success',
        body.data,
        'PAYSTACK',
        'valid-paystack-sig',
        expect.any(String),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should detect Stripe via stripe-signature header', async () => {
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(true);
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const stripeBody = {
        id: 'evt_stripe_001',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_001', amount: 5000, currency: 'usd' } },
      };

      const req = makeReq({
        headers: { 'stripe-signature': 'valid-stripe-sig' },
        body: stripeBody,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledWith(
        expect.any(String),
        'valid-stripe-sig',
        'STRIPE',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Paystack webhook', () => {
    it('should return 200 with success:false when Paystack gateway rejects signature', async () => {
      // Paystack signature verification is delegated to the gateway inside handleWebhook.
      // An invalid signature causes the gateway to throw, which the controller catches and
      // returns 200 (so the provider stops retrying) with success: false.
      (paymentService.handleWebhook as vi.Mock).mockRejectedValue(new Error('Invalid signature'));

      const req = makeReq({
        headers: { 'x-paystack-signature': 'bad-sig' },
        body: { event: 'charge.success', data: { id: 'evt_001' } },
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('should process Paystack event and return 200 on valid signature', async () => {
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const paystackBody = {
        event: 'charge.success',
        data: { id: 'evt_paystack_001', reference: 'ref_paystack_001' },
      };

      const req = makeReq({
        headers: { 'x-paystack-signature': 'valid-sig' },
        body: paystackBody,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(paymentService.handleWebhook).toHaveBeenCalledWith(
        'charge.success',
        paystackBody.data,
        'PAYSTACK',
        'valid-sig',
        expect.any(String),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it('should use rawBody over JSON.stringify for HMAC verification', async () => {
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const rawBody = '{"event":"charge.success","data":{"id":"evt_001"}}';
      const req = makeReq({
        headers: { 'x-paystack-signature': 'valid-sig' },
        body: { event: 'charge.success', data: { id: 'evt_001' } },
        rawBody,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      // rawBody is passed as 5th arg to handleWebhook for gateway-level HMAC verification
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(
        'charge.success',
        { id: 'evt_001' },
        'PAYSTACK',
        'valid-sig',
        rawBody,
      );
    });

    it('should fall back to JSON.stringify when rawBody is absent', async () => {
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const body = { event: 'charge.success', data: { id: 'evt_001' } };
      const req = makeReq({
        headers: { 'x-paystack-signature': 'valid-sig' },
        body,
        rawBody: undefined,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      // Falls back to JSON.stringify(body) as 5th arg when rawBody is absent
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(
        'charge.success',
        body.data,
        'PAYSTACK',
        'valid-sig',
        JSON.stringify(body),
      );
    });
  });

  describe('Stripe webhook', () => {
    it('should return 401 for invalid Stripe signature', async () => {
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(false);

      const req = makeReq({
        headers: { 'stripe-signature': 'bad-sig' },
        body: { id: 'evt_001', type: 'payment_intent.succeeded', data: { object: {} } },
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should process Stripe event with correct event structure extraction', async () => {
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(true);
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const stripeEventId = 'evt_stripe_abc123';
      const stripeBody = {
        id: stripeEventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_001',
            amount: 5000,
            currency: 'usd',
            metadata: { registrationId: 'reg_001' },
          },
        },
      };

      const req = makeReq({
        headers: { 'stripe-signature': 'valid-stripe-sig' },
        body: stripeBody,
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      // handleWebhook called with (eventType, { ...data.object, id: evt_id }, 'STRIPE', sig)
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(
        'payment_intent.succeeded',
        {
          id: stripeEventId,        // event ID merged into data
          amount: 5000,
          currency: 'usd',
          metadata: { registrationId: 'reg_001' },
        },
        'STRIPE',
        'valid-stripe-sig',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should merge top-level Stripe event ID into data object', async () => {
      // Ensures the controller does: { ...data.object, id: stripeBody.id }
      // so paymentService receives the event ID alongside the payment intent fields.
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(true);
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const req = makeReq({
        headers: { 'stripe-signature': 'valid-sig' },
        body: {
          id: 'evt_top_level_id',
          type: 'charge.succeeded',
          data: { object: { amount_captured: 1000 } },
        },
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      const [, stripeData] = (paymentService.handleWebhook as vi.Mock).mock.calls[0];
      expect(stripeData.id).toBe('evt_top_level_id');
      expect(stripeData.amount_captured).toBe(1000);
    });
  });

  describe('Error handling', () => {
    it('should return 200 even when handleWebhook throws (stops provider retries)', async () => {
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(true);
      (paymentService.handleWebhook as vi.Mock).mockRejectedValue(new Error('DB error'));

      const req = makeReq({
        headers: { 'x-paystack-signature': 'valid-sig' },
        body: { event: 'charge.success', data: { id: 'evt_001' } },
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      // Always 200 so payment provider stops retrying
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('should prefer stripe-signature over x-paystack-signature when both present', async () => {
      // Per the controller: isStripe = !!stripeSig — Stripe takes priority
      (paymentService.verifyWebhookSignature as vi.Mock).mockReturnValue(true);
      (paymentService.handleWebhook as vi.Mock).mockResolvedValue({ status: 'OK' });

      const req = makeReq({
        headers: {
          'stripe-signature': 'stripe-sig',
          'x-paystack-signature': 'paystack-sig',
        },
        body: {
          id: 'evt_001',
          type: 'payment_intent.succeeded',
          data: { object: {} },
        },
      });
      const res = makeRes();

      await PaymentController.handleWebhook(req, res, mockNext);

      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledWith(
        expect.any(String),
        'stripe-sig',
        'STRIPE',
      );
    });
  });
});
