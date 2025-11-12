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
  requestRegistrationCode: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string()
      .valid('ATTENDEE', 'ORGANIZER')
      .optional()
      .default('ATTENDEE')
      .messages({
        'any.only': 'Role must be either ATTENDEE or ORGANIZER',
      }),
  }),

  verifyRegistrationCode: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only digits',
      'any.required': 'Verification code is required',
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
    otherName: Joi.string().trim().min(1).max(100).optional().allow('', null).messages({
      'string.max': 'Other name must not exceed 100 characters',
    }),
    phoneNumber: Joi.string().trim().optional().allow('', null),
    companyAffiliation: Joi.string().trim().min(1).max(200).optional().allow('', null).messages({
      'string.max': 'Company affiliation must not exceed 200 characters',
    }),
    role: Joi.string()
      .valid(...UserRoleValues)
      .optional()
      .default('ATTENDEE')
      .messages({
        'any.only': 'Invalid role. Must be one of: ATTENDEE, ORGANIZER, etc.',
      }),
    organizationName: Joi.string().trim().min(1).max(200).optional().allow('', null).messages({
      'string.max': 'Organization name must not exceed 200 characters',
    }),
    businessEmail: Joi.string().email().optional().allow('', null).messages({
      'string.email': 'Please provide a valid business email address',
    }),
  }),

  requestEmailOAuthCode: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string()
      .valid('ATTENDEE', 'ORGANIZER')
      .optional()
      .default('ATTENDEE')
      .messages({
        'any.only': 'Role must be either ATTENDEE or ORGANIZER',
      }),
  }),

  verifyEmailOAuthCode: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only digits',
      'any.required': 'Verification code is required',
    }),
  }),

  facebookAuth: Joi.object({
    accessToken: Joi.string().required().messages({
      'any.required': 'Facebook access token is required',
    }),
    role: Joi.string()
      .valid('ATTENDEE', 'ORGANIZER')
      .optional()
      .default('ATTENDEE')
      .messages({
        'any.only': 'Role must be either ATTENDEE or ORGANIZER',
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
    refreshToken: Joi.string().optional().allow(null, '').messages({
      'string.base': 'Refresh token must be a string',
    }),
  }).unknown(true), // Allow empty body since token comes from cookie (cookie is primary source)

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

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),
  }),

  requestEmailVerification: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  confirmEmailVerification: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only digits',
      'any.required': 'Verification code is required',
    }),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional().messages({
      'string.max': 'First name must not exceed 100 characters',
    }),
    lastName: Joi.string().trim().min(1).max(100).optional().messages({
      'string.max': 'Last name must not exceed 100 characters',
    }),
    otherName: Joi.string().trim().min(1).max(100).optional().allow(null, '').messages({
      'string.max': 'Other name must not exceed 100 characters',
    }),
    phoneNumber: Joi.string().trim().optional().allow(null, ''),
    companyAffiliation: Joi.string().trim().min(1).max(200).optional().allow(null, '').messages({
      'string.max': 'Company affiliation must not exceed 200 characters',
    }),
    organizationName: Joi.string().trim().min(1).max(200).optional().allow(null, ''),
    businessEmail: Joi.string().email().optional().allow(null, '').messages({
      'string.email': 'Please provide a valid business email address',
    }),
  }),

  requestMagicLink: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  verifyMagicLink: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token is required',
    }),
  }),

  createAccountFromInvitation: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Invitation token is required',
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

  resendAccountInvitation: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),
};

