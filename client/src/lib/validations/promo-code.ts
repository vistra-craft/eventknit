import { z } from 'zod';
import { requiredString, stringToPositiveNumber } from './common';

/**
 * Promo Code Creation/Update Schema
 */
export const promoCodeSchema = z
  .object({
    code: requiredString('Promo code')
      .min(3, 'Code must be at least 3 characters')
      .max(20, 'Code must be at most 20 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),

    eventId: z.string().optional(),

    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
      required_error: 'Discount type is required',
    }),

    discountValue: stringToPositiveNumber('Discount value'),

    minOrderAmount: z
      .union([z.string(), z.number()])
      .transform((val) => (val === '' || val === undefined ? undefined : Number(val)))
      .pipe(z.number().nonnegative('Minimum order must be non-negative').optional())
      .optional(),

    maxDiscount: z
      .union([z.string(), z.number()])
      .transform((val) => (val === '' || val === undefined ? undefined : Number(val)))
      .pipe(z.number().positive('Maximum discount must be positive').optional())
      .optional(),

    applicableTicketTypes: z.array(z.string()).optional().default([]),

    usageLimit: z
      .union([z.string(), z.number()])
      .transform((val) => (val === '' || val === undefined ? undefined : Number(val)))
      .pipe(z.number().positive('Usage limit must be positive').optional())
      .optional(),

    maxUsesPerUser: z
      .union([z.string(), z.number()])
      .transform((val) => (val === '' || val === undefined ? 1 : Number(val)))
      .pipe(z.number().int().positive('Max uses per user must be positive')),

    validFrom: z.string().min(1, 'Start date is required'),

    validUntil: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      const from = new Date(data.validFrom);
      const until = new Date(data.validUntil);
      return until > from;
    },
    {
      message: 'End date must be after start date',
      path: ['validUntil'],
    }
  )
  .refine(
    (data) => {
      // If it's a percentage discount, validate it's between 0-100
      if (data.discountType === 'PERCENTAGE') {
        const value = Number(data.discountValue);
        return value > 0 && value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount must be between 1 and 100',
      path: ['discountValue'],
    }
  );

export type PromoCodeFormData = z.infer<typeof promoCodeSchema>;
