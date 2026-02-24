import Joi from 'joi';

const staffDepartments = ['OPERATIONS', 'CUSTOMER_SERVICE', 'TECHNICAL', 'MANAGEMENT', 'FINANCE', 'MARKETING'];

export const extendedProfileValidations = {
  upsertStaffProfile: Joi.object({
    employeeId: Joi.string().trim().max(100).optional().allow(null, ''),
    department: Joi.string().valid(...staffDepartments).optional().messages({
      'any.only': `Department must be one of: ${staffDepartments.join(', ')}`,
    }),
    location: Joi.string().trim().max(200).optional().allow(null, ''),
    hireDate: Joi.date().iso().optional().allow(null),
    salary: Joi.number().min(0).optional().allow(null),
    hourlyRate: Joi.number().min(0).optional().allow(null),
    permissions: Joi.object().pattern(Joi.string(), Joi.boolean()).optional(),
    totalHours: Joi.number().min(0).optional(),
    rating: Joi.number().min(0).max(5).optional().allow(null),
  }),

  upsertOrganizerProfile: Joi.object({
    website: Joi.string().trim().uri().max(500).optional().allow(null, ''),
    description: Joi.string().trim().max(2000).optional().allow(null, ''),
    socialLinks: Joi.object().pattern(
      Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'),
      Joi.string().trim().uri().max(500).allow(null, ''),
    ).optional().allow(null),
    businessLicense: Joi.string().trim().max(200).optional().allow(null, ''),
    taxId: Joi.string().trim().max(100).optional().allow(null, ''),
    bankAccountLast4: Joi.string().trim().length(4).pattern(/^\d{4}$/).optional().allow(null, '').messages({
      'string.length': 'Bank account last 4 must be exactly 4 digits',
      'string.pattern.base': 'Bank account last 4 must contain only digits',
    }),
    location: Joi.string().trim().max(200).optional().allow(null, ''),
    totalEvents: Joi.number().integer().min(0).optional(),
    totalRevenue: Joi.number().min(0).optional(),
    rating: Joi.number().min(0).max(5).optional().allow(null),
    markComplete: Joi.boolean().optional(),
  }),

  upsertEmergencyContact: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Emergency contact name is required',
      'any.required': 'Emergency contact name is required',
    }),
    phone: Joi.string().trim().min(1).max(30).required().messages({
      'string.empty': 'Emergency contact phone is required',
      'any.required': 'Emergency contact phone is required',
    }),
    relationship: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Relationship is required',
      'any.required': 'Relationship is required',
    }),
    email: Joi.string().trim().lowercase().email().optional().allow(null, '').messages({
      'string.email': 'Please provide a valid email address',
    }),
  }),
};
