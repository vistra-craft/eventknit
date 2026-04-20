import Joi from 'joi';

// Same password requirements as auth validations
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,128}$/;

export const staffInvitationValidations = {
  inviteStaff: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string()
      .valid(
        'SUPERADMIN',
        'ADMIN',
        'SUPPORT',
        'TELLER',
        'ORGANIZER_ADMIN',
        'ORGANIZER_TELLER',
      )
      .required()
      .messages({
        'any.only': 'Invalid role for staff invitation',
        'any.required': 'Role is required',
      }),
    message: Joi.string().trim().max(500).optional().messages({
      'string.max': 'Message must not exceed 500 characters',
    }),
  }),

  acceptInvitation: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Invitation token is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must be at least 8 characters and contain at least one letter and one number',
        'any.required': 'Password is required',
      }),
    firstName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
    lastName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
    }),
    phoneNumber: Joi.string().trim().max(20).optional().allow('').messages({
      'string.max': 'Phone number must not exceed 20 characters',
    }),
  }),

  validateToken: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Invitation token is required',
    }),
  }),
};
