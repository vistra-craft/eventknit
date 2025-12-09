import Joi from 'joi';

export const createEndpointSchema = Joi.object({
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
  description: Joi.string().optional(),
  eventTypes: Joi.array().items(Joi.string()).min(1).required(),
  secret: Joi.string().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  maxRetries: Joi.number().integer().min(0).max(10).optional(),
  retryDelay: Joi.number().integer().min(100).max(60000).optional(),
});

export const updateEndpointSchema = Joi.object({
  name: Joi.string().optional(),
  url: Joi.string().uri().optional(),
  description: Joi.string().optional().allow(null),
  eventTypes: Joi.array().items(Joi.string()).min(1).optional(),
  secret: Joi.string().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).optional().allow(null),
  maxRetries: Joi.number().integer().min(0).max(10).optional(),
  retryDelay: Joi.number().integer().min(100).max(60000).optional(),
  isActive: Joi.boolean().optional(),
});
