import Joi from 'joi';

export const createApiKeySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).min(1).required(),
  rateLimit: Joi.number().integer().min(1).max(10000).optional(),
  rateLimitWindow: Joi.number().integer().min(60).max(86400).optional(), // 1 minute to 24 hours
  expiresAt: Joi.date().optional(),
});

export const updateApiKeySchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(null),
  permissions: Joi.array().items(Joi.string()).min(1).optional(),
  rateLimit: Joi.number().integer().min(1).max(10000).optional(),
  rateLimitWindow: Joi.number().integer().min(60).max(86400).optional(),
  expiresAt: Joi.date().optional().allow(null),
  isActive: Joi.boolean().optional(),
});
