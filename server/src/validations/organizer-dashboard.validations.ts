import Joi from 'joi';

export const organizerDashboardValidations = {
  // Event Template validations
  createTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Template name must be at least 1 character long',
      'string.max': 'Template name must not exceed 100 characters',
      'any.required': 'Template name is required',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    category: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional().messages({
      'array.max': 'Too many tags',
    }),
    templateData: Joi.object().required().messages({
      'any.required': 'Template data is required',
    }),
    isPublic: Joi.boolean().optional().default(false),
    thumbnail: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Thumbnail must be a valid URL',
    }),
  }),

  updateTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'Template name must be at least 1 character long',
      'string.max': 'Template name must not exceed 100 characters',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    category: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional().messages({
      'array.max': 'Too many tags',
    }),
    templateData: Joi.object().optional(),
    isPublic: Joi.boolean().optional(),
    thumbnail: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Thumbnail must be a valid URL',
    }),
  }),

  createTemplateVersion: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'Template name must be at least 1 character long',
      'string.max': 'Template name must not exceed 100 characters',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    templateData: Joi.object().optional(),
  }),

  createTemplateFromEvent: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Template name must be at least 1 character long',
      'string.max': 'Template name must not exceed 100 characters',
      'any.required': 'Template name is required',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  }),

  templatesQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string().trim().max(100).optional(),
    search: Joi.string().trim().max(200).optional(),
  }),

  // Event Draft validations
  createDraft: Joi.object({
    draftData: Joi.object().required().messages({
      'any.required': 'Draft data is required',
    }),
    collaborators: Joi.array().items(Joi.string().uuid()).optional().messages({
      'array.max': 'Too many collaborators',
    }),
  }),

  updateDraft: Joi.object({
    draftData: Joi.object().optional(),
    collaborators: Joi.array().items(Joi.string().uuid()).optional().messages({
      'array.max': 'Too many collaborators',
    }),
  }),

  createDraftVersion: Joi.object({
    draftData: Joi.object().optional(),
  }),

  scheduleDraft: Joi.object({
    scheduledPublishAt: Joi.date().iso().required().messages({
      'date.base': 'Scheduled publish date must be a valid date',
      'any.required': 'Scheduled publish date is required',
    }),
  }),

  // Event Session validations
  createSession: Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
      'string.min': 'Session title must be at least 1 character long',
      'string.max': 'Session title must not exceed 200 characters',
      'any.required': 'Session title is required',
    }),
    dayOfEvent: Joi.number().integer().min(1).required().messages({
      'number.base': 'Day of event must be a number',
      'number.min': 'Day of event must be at least 1',
      'any.required': 'Day of event is required',
    }),
    startTime: Joi.date().iso().required().messages({
      'date.base': 'Start time must be a valid date',
      'any.required': 'Start time is required',
    }),
    endTime: Joi.date().iso().required().messages({
      'date.base': 'End time must be a valid date',
      'any.required': 'End time is required',
    }),
    location: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Location must not exceed 200 characters',
    }),
    capacity: Joi.number().integer().min(1).optional().allow(null).messages({
      'number.base': 'Capacity must be a number',
      'number.min': 'Capacity must be at least 1',
    }),
  }),

  updateSession: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional().messages({
      'string.min': 'Session title must be at least 1 character long',
      'string.max': 'Session title must not exceed 200 characters',
    }),
    dayOfEvent: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Day of event must be a number',
      'number.min': 'Day of event must be at least 1',
    }),
    startTime: Joi.date().iso().optional().messages({
      'date.base': 'Start time must be a valid date',
    }),
    endTime: Joi.date().iso().optional().messages({
      'date.base': 'End time must be a valid date',
    }),
    location: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Location must not exceed 200 characters',
    }),
    capacity: Joi.number().integer().min(1).optional().allow(null).messages({
      'number.base': 'Capacity must be a number',
      'number.min': 'Capacity must be at least 1',
    }),
  }),

  sessionsQuery: Joi.object({
    dayOfEvent: Joi.number().integer().min(1).optional(),
  }),

  // Attendee Segmentation validations
  createSegment: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Segment name must be at least 1 character long',
      'string.max': 'Segment name must not exceed 100 characters',
      'any.required': 'Segment name is required',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    criteria: Joi.object().required().messages({
      'any.required': 'Segment criteria is required',
    }),
    isDynamic: Joi.boolean().optional().default(true),
  }),

  updateSegment: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.min': 'Segment name must be at least 1 character long',
      'string.max': 'Segment name must not exceed 100 characters',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    criteria: Joi.object().optional(),
    isDynamic: Joi.boolean().optional(),
  }),

  addMemberToSegment: Joi.object({
    userId: Joi.string().uuid().required().messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  }),

  segmentsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
  }),

  // Attendee Tag validations
  createTag: Joi.object({
    name: Joi.string().trim().min(1).max(50).required().messages({
      'string.min': 'Tag name must be at least 1 character long',
      'string.max': 'Tag name must not exceed 50 characters',
      'any.required': 'Tag name is required',
    }),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().messages({
      'string.pattern.base': 'Color must be a valid hex color code',
    }),
    description: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  }),

  updateTag: Joi.object({
    name: Joi.string().trim().min(1).max(50).optional().messages({
      'string.min': 'Tag name must be at least 1 character long',
      'string.max': 'Tag name must not exceed 50 characters',
    }),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().messages({
      'string.pattern.base': 'Color must be a valid hex color code',
    }),
    description: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  }),

  tagUser: Joi.object({
    userId: Joi.string().uuid().required().messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    notes: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
  }),

  taggedUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
  }),

  // Communication validations
  sendMessage: Joi.object({
    subject: Joi.string().trim().min(1).max(200).required().messages({
      'string.min': 'Subject must be at least 1 character long',
      'string.max': 'Subject must not exceed 200 characters',
      'any.required': 'Subject is required',
    }),
    content: Joi.string().trim().min(1).max(10000).required().messages({
      'string.min': 'Content must be at least 1 character long',
      'string.max': 'Content must not exceed 10000 characters',
      'any.required': 'Content is required',
    }),
    sendEmail: Joi.boolean().optional().default(false),
    sendNotification: Joi.boolean().optional().default(true),
    registrationIds: Joi.array().items(Joi.string().uuid()).optional().messages({
      'array.max': 'Too many registration IDs',
    }),
  }),

  communicationHistoryQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    segmentId: Joi.string().uuid().optional().messages({
      'string.guid': 'Segment ID must be a valid UUID',
    }),
    tagId: Joi.string().uuid().optional().messages({
      'string.guid': 'Tag ID must be a valid UUID',
    }),
  }),

  // Analytics query validations
  analyticsQuery: Joi.object({
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
  }),

  revenueAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
  }),

  attendeeInsightsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
  }),

  marketingAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
  }),

  checkoutAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    startDate: Joi.date().iso().optional().messages({
      'date.format': 'Start date must be a valid ISO date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.format': 'End date must be a valid ISO date',
    }),
  }),

  abandonmentAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
  }),

  // Common pagination query
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

  // Advanced Promo Code validations
  createPromoCodeVariant: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Variant name must be at least 1 character long',
      'string.max': 'Variant name must not exceed 100 characters',
      'any.required': 'Variant name is required',
    }),
    code: Joi.string().trim().min(3).max(50).required().messages({
      'string.min': 'Variant code must be at least 3 characters long',
      'string.max': 'Variant code must not exceed 50 characters',
      'any.required': 'Variant code is required',
    }),
    discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required().messages({
      'any.only': 'Discount type must be PERCENTAGE or FIXED_AMOUNT',
      'any.required': 'Discount type is required',
    }),
    discountValue: Joi.number().min(0).required().messages({
      'number.min': 'Discount value must be greater than or equal to 0',
      'any.required': 'Discount value is required',
    }),
    trafficPercentage: Joi.number().integer().min(0).max(100).optional().messages({
      'number.min': 'Traffic percentage must be between 0 and 100',
      'number.max': 'Traffic percentage must be between 0 and 100',
    }),
    isControl: Joi.boolean().optional().default(false),
  }),

  promoCodeAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
  }),

  // Financial validations
  createExpense: Joi.object({
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    category: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Category must be at least 1 character long',
      'string.max': 'Category must not exceed 100 characters',
      'any.required': 'Category is required',
    }),
    description: Joi.string().trim().min(1).max(2000).required().messages({
      'string.min': 'Description must be at least 1 character long',
      'string.max': 'Description must not exceed 2000 characters',
      'any.required': 'Description is required',
    }),
    amount: Joi.number().min(0).required().messages({
      'number.min': 'Amount must be greater than or equal to 0',
      'any.required': 'Amount is required',
    }),
    currency: Joi.string().trim().max(10).optional().default('NGN').messages({
      'string.max': 'Currency must not exceed 10 characters',
    }),
    receiptUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Receipt URL must be a valid URL',
    }),
    receiptDate: Joi.date().iso().optional().messages({
      'date.base': 'Receipt date must be a valid date',
    }),
    taxAmount: Joi.number().min(0).optional().messages({
      'number.min': 'Tax amount must be greater than or equal to 0',
    }),
    taxRate: Joi.number().min(0).max(100).optional().messages({
      'number.min': 'Tax rate must be between 0 and 100',
      'number.max': 'Tax rate must be between 0 and 100',
    }),
    isTaxDeductible: Joi.boolean().optional().default(false),
    expenseDate: Joi.date().iso().optional().messages({
      'date.base': 'Expense date must be a valid date',
    }),
  }),

  expensesQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    category: Joi.string().trim().max(100).optional(),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'paid').optional(),
  }),

  financialQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
  }),

  createFinancialGoal: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'string.min': 'Goal name must be at least 1 character long',
      'string.max': 'Goal name must not exceed 200 characters',
      'any.required': 'Goal name is required',
    }),
    description: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    targetAmount: Joi.number().min(0).required().messages({
      'number.min': 'Target amount must be greater than or equal to 0',
      'any.required': 'Target amount is required',
    }),
    currency: Joi.string().trim().max(10).optional().default('NGN').messages({
      'string.max': 'Currency must not exceed 10 characters',
    }),
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    startDate: Joi.date().iso().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required',
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required',
    }),
  }),

  financialGoalsQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    status: Joi.string().valid('active', 'completed', 'cancelled').optional(),
  }),

  taxSummaryQuery: Joi.object({
    eventId: Joi.string().uuid().optional().messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    year: Joi.number().integer().min(2000).max(2100).optional().messages({
      'number.min': 'Year must be at least 2000',
      'number.max': 'Year must not exceed 2100',
    }),
  }),

  // Payout validations
  updatePayoutPreferences: Joi.object({
    primaryMethod: Joi.string().trim().max(50).optional().messages({
      'string.max': 'Primary method must not exceed 50 characters',
    }),
    bankName: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Bank name must not exceed 200 characters',
    }),
    accountName: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Account name must not exceed 200 characters',
    }),
    accountNumber: Joi.string().trim().max(50).optional().allow('', null).messages({
      'string.max': 'Account number must not exceed 50 characters',
    }),
    bankCode: Joi.string().trim().max(20).optional().allow('', null).messages({
      'string.max': 'Bank code must not exceed 20 characters',
    }),
    routingNumber: Joi.string().trim().max(50).optional().allow('', null).messages({
      'string.max': 'Routing number must not exceed 50 characters',
    }),
    paystackRecipientCode: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Paystack recipient code must not exceed 100 characters',
    }),
    alternativeMethods: Joi.object().optional(),
    autoPayoutEnabled: Joi.boolean().optional(),
    autoPayoutThreshold: Joi.number().min(0).optional().messages({
      'number.min': 'Auto-payout threshold must be greater than or equal to 0',
    }),
    autoPayoutSchedule: Joi.string().valid('daily', 'weekly', 'monthly').optional().messages({
      'any.only': 'Auto-payout schedule must be daily, weekly, or monthly',
    }),
    taxId: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Tax ID must not exceed 100 characters',
    }),
    taxCountry: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Tax country must not exceed 100 characters',
    }),
  }),

  schedulePayout: Joi.object({
    eventId: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Event ID must be a valid UUID',
    }),
    amount: Joi.number().min(0).optional().messages({
      'number.min': 'Amount must be greater than or equal to 0',
    }),
    scheduledDate: Joi.date().iso().required().messages({
      'date.base': 'Scheduled date must be a valid date',
      'any.required': 'Scheduled date is required',
    }),
    notes: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Notes must not exceed 1000 characters',
    }),
  }),

  payoutHistoryQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled').optional(),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
    }),
  }),

  // Event Collaboration validations
  inviteCollaborator: Joi.object({
    collaboratorId: Joi.string().uuid().required().messages({
      'string.guid': 'Collaborator ID must be a valid UUID',
      'any.required': 'Collaborator ID is required',
    }),
    role: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Role must not exceed 100 characters',
    }),
    canEdit: Joi.boolean().optional().default(false),
    canManageAttendees: Joi.boolean().optional().default(false),
    canManageTickets: Joi.boolean().optional().default(false),
    canViewAnalytics: Joi.boolean().optional().default(true),
    canManageStaff: Joi.boolean().optional().default(false),
    canPublish: Joi.boolean().optional().default(false),
  }),

  updateCollaboratorPermissions: Joi.object({
    role: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Role must not exceed 100 characters',
    }),
    canEdit: Joi.boolean().optional(),
    canManageAttendees: Joi.boolean().optional(),
    canManageTickets: Joi.boolean().optional(),
    canViewAnalytics: Joi.boolean().optional(),
    canManageStaff: Joi.boolean().optional(),
    canPublish: Joi.boolean().optional(),
  }),

  activityLogQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    action: Joi.string().trim().max(100).optional(),
    userId: Joi.string().uuid().optional().messages({
      'string.guid': 'User ID must be a valid UUID',
    }),
  }),

  // Phase 3: Advanced Ticket Types
  createTicketPackage: Joi.object({
    eventId: Joi.string().uuid().required().messages({
      'string.guid': 'Event ID must be a valid UUID',
      'any.required': 'Event ID is required',
    }),
    name: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional().allow('', null),
    type: Joi.string().valid('group', 'bundle', 'donation').required(),
    price: Joi.number().min(0).optional(),
    minQuantity: Joi.number().integer().min(1).optional(),
    maxQuantity: Joi.number().integer().min(1).optional(),
    bundleItems: Joi.array().optional(),
    isDonation: Joi.boolean().optional(),
    minDonation: Joi.number().min(0).optional(),
    maxDonation: Joi.number().min(0).optional(),
    suggestedAmounts: Joi.array().items(Joi.number().min(0)).optional(),
    hasReservedSeating: Joi.boolean().optional(),
    seatingChart: Joi.object().optional(),
    availableFrom: Joi.date().iso().optional(),
    availableUntil: Joi.date().iso().optional(),
    quantity: Joi.number().integer().min(0).optional(),
  }),

  updateTicketPackage: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).optional().allow('', null),
    price: Joi.number().min(0).optional(),
    minQuantity: Joi.number().integer().min(1).optional(),
    maxQuantity: Joi.number().integer().min(1).optional(),
    bundleItems: Joi.array().optional(),
    minDonation: Joi.number().min(0).optional(),
    maxDonation: Joi.number().min(0).optional(),
    suggestedAmounts: Joi.array().items(Joi.number().min(0)).optional(),
    hasReservedSeating: Joi.boolean().optional(),
    seatingChart: Joi.object().optional(),
    availableFrom: Joi.date().iso().optional(),
    availableUntil: Joi.date().iso().optional(),
    quantity: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }),

  ticketPackagesQuery: Joi.object({
    type: Joi.string().valid('group', 'bundle', 'donation').optional(),
    isActive: Joi.boolean().optional(),
  }),

  // Phase 3: Dynamic Pricing
  createPricingRule: Joi.object({
    eventId: Joi.string().uuid().required(),
    name: Joi.string().trim().min(1).max(200).required(),
    type: Joi.string().valid('time_based', 'demand_based', 'group_discount', 'loyalty').required(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    demandThreshold: Joi.number().integer().min(0).max(100).optional(),
    priceMultiplier: Joi.number().min(0.1).max(10).optional(),
    minGroupSize: Joi.number().integer().min(2).optional(),
    discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').optional(),
    discountValue: Joi.number().min(0).optional(),
    loyaltyTierId: Joi.string().uuid().optional(),
    loyaltyDiscount: Joi.number().min(0).max(100).optional(),
    applicableTicketTypes: Joi.array().items(Joi.string()).optional(),
    priority: Joi.number().integer().optional().default(0),
  }),

  updatePricingRule: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    demandThreshold: Joi.number().integer().min(0).max(100).optional(),
    priceMultiplier: Joi.number().min(0.1).max(10).optional(),
    minGroupSize: Joi.number().integer().min(2).optional(),
    discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').optional(),
    discountValue: Joi.number().min(0).optional(),
    loyaltyDiscount: Joi.number().min(0).max(100).optional(),
    applicableTicketTypes: Joi.array().items(Joi.string()).optional(),
    priority: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional(),
  }),

  pricingRulesQuery: Joi.object({
    type: Joi.string().valid('time_based', 'demand_based', 'group_discount', 'loyalty').optional(),
    isActive: Joi.boolean().optional(),
  }),

  calculatePriceQuery: Joi.object({
    ticketType: Joi.string().trim().required(),
    quantity: Joi.number().integer().min(1).required(),
  }),

  // Phase 3: Affiliate Program
  createAffiliateProgram: Joi.object({
    eventId: Joi.string().uuid().optional().allow(null),
    name: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional().allow('', null),
    commissionType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required(),
    commissionValue: Joi.number().min(0).required(),
    minCommission: Joi.number().min(0).optional(),
    maxCommission: Joi.number().min(0).optional(),
    cookieDuration: Joi.number().integer().min(1).max(365).optional().default(30),
  }),

  affiliateProgramsQuery: Joi.object({
    eventId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
  }),

  affiliateConversionsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'approved', 'paid').optional(),
  }),

  // Phase 3: Email Marketing
  createEmailCampaign: Joi.object({
    eventId: Joi.string().uuid().optional().allow(null),
    name: Joi.string().trim().min(1).max(200).required(),
    subject: Joi.string().trim().min(1).max(200).required(),
    content: Joi.string().trim().min(1).required(),
    plainText: Joi.string().trim().optional().allow('', null),
    recipientType: Joi.string().valid('all', 'segment', 'tag', 'event_registrations').required(),
    segmentId: Joi.string().uuid().optional().allow(null),
    tagId: Joi.string().uuid().optional().allow(null),
    scheduledAt: Joi.date().iso().optional(),
  }),

  emailCampaignsQuery: Joi.object({
    eventId: Joi.string().uuid().optional(),
    status: Joi.string().valid('draft', 'scheduled', 'sending', 'sent', 'cancelled').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  // Phase 3: Social Media
  createSocialPost: Joi.object({
    eventId: Joi.string().uuid().optional().allow(null),
    platform: Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin').required(),
    content: Joi.string().trim().min(1).max(5000).required(),
    mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
    scheduledAt: Joi.date().iso().optional(),
  }),

  socialPostsQuery: Joi.object({
    eventId: Joi.string().uuid().optional(),
    platform: Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin').optional(),
    status: Joi.string().valid('draft', 'scheduled', 'posted', 'failed').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  socialMediaAnalyticsQuery: Joi.object({
    eventId: Joi.string().uuid().optional(),
    platform: Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),

  // Phase 3: Advanced Team Features
  createRoleTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional().allow('', null),
    permissionKeys: Joi.array().items(Joi.string().trim()).optional(), // New granular permissions
    // Legacy permissions (kept for backward compatibility)
    canEdit: Joi.boolean().optional().default(false),
    canManageAttendees: Joi.boolean().optional().default(false),
    canManageTickets: Joi.boolean().optional().default(false),
    canViewAnalytics: Joi.boolean().optional().default(true),
    canManageStaff: Joi.boolean().optional().default(false),
    canPublish: Joi.boolean().optional().default(false),
    canManageCollaborators: Joi.boolean().optional().default(false),
  }),

  updateRoleTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).optional().allow('', null),
    permissionKeys: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean().optional(),
  }),

  duplicateRoleTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
  }),

  roleTemplatesQuery: Joi.object({
    isActive: Joi.boolean().optional(),
  }),

  teamActivityQuery: Joi.object({
    eventId: Joi.string().uuid().optional(),
    userId: Joi.string().uuid().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  teamMetricsQuery: Joi.object({
    userId: Joi.string().uuid().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),

  // Subscription Management
  upgradeSubscription: Joi.object({
    tier: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM').required(),
    billingEmail: Joi.string().email().when('tier', {
      is: 'PREMIUM',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, ''),
    }),
  }),

  downgradeSubscription: Joi.object({
    tier: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM').required(),
  }),

  // KYC validations
  setEntityType: Joi.object({
    entityType: Joi.string()
      .valid(
        'INDIVIDUAL', 'SOLE_PROPRIETOR', 'PARTNERSHIP',
        'LIMITED_LIABILITY_COMPANY', 'LIMITED_LIABILITY_PARTNERSHIP',
        'EMPLOYMENT_AGENCY_LLC', 'FOREIGN_COMPANY_COMPLIANCE',
        'PRIVATE_HOSPITAL_SOLE_PROPRIETOR', 'PRIVATE_HOSPITAL_LLC', 'PUBLIC_HOSPITAL',
        'PRIVATE_EDUCATION_SOLE_PROPRIETOR', 'PRIVATE_EDUCATION_LLC',
        'INTERNATIONAL_EDUCATION_LLC', 'PUBLIC_EDUCATION',
        'COOPERATIVE_SOCIETY', 'INSURANCE_REINSURANCE',
        'NGO', 'EMBASSY_UN_WORLD_BANK', 'DENOMINATIONAL_CHURCH',
        'PARTNERSHIP_PROFESSIONAL', 'TRUST', 'OTHER',
      )
      .required()
      .messages({
        'any.only': 'Invalid entity type',
        'any.required': 'Entity type is required',
      }),
    industry: Joi.string().trim().max(100).optional().allow('', null),
    businessName: Joi.string().trim().max(200).optional().allow('', null),
    registrationNumber: Joi.string().trim().max(100).optional().allow('', null),
  }),

  createKYCDocument: Joi.object({
    documentType: Joi.string().required().messages({
      'any.required': 'Document type is required',
    }),
    documentNumber: Joi.string().trim().max(100).optional().allow('', null),
    documentUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Document URL must be a valid URL',
    }),
    issueDate: Joi.date().iso().optional().allow(null),
    expiryDate: Joi.date().iso().optional().allow(null),
  }),

  createDirector: Joi.object({
    fullName: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Full name is required',
      'any.required': 'Full name is required',
    }),
    nationality: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Nationality is required',
      'any.required': 'Nationality is required',
    }),
    dateOfBirth: Joi.date().iso().required().messages({
      'any.required': 'Date of birth is required',
    }),
    documentType: Joi.string().trim().min(1).max(100).required().messages({
      'any.required': 'Document type is required',
    }),
    documentNumber: Joi.string().trim().min(1).max(100).required().messages({
      'any.required': 'Document number is required',
    }),
    kraPin: Joi.string().trim().max(50).optional().allow('', null),
    sharePercentage: Joi.number().min(0).max(100).optional().allow(null),
    position: Joi.string().trim().max(100).optional().allow('', null),
  }),

  // Subscription payment validation
  initializeSubscriptionPayment: Joi.object({
    tier: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM').required().messages({
      'any.only': 'Tier must be BASIC, STANDARD, or PREMIUM',
      'any.required': 'Subscription tier is required',
    }),
    billingEmail: Joi.string().trim().email().optional().allow('', null).messages({
      'string.email': 'Please provide a valid billing email',
    }),
  }),
};
