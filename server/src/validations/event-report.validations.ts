import Joi from 'joi';

const REPORT_CATEGORIES = ['FRAUD_SCAM', 'INAPPROPRIATE', 'SPAM', 'SAFETY', 'WRONG_DETAILS', 'DUPLICATE', 'OTHER'];
const REPORT_STATUSES = ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'];

export const eventReportValidations = {
  createReport: Joi.object({
    category: Joi.string()
      .valid(...REPORT_CATEGORIES)
      .required()
      .messages({
        'any.only': `Category must be one of: ${REPORT_CATEGORIES.join(', ')}`,
        'any.required': 'Category is required',
      }),
    description: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Description must be less than 500 characters',
    }),
  }),

  updateReport: Joi.object({
    status: Joi.string()
      .valid(...REPORT_STATUSES)
      .required()
      .messages({
        'any.only': `Status must be one of: ${REPORT_STATUSES.join(', ')}`,
        'any.required': 'Status is required',
      }),
    reviewNotes: Joi.string().max(5000).optional().allow('').messages({
      'string.max': 'Review notes must be less than 5000 characters',
    }),
  }),

  getReports: Joi.object({
    status: Joi.string().valid(...REPORT_STATUSES).optional(),
    category: Joi.string().valid(...REPORT_CATEGORIES).optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};
