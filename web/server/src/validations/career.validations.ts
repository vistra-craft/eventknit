import Joi from 'joi';

export const careerValidations = {
  submitInquiry: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    source: Joi.string().max(100).optional().messages({
      'string.max': 'Source must be less than 100 characters',
    }),
  }),

  updateInquiry: Joi.object({
    status: Joi.string()
      .valid('PENDING', 'CONTACTED', 'RESPONDED', 'REVIEWING', 'REJECTED', 'HIRED')
      .required()
      .messages({
        'any.only': 'Status must be one of: PENDING, CONTACTED, RESPONDED, REVIEWING, REJECTED, HIRED',
        'any.required': 'Status is required',
      }),
    notes: Joi.string().max(5000).optional().messages({
      'string.max': 'Notes must be less than 5000 characters',
    }),
  }),

  getInquiries: Joi.object({
    status: Joi.string()
      .valid('PENDING', 'CONTACTED', 'RESPONDED', 'REVIEWING', 'REJECTED', 'HIRED')
      .optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};
