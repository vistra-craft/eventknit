import Joi from 'joi';

// Ticket Resale Validations
export const listTicketForResaleSchema = Joi.object({
  registrationId: Joi.string().uuid().required(),
  resalePrice: Joi.number().positive().required(),
  expiresAt: Joi.date().optional(),
});

export const purchaseResaleTicketSchema = Joi.object({
  resaleId: Joi.string().uuid().required(),
});

// Digital Wallet Validations
export const addTicketToWalletSchema = Joi.object({
  registrationId: Joi.string().uuid().required(),
});

export const updateWalletPreferencesSchema = Joi.object({
  autoAddTickets: Joi.boolean().optional(),
  backupEnabled: Joi.boolean().optional(),
});

// Event Calendar Validations
export const syncToCalendarSchema = Joi.object({
  registrationId: Joi.string().uuid().required(),
  calendarType: Joi.string().valid('GOOGLE', 'APPLE', 'OUTLOOK', 'ICAL').required(),
  reminderMinutes: Joi.number().integer().min(0).max(10080).optional(), // Max 7 days
});

// Personal Event Feed Validations
export const updateFeedPreferencesSchema = Joi.object({
  preferences: Joi.object().optional(),
  filters: Joi.object().optional(),
});

// Event Updates Subscription Validations
export const subscribeToEventSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  updateTypes: Joi.array()
    .items(Joi.string().valid('SCHEDULE', 'VENUE', 'CANCELLATION', 'ANNOUNCEMENT', 'OTHER'))
    .optional()
    .default(['SCHEDULE', 'VENUE', 'CANCELLATION', 'ANNOUNCEMENT']),
  channels: Joi.array()
    .items(Joi.string().valid('EMAIL', 'PUSH', 'IN_APP', 'SMS'))
    .optional()
    .default(['EMAIL', 'PUSH', 'IN_APP']),
});

export const updateSubscriptionPreferencesSchema = Joi.object({
  updateTypes: Joi.array()
    .items(Joi.string().valid('SCHEDULE', 'VENUE', 'CANCELLATION', 'ANNOUNCEMENT', 'OTHER'))
    .optional(),
  channels: Joi.array()
    .items(Joi.string().valid('EMAIL', 'PUSH', 'IN_APP', 'SMS'))
    .optional(),
});
