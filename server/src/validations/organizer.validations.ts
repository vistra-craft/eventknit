import Joi from 'joi';

export const organizerValidations = {
  createStaff: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
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
    phoneNumber: Joi.string().trim().max(20).optional().allow('', null).messages({
      'string.max': 'Phone number must not exceed 20 characters',
    }),
    role: Joi.string()
      .valid('ORGANIZER_ADMIN', 'ORGANIZER_TELLER')
      .required()
      .messages({
        'any.only': 'Role must be either ORGANIZER_ADMIN or ORGANIZER_TELLER',
        'any.required': 'Role is required',
      }),
  }),

  changeStaffRole: Joi.object({
    role: Joi.string()
      .valid('ORGANIZER_ADMIN', 'ORGANIZER_TELLER')
      .required()
      .messages({
        'any.only': 'Role must be either ORGANIZER_ADMIN or ORGANIZER_TELLER',
        'any.required': 'Role is required',
      }),
  }),

  staffIdParam: Joi.object({
    id: Joi.string().trim().required().messages({
      'any.required': 'Staff ID is required',
    }),
  }),
};
