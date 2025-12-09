import Joi from 'joi';

export const userDashboardValidations = {
  // Review validations
  createReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5',
      'any.required': 'Rating is required',
    }),
    title: Joi.string().trim().min(3).max(200).optional().allow('', null).messages({
      'string.min': 'Review title must be at least 3 characters long',
      'string.max': 'Review title must not exceed 200 characters',
    }),
    review: Joi.string().trim().min(10).max(5000).optional().allow('', null).messages({
      'string.min': 'Review must be at least 10 characters long',
      'string.max': 'Review must not exceed 5000 characters',
    }),
    pros: Joi.array().items(Joi.string().trim().max(200)).optional().messages({
      'array.max': 'Too many pros',
    }),
    cons: Joi.array().items(Joi.string().trim().max(200)).optional().messages({
      'array.max': 'Too many cons',
    }),
    registrationId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Registration ID must be a valid UUID',
    }),
  }),

  // Ticket Transfer validations
  initiateTransfer: Joi.object({
    toUserId: Joi.string().uuid().optional().messages({
      'string.guid': 'User ID must be a valid UUID',
    }),
    toEmail: Joi.string().email().optional().messages({
      'string.email': 'Email must be a valid email address',
    }),
    message: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Message must not exceed 500 characters',
    }),
  }).or('toUserId', 'toEmail').messages({
    'object.missing': 'Either toUserId or toEmail must be provided',
  }),

  // Event Collection validations
  createCollection: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Collection name must be at least 1 character long',
      'string.max': 'Collection name must not exceed 100 characters',
      'any.required': 'Collection name is required',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    isPublic: Joi.boolean().optional().default(false),
    coverImage: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Cover image must be a valid URL',
    }),
  }),

  updateCollection: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'Collection name must be at least 1 character long',
      'string.max': 'Collection name must not exceed 100 characters',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    isPublic: Joi.boolean().optional(),
    coverImage: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Cover image must be a valid URL',
    }),
  }),

  addEventToCollection: Joi.object({
    notes: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
  }),

  // User Interest validations
  upsertInterest: Joi.object({
    category: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Category must be at least 1 character long',
      'string.max': 'Category must not exceed 100 characters',
      'any.required': 'Category is required',
    }),
    subcategory: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Subcategory must not exceed 100 characters',
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional().messages({
      'array.max': 'Too many tags',
    }),
    weight: Joi.number().integer().min(1).max(10).optional().default(1).messages({
      'number.min': 'Weight must be between 1 and 10',
      'number.max': 'Weight must be between 1 and 10',
    }),
  }),

  updateInterestWeight: Joi.object({
    weight: Joi.number().integer().min(1).max(10).required().messages({
      'number.min': 'Weight must be between 1 and 10',
      'number.max': 'Weight must be between 1 and 10',
      'any.required': 'Weight is required',
    }),
  }),

  // Saved Search validations
  createSavedSearch: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Search name must be at least 1 character long',
      'string.max': 'Search name must not exceed 100 characters',
      'any.required': 'Search name is required',
    }),
    searchQuery: Joi.string().trim().min(1).max(1000).required().messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query must not exceed 1000 characters',
      'any.required': 'Search query is required',
    }),
    filters: Joi.object().optional(),
    notifyOnNewEvents: Joi.boolean().optional().default(false),
    notificationFrequency: Joi.string().valid('DAILY', 'WEEKLY', 'NEVER').optional().default('DAILY').messages({
      'any.only': 'Notification frequency must be DAILY, WEEKLY, or NEVER',
    }),
  }),

  updateSavedSearch: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'Search name must be at least 1 character long',
      'string.max': 'Search name must not exceed 100 characters',
    }),
    searchQuery: Joi.string().trim().min(1).max(1000).optional().messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query must not exceed 1000 characters',
    }),
    filters: Joi.object().optional(),
    notifyOnNewEvents: Joi.boolean().optional(),
    notificationFrequency: Joi.string().valid('DAILY', 'WEEKLY', 'NEVER').optional().messages({
      'any.only': 'Notification frequency must be DAILY, WEEKLY, or NEVER',
    }),
  }),

  // Direct Message validations
  sendMessage: Joi.object({
    recipientId: Joi.string().uuid().required().messages({
      'string.guid': 'Recipient ID must be a valid UUID',
      'any.required': 'Recipient ID is required',
    }),
    subject: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Subject must not exceed 200 characters',
    }),
    content: Joi.string().trim().min(1).max(5000).required().messages({
      'string.min': 'Message content must be at least 1 character long',
      'string.max': 'Message content must not exceed 5000 characters',
      'any.required': 'Message content is required',
    }),
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    registrationId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Registration ID must be a valid UUID',
    }),
    parentMessageId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Parent message ID must be a valid UUID',
    }),
  }),

  // Event Share validations
  trackShare: Joi.object({
    platform: Joi.string().trim().min(1).max(50).required().messages({
      'string.min': 'Platform must be at least 1 character long',
      'string.max': 'Platform must not exceed 50 characters',
      'any.required': 'Platform is required',
    }),
    shareUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Share URL must be a valid URL',
    }),
    referrer: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Referrer must not exceed 500 characters',
    }),
  }),

  // Query parameter validations
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.min': 'Page must be at least 1',
      'number.base': 'Page must be a valid number',
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
      'number.base': 'Limit must be a valid number',
    }),
  }),

  // Reviews query
  reviewsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    rating: Joi.number().integer().min(1).max(5).optional(),
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED').optional(),
  }),

  // Activity history query
  activityHistoryQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    activityType: Joi.string().trim().max(50).optional(),
  }),

  // Transfer history query
  transferHistoryQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().valid('sent', 'received').optional(),
  }),

  // Collections query
  collectionsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  // Messages query
  messagesQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    isRead: Joi.boolean().optional(),
  }),

  // Social networking query
  socialQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  // Recommendations query
  recommendationsQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional().messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 50',
    }),
  }),
};
