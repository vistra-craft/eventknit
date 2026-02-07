import Joi from 'joi';

export const createPaymentPlanSchema = Joi.object({
  registrationId: Joi.string().uuid().required(),
  planName: Joi.string().required().min(3).max(100),
  installmentCount: Joi.number().integer().min(2).max(24).required(),
  frequency: Joi.string().valid('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'CUSTOM').required(),
  startDate: Joi.date().required(),
  autoPaymentEnabled: Joi.boolean().optional(),
  paymentMethod: Joi.string().optional(),
});

export const processInstallmentPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  transactionId: Joi.string().uuid().optional(),
  gateway: Joi.string().valid('PAYSTACK', 'STRIPE', 'PAYPAL').optional(),
  gatewayReference: Joi.string().optional(),
});
