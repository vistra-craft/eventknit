import Joi from 'joi';

export const calculateTaxSchema = Joi.object({
  amount: Joi.number().positive().required(),
  country: Joi.string().required(),
  state: Joi.string().optional(),
  city: Joi.string().optional(),
});

export const upsertTaxRateSchema = Joi.object({
  country: Joi.string().required(),
  state: Joi.string().optional().allow(null),
  city: Joi.string().optional().allow(null),
  rate: Joi.number().min(0).max(100).required(),
  taxType: Joi.string().valid('VAT', 'GST', 'SALES_TAX', 'SERVICE_TAX', 'OTHER').optional(),
  isActive: Joi.boolean().optional(),
});
