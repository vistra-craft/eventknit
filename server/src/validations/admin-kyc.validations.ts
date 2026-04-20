import Joi from 'joi';

export const adminKYCValidations = {
  rejectDocument: Joi.object({
    rejectionReason: Joi.string().required().min(10).max(500)
      .messages({
        'string.min': 'Rejection reason must be at least 10 characters',
        'string.max': 'Rejection reason must be at most 500 characters',
        'any.required': 'Rejection reason is required',
      }),
  }),

  rejectOrganizer: Joi.object({
    reason: Joi.string().required().min(10).max(500)
      .messages({
        'string.min': 'Rejection reason must be at least 10 characters',
        'string.max': 'Rejection reason must be at most 500 characters',
        'any.required': 'Rejection reason is required',
      }),
  }),

  listFilters: Joi.object({
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
    entityType: Joi.string().optional(),
    search: Joi.string().optional().allow(''),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('kycSubmittedAt', 'createdAt', 'firstName', 'email').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
};
