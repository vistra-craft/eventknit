import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  templateId: Joi.string().uuid().optional(),
  includeTax: Joi.boolean().optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  terms: Joi.string().optional(),
});

export const markInvoiceAsSentSchema = Joi.object({
  sentTo: Joi.string().email().required(),
});

export const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED').required(),
});

export const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('STANDARD', 'MINIMAL', 'DETAILED', 'CUSTOM').optional(),
  htmlContent: Joi.string().required(),
  cssContent: Joi.string().optional(),
  variables: Joi.object().optional(),
  isDefault: Joi.boolean().optional(),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  type: Joi.string().valid('STANDARD', 'MINIMAL', 'DETAILED', 'CUSTOM').optional(),
  htmlContent: Joi.string().optional(),
  cssContent: Joi.string().optional().allow(null),
  variables: Joi.object().optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});
