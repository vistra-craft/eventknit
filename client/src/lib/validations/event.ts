import { z } from 'zod';
import {
  requiredString,
  optionalString,
  urlSchema,
  stringToPositiveNumber,
  stringToNonNegativeNumber,
} from './common';

/**
 * Event validation schemas for CreateEvent form
 */

// Ticket Type Schema
export const ticketTypeSchema = z.object({
  id: z.number(),
  name: requiredString('Ticket name'),
  type: z.enum(['free', 'paid'], {
    required_error: 'Ticket type is required',
  }),
  price: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Price must be a valid number (0 or greater)' }
  ),
  quantity: stringToPositiveNumber('Quantity'),
});

export type TicketType = z.infer<typeof ticketTypeSchema>;

// Speaker Schema
export const speakerSchema = z.object({
  name: requiredString('Speaker name'),
  title: z.string().optional(),
  bio: z.string().optional(),
});

export type Speaker = z.infer<typeof speakerSchema>;

// Sponsor Schema
export const sponsorSchema = z.object({
  name: requiredString('Sponsor name'),
  level: z.enum(['gold', 'silver', 'bronze'], {
    required_error: 'Sponsor level is required',
  }),
  logo: z.string().optional(), // URL to logo image
});

export type Sponsor = z.infer<typeof sponsorSchema>;

// FAQ Schema
export const faqSchema = z.object({
  question: requiredString('Question'),
  answer: requiredString('Answer'),
});

export type FAQ = z.infer<typeof faqSchema>;

// Registration Field Schema
export const registrationFieldSchema = z.object({
  id: requiredString('Field ID'),
  name: requiredString('Field name'),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'date', 'number'], {
    required_error: 'Field type is required',
  }),
  label: requiredString('Field label'),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select/radio/checkbox fields
});

export type RegistrationField = z.infer<typeof registrationFieldSchema>;

// Base Event Data Schema
export const eventDataSchema = z.object({
  // Basic Information
  title: z
    .string()
    .min(3, 'Event title must be at least 3 characters')
    .max(200, 'Event title must be no more than 200 characters'),
  organizer: requiredString('Organizer name'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be no more than 5000 characters'),
  organizerDescription: z
    .string()
    .max(1000, 'Organizer description must be no more than 1000 characters')
    .optional(),
  category: z.string().optional(),

  // Date & Time
  date: z
    .string()
    .min(1, 'Event start date is required')
    .refine((val) => new Date(val) > new Date(), {
      message: 'Event start date must be in the future',
    }),
  time: requiredString('Event start time'),
  endDate: requiredString('Event end date'),
  endTime: requiredString('Event end time'),

  // Location
  isOnline: z.boolean().default(false),
  location: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  onlineLink: urlSchema,

  // Event Details
  capacity: stringToPositiveNumber('Capacity'),
  totalSlots: z.number().int().positive('Total slots must be a positive number').optional(),
  price: stringToNonNegativeNumber('Price'),
  image: z.string().optional(), // URL to event image
  requirements: z
    .string()
    .max(1000, 'Requirements must be no more than 1000 characters')
    .optional(),
});

// Complete Create Event Schema with all fields
export const createEventSchema = eventDataSchema
  .extend({
    // Privacy & Settings
    isPrivate: z.boolean().default(false),
    isRecurring: z.boolean().default(false),

    // Dynamic Arrays
    ticketTypes: z
      .array(ticketTypeSchema)
      .min(1, 'At least one ticket type is required')
      .refine(
        (tickets) => {
          // Ensure at least one ticket has a quantity > 0
          return tickets.some((ticket) => parseInt(ticket.quantity) > 0);
        },
        { message: 'At least one ticket type must have available quantity' }
      ),
    speakers: z.array(speakerSchema).default([]),
    sponsors: z.array(sponsorSchema).default([]),
    faqs: z.array(faqSchema).default([]),
    tags: z.array(z.string()).default([]),
    registrationFields: z
      .array(registrationFieldSchema)
      .min(1, 'At least one registration field is required')
      .default([
        {
          id: 'firstName',
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          required: true,
          placeholder: 'Enter your first name',
        },
        {
          id: 'lastName',
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          required: true,
          placeholder: 'Enter your last name',
        },
        {
          id: 'email',
          name: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'your.email@example.com',
        },
      ]),
  })
  .refine(
    (data) => {
      // Validate end date/time is after start date/time
      const start = new Date(`${data.date} ${data.time}`);
      const end = new Date(`${data.endDate} ${data.endTime}`);
      return end > start;
    },
    {
      message: 'Event end date/time must be after start date/time',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // If online event, online link is required
      if (data.isOnline && !data.onlineLink) {
        return false;
      }
      return true;
    },
    {
      message: 'Online event link is required for online events',
      path: ['onlineLink'],
    }
  )
  .refine(
    (data) => {
      // If in-person event, venue or location is required
      if (!data.isOnline && !data.venue && !data.location) {
        return false;
      }
      return true;
    },
    {
      message: 'Venue or location is required for in-person events',
      path: ['venue'],
    }
  );

export type CreateEventData = z.infer<typeof createEventSchema>;

/**
 * Tab-specific validation schemas for multi-step validation
 * Useful for validating individual tabs before allowing navigation
 */

// Tab 1: Basic Information
export const basicInfoSchema = eventDataSchema.pick({
  title: true,
  organizer: true,
  description: true,
  organizerDescription: true,
  category: true,
  image: true,
});

// Tab 2: Date & Time
export const dateTimeSchema = eventDataSchema
  .pick({
    date: true,
    time: true,
    endDate: true,
    endTime: true,
  })
  .refine(
    (data) => {
      const start = new Date(`${data.date} ${data.time}`);
      const end = new Date(`${data.endDate} ${data.endTime}`);
      return end > start;
    },
    {
      message: 'Event end date/time must be after start date/time',
      path: ['endDate'],
    }
  );

// Tab 3: Location
export const locationSchema = eventDataSchema.pick({
  isOnline: true,
  location: true,
  venue: true,
  address: true,
  onlineLink: true,
});

// Tab 4: Tickets & Pricing
export const ticketsPricingSchema = z.object({
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, 'At least one ticket type is required'),
  capacity: stringToPositiveNumber('Capacity'),
  price: stringToNonNegativeNumber('Price'),
});

// Tab 5: Additional Details
export const additionalDetailsSchema = z.object({
  speakers: z.array(speakerSchema).default([]),
  sponsors: z.array(sponsorSchema).default([]),
  faqs: z.array(faqSchema).default([]),
  tags: z.array(z.string()).default([]),
  requirements: z
    .string()
    .max(1000, 'Requirements must be no more than 1000 characters')
    .optional(),
});

// Tab 6: Registration Form
export const registrationFormSchema = z.object({
  registrationFields: z
    .array(registrationFieldSchema)
    .min(1, 'At least one registration field is required'),
});

/**
 * Helper function to validate specific tab fields
 * @example
 * const isValid = await validateTabFields(form, 'basic-info');
 */
export const getSchemaForTab = (tabKey: string) => {
  switch (tabKey) {
    case 'basic-info':
      return basicInfoSchema;
    case 'date-time':
      return dateTimeSchema;
    case 'location':
      return locationSchema;
    case 'tickets-pricing':
      return ticketsPricingSchema;
    case 'additional-details':
      return additionalDetailsSchema;
    case 'registration-form':
      return registrationFormSchema;
    default:
      return createEventSchema;
  }
};
