import Joi from 'joi';

const EventTypeValues = ['PUBLIC', 'PRIVATE'] as const;

export const eventValidations = {
  createEvent: Joi.object({
    title: Joi.string().trim().min(3).max(200).required().messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title must not exceed 200 characters',
      'any.required': 'Event title is required',
    }),
    description: Joi.string().trim().min(10).max(10000).required().messages({
      'string.min': 'Event description must be at least 10 characters long',
      'string.max': 'Event description must not exceed 10000 characters',
      'any.required': 'Event description is required',
    }),
    organizerDescription: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Organizer description must not exceed 1000 characters',
    }),
    category: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional().messages({
      'array.max': 'Tags array is too large',
    }),
    startDate: Joi.date().iso().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required',
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().allow(null).messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
    }),
    startTime: Joi.string().trim().max(20).optional().allow('', null).messages({
      'string.max': 'Start time must not exceed 20 characters',
    }),
    endTime: Joi.string().trim().max(20).optional().allow('', null).messages({
      'string.max': 'End time must not exceed 20 characters',
    }),
    registrationDeadline: Joi.date().iso().optional().allow(null).messages({
      'date.base': 'Registration deadline must be a valid date',
    }),
    venue: Joi.string().trim().max(200).optional().allow('', null).messages({
      'string.max': 'Venue must not exceed 200 characters',
    }),
    location: Joi.string().trim().min(2).max(200).required().messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location must not exceed 200 characters',
      'any.required': 'Location is required',
    }),
    address: Joi.string().trim().max(500).optional().allow('', null).messages({
      'string.max': 'Address must not exceed 500 characters',
    }),
    isOnline: Joi.boolean().optional().default(false),
    onlineLink: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Online link must be a valid URL',
    }),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).optional().allow(null),
    isFree: Joi.boolean().required().messages({
      'any.required': 'isFree field is required (true for free events, false for paid events)',
    }),
    price: Joi.when('isFree', {
      is: false,
      then: Joi.number().min(0).precision(2).optional().messages({
        'number.min': 'Price must be greater than or equal to 0',
        'number.base': 'Price must be a valid number',
      }),
      otherwise: Joi.number().min(0).precision(2).optional().allow(null),
    }),
    ticketTypes: Joi.when('isFree', {
      is: false,
      then: Joi.array().items(
        Joi.object({
          name: Joi.string().trim().min(1).max(100).required(),
          price: Joi.number().min(0).precision(2).required(),
          quantity: Joi.number().integer().min(1).optional().allow(null),
          features: Joi.array().items(Joi.string().trim().max(200)).optional(),
        }),
      ).min(1).optional().messages({
        'array.min': 'At least one ticket type is required for paid events',
      }),
      otherwise: Joi.array().items(
        Joi.object({
          name: Joi.string().trim().min(1).max(100).required(),
          price: Joi.number().min(0).precision(2).optional().allow(null),
          quantity: Joi.number().integer().min(1).optional().allow(null),
          features: Joi.array().items(Joi.string().trim().max(200)).optional(),
        }),
      ).optional(),
    }),
    capacity: Joi.number().integer().min(1).optional().allow(null).messages({
      'number.min': 'Capacity must be at least 1',
      'number.base': 'Capacity must be a valid number',
    }),
    image: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Image URL must be a valid URL',
    }),
    images: Joi.array().items(Joi.string().uri()).optional().messages({
      'array.max': 'Images array is too large',
    }),
    type: Joi.string().valid(...EventTypeValues).optional().default('PUBLIC').messages({
      'any.only': `Event type must be one of: ${EventTypeValues.join(', ')}`,
    }),
    requirements: Joi.array().items(Joi.string().trim().max(500)).optional().messages({
      'array.max': 'Requirements array is too large',
    }),
    ageRestriction: Joi.string().trim().max(50).optional().allow('', null).messages({
      'string.max': 'Age restriction must not exceed 50 characters',
    }),
    duration: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Duration must not exceed 100 characters',
    }),
    speakers: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        title: Joi.string().trim().max(200).optional().allow('', null),
        bio: Joi.string().trim().max(2000).optional().allow('', null),
        image: Joi.string().uri().optional().allow('', null),
      }),
    ).optional(),
    sponsors: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        level: Joi.string().trim().max(50).optional().allow('', null),
        logo: Joi.string().uri().optional().allow('', null),
      }),
    ).optional(),
    faqs: Joi.array().items(
      Joi.object({
        question: Joi.string().trim().min(1).max(500).required(),
        answer: Joi.string().trim().min(1).max(2000).required(),
      }),
    ).optional(),
    registrationFields: Joi.array().items(
      Joi.object({
        id: Joi.string().trim().min(1).max(100).required(),
        name: Joi.string().trim().min(1).max(100).required(),
        label: Joi.string().trim().min(1).max(200).required(),
        type: Joi.string().valid('text', 'email', 'tel', 'select', 'radio', 'checkbox', 'textarea', 'date', 'number').required(),
        required: Joi.boolean().required(),
        placeholder: Joi.string().trim().max(200).optional().allow('', null),
        options: Joi.array().items(Joi.string().trim().max(200)).optional(),
      }),
    ).optional(),
  }).custom((value, helpers) => {
    // Validate that if isFree is false, either price or ticketTypes must be provided
    if (!value.isFree && !value.price && (!value.ticketTypes || value.ticketTypes.length === 0)) {
      return helpers.error('any.custom', {
        message: 'Price or ticket types are required for paid events',
      });
    }
    return value;
  }),

  updateEvent: Joi.object({
    title: Joi.string().trim().min(3).max(200).optional().messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title must not exceed 200 characters',
    }),
    description: Joi.string().trim().min(10).max(10000).optional().messages({
      'string.min': 'Event description must be at least 10 characters long',
      'string.max': 'Event description must not exceed 10000 characters',
    }),
    organizerDescription: Joi.string().trim().max(1000).optional().allow('', null).messages({
      'string.max': 'Organizer description must not exceed 1000 characters',
    }),
    category: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().allow(null).messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
    }),
    startTime: Joi.string().trim().max(20).optional().allow('', null),
    endTime: Joi.string().trim().max(20).optional().allow('', null),
    registrationDeadline: Joi.date().iso().optional().allow(null),
    venue: Joi.string().trim().max(200).optional().allow('', null),
    location: Joi.string().trim().min(2).max(200).optional().messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location must not exceed 200 characters',
    }),
    address: Joi.string().trim().max(500).optional().allow('', null),
    isOnline: Joi.boolean().optional(),
    onlineLink: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Online link must be a valid URL',
    }),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).optional().allow(null),
    isFree: Joi.boolean().optional(),
    price: Joi.number().min(0).precision(2).optional().allow(null).messages({
      'number.min': 'Price must be greater than or equal to 0',
      'number.base': 'Price must be a valid number',
    }),
    ticketTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        price: Joi.number().min(0).precision(2).required(),
        originalPrice: Joi.number().min(0).precision(2).optional().allow(null),
        discountLabel: Joi.string().trim().max(100).optional().allow('', null),
        quantity: Joi.number().integer().min(1).optional().allow(null),
        features: Joi.array().items(Joi.string().trim().max(200)).optional(),
        isComplementary: Joi.boolean().optional().allow(null),
        requiresInvitation: Joi.boolean().optional().allow(null),
        availableFrom: Joi.string().isoDate().optional().allow('', null),
        availableUntil: Joi.string().isoDate().optional().allow('', null),
      }).custom((value, helpers) => {
        // Validate discount: if originalPrice exists, it must be > price
        if (value.originalPrice !== undefined && value.originalPrice !== null && value.price !== undefined) {
          const origPrice = typeof value.originalPrice === 'string' ? parseFloat(value.originalPrice) : value.originalPrice;
          const currPrice = typeof value.price === 'string' ? parseFloat(value.price) : value.price;
          if (!isNaN(origPrice) && !isNaN(currPrice) && origPrice <= currPrice) {
            return helpers.error('any.custom', {
              message: 'Original price must be greater than current price for discounts',
            });
          }
        }
        // Validate complementary tickets
        if (value.isComplementary === true) {
          const price = typeof value.price === 'string' ? parseFloat(value.price) : value.price;
          if (price !== 0 && !isNaN(price)) {
            return helpers.error('any.custom', {
              message: 'Complementary tickets must have price of 0',
            });
          }
        }
        // Explicitly preserve all fields to prevent Joi from stripping them
        return {
          ...value,
          isComplementary: value.isComplementary,
          requiresInvitation: value.requiresInvitation,
          originalPrice: value.originalPrice,
          discountLabel: value.discountLabel,
          availableFrom: value.availableFrom,
          availableUntil: value.availableUntil,
        };
      }, 'ticket type validation'),
    ).optional(),
    capacity: Joi.number().integer().min(1).optional().allow(null),
    image: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Image URL must be a valid URL',
    }),
    images: Joi.array().items(Joi.string().uri()).optional(),
    type: Joi.string().valid(...EventTypeValues).optional(),
    requirements: Joi.array().items(Joi.string().trim().max(500)).optional(),
    ageRestriction: Joi.string().trim().max(50).optional().allow('', null),
    duration: Joi.string().trim().max(100).optional().allow('', null),
    speakers: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        title: Joi.string().trim().max(200).optional().allow('', null),
        bio: Joi.string().trim().max(2000).optional().allow('', null),
        image: Joi.string().uri().optional().allow('', null),
      }),
    ).optional(),
    sponsors: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        level: Joi.string().trim().max(50).optional().allow('', null),
        logo: Joi.string().uri().optional().allow('', null),
      }),
    ).optional(),
    faqs: Joi.array().items(
      Joi.object({
        question: Joi.string().trim().min(1).max(500).required(),
        answer: Joi.string().trim().min(1).max(2000).required(),
      }),
    ).optional(),
    registrationFields: Joi.array().items(
      Joi.object({
        id: Joi.string().trim().min(1).max(100).required(),
        name: Joi.string().trim().min(1).max(100).required(),
        label: Joi.string().trim().min(1).max(200).required(),
        type: Joi.string().valid('text', 'email', 'tel', 'select', 'radio', 'checkbox', 'textarea', 'date', 'number').required(),
        required: Joi.boolean().required(),
        placeholder: Joi.string().trim().max(200).optional().allow('', null),
        options: Joi.array().items(Joi.string().trim().max(200)).optional(),
      }),
    ).optional(),
  }),

  registerForEvent: Joi.object({
    // New: Support multiple ticket types
    tickets: Joi.array().items(
      Joi.object({
        ticketType: Joi.string().trim().max(100).required().messages({
          'string.max': 'Ticket type must not exceed 100 characters',
          'any.required': 'Ticket type is required',
        }),
        quantity: Joi.number().integer().min(1).max(100).required().messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity must not exceed 100',
          'number.base': 'Quantity must be a valid number',
          'any.required': 'Quantity is required',
        }),
      }),
    ).min(1).optional().messages({
      'array.min': 'At least one ticket must be selected',
    }),
    // Deprecated: Use tickets array instead. Kept for backward compatibility
    ticketType: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Ticket type must not exceed 100 characters',
    }),
    quantity: Joi.number().integer().min(1).max(100).optional().default(1).messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity must not exceed 100',
      'number.base': 'Quantity must be a valid number',
    }),
    registrationData: Joi.object().optional().allow(null),
    invitationId: Joi.string().optional().allow('', null).messages({
      'string.base': 'Invitation ID must be a string',
    }),
    promoCode: Joi.string().trim().max(50).optional().allow('', null).messages({
      'string.max': 'Promo code must not exceed 50 characters',
    }),
  }),

  registerAsGuest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    // New: Support multiple ticket types
    tickets: Joi.array().items(
      Joi.object({
        ticketType: Joi.string().trim().max(100).required().messages({
          'string.max': 'Ticket type must not exceed 100 characters',
          'any.required': 'Ticket type is required',
        }),
        quantity: Joi.number().integer().min(1).max(100).required().messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity must not exceed 100',
          'number.base': 'Quantity must be a valid number',
          'any.required': 'Quantity is required',
        }),
      }),
    ).min(1).optional().messages({
      'array.min': 'At least one ticket must be selected',
    }),
    // Deprecated: Use tickets array instead. Kept for backward compatibility
    ticketType: Joi.string().trim().max(100).optional().allow('', null).messages({
      'string.max': 'Ticket type must not exceed 100 characters',
    }),
    quantity: Joi.number().integer().min(1).max(100).optional().default(1).messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity must not exceed 100',
      'number.base': 'Quantity must be a valid number',
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
    phoneNumber: Joi.string().trim().optional().allow('', null),
    registrationData: Joi.object().optional().allow(null),
  }),

  rejectEvent: Joi.object({
    rejectionReason: Joi.string().trim().min(10).max(1000).required().messages({
      'string.min': 'Rejection reason must be at least 10 characters long',
      'string.max': 'Rejection reason must not exceed 1000 characters',
      'any.required': 'Rejection reason is required',
    }),
  }),

  duplicateEvent: Joi.object({
    title: Joi.string().trim().min(3).max(200).optional().messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title must not exceed 200 characters',
    }),
    copyFields: Joi.array().items(Joi.string().valid(
      'description',
      'organizerDescription',
      'category',
      'tags',
      'venue',
      'location',
      'address',
      'isOnline',
      'onlineLink',
      'coordinates',
      'isFree',
      'price',
      'ticketTypes',
      'capacity',
      'requirements',
      'ageRestriction',
      'duration',
      'speakers',
      'sponsors',
      'faqs',
      'registrationFields',
      'dates',
      'images',
    )).optional().messages({
      'array.max': 'Too many copy fields',
    }),
    excludeFields: Joi.array().items(Joi.string()).optional().messages({
      'array.max': 'Too many exclude fields',
    }),
  }),
};

