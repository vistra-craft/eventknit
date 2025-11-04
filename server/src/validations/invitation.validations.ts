import Joi from 'joi';
import { InviteType } from '@prisma/client';

/**
 * Create invitation validation schema
 */
export const createInvitation = Joi.object({
  inviteType: Joi.string()
    .valid(...Object.values(InviteType))
    .required()
    .messages({
      'any.only': 'Invalid invite type. Must be one of: ATTENDEE, SPEAKER, EXHIBITOR, GUEST',
      'any.required': 'Invite type is required',
    }),
  title: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Title must not exceed 200 characters',
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  expiresAt: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Expiration date must be in the future',
      'date.format': 'Expiration date must be a valid ISO date string',
    }),
  maxUses: Joi.number()
    .integer()
    .min(1)
    .max(1000000)
    .optional()
    .messages({
      'number.min': 'Max uses must be at least 1',
      'number.max': 'Max uses must not exceed 1,000,000',
      'number.integer': 'Max uses must be an integer',
    }),
});

/**
 * Update invitation validation schema
 */
export const updateInvitation = Joi.object({
  title: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'Title must not exceed 200 characters',
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  expiresAt: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Expiration date must be in the future',
      'date.format': 'Expiration date must be a valid ISO date string',
    }),
  maxUses: Joi.number()
    .integer()
    .min(1)
    .max(1000000)
    .optional()
    .allow(null)
    .messages({
      'number.min': 'Max uses must be at least 1',
      'number.max': 'Max uses must not exceed 1,000,000',
      'number.integer': 'Max uses must be an integer',
    }),
  isActive: Joi.boolean().optional(),
});

/**
 * Register via invitation validation schema
 * This is dynamic based on event registrationFields, so we validate basic structure
 */
export const registerViaInvitation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
    }),
  otherName: Joi.string().trim().max(100).optional().allow(''),
  phoneNumber: Joi.string().trim().max(20).optional().allow(''),
  companyAffiliation: Joi.string().trim().max(200).optional().allow(''),
  ticketType: Joi.string().optional().allow(''),
  quantity: Joi.number().integer().min(1).max(100).optional().default(1),
  // Allow any additional fields for custom registration fields
}).unknown(true);

export const invitationValidations = {
  createInvitation,
  updateInvitation,
  registerViaInvitation,
};

