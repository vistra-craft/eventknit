import Joi from 'joi';

// UserRole enum values (from Prisma schema)
// Will be available after running: npm run prisma:generate
const UserRoleValues = [
  'SUPERADMIN',
  'ADMIN_STAFF',
  'MARKETER',
  'SUPPORT',
  'TELLER',
  'ORGANIZER',
  'ORGANIZER_STAFF',
  'ORGANIZER_TELLER',
  'ATTENDEE',
] as const;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const authValidations = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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
    phoneNumber: Joi.string().trim().optional().allow(''),
    role: Joi.string()
      .valid(...UserRoleValues)
      .required()
      .messages({
        'any.only': 'Invalid role. Must be one of: ATTENDEE, ORGANIZER',
        'any.required': 'Role is required',
      }),
    organizationName: Joi.when('role', {
      is: 'ORGANIZER',
      then: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Organization name is required for organizers',
        'string.max': 'Organization name must not exceed 200 characters',
        'any.required': 'Organization name is required for organizers',
      }),
      otherwise: Joi.optional(),
    }),
    businessEmail: Joi.when('role', {
      is: 'ORGANIZER',
      then: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid business email address',
        'any.required': 'Business email is required for organizers',
      }),
      otherwise: Joi.optional(),
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required',
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
  }),
};

