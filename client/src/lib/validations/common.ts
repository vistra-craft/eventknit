import { z } from 'zod';

/**
 * Common validation schemas for reuse across forms
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

// Password validation (Eventbrite-style: 8+ chars, 1 letter, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be no more than 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

// Phone number validation (optional, flexible format)
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true; // Allow empty
      // Basic phone validation - at least 10 digits
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 10;
    },
    { message: 'Phone number must contain at least 10 digits' }
  );

// URL validation (optional, allows empty string)
export const urlSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val === '') return true; // Allow empty
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Please enter a valid URL' }
  );

// Date validation helpers
export const futureDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => new Date(val) > new Date(),
    { message: 'Date must be in the future' }
  );

export const pastDateSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Allow empty for optional fields
      return new Date(val) < new Date();
    },
    { message: 'Date must be in the past' }
  );

// Date range validation
export const createDateRangeSchema = (startField: string, endField: string) =>
  z
    .object({
      [startField]: z.string(),
      [endField]: z.string(),
    })
    .refine(
      (data) => {
        const start = new Date(data[startField]);
        const end = new Date(data[endField]);
        return end > start;
      },
      {
        message: `End date must be after start date`,
        path: [endField],
      }
    );

// String with min/max length
export const stringWithLength = (min: number, max: number, fieldName = 'Field') =>
  z
    .string()
    .min(min, `${fieldName} must be at least ${min} characters`)
    .max(max, `${fieldName} must be no more than ${max} characters`);

// Required string (non-empty)
export const requiredString = (fieldName = 'This field') =>
  z.string().min(1, `${fieldName} is required`);

// Optional string
export const optionalString = z.string().optional();

// Positive number validation
export const positiveNumber = (fieldName = 'Value') =>
  z.number().positive(`${fieldName} must be greater than 0`);

// Non-negative number validation
export const nonNegativeNumber = (fieldName = 'Value') =>
  z.number().min(0, `${fieldName} must be 0 or greater`);

// String to number coercion with validation
export const stringToNumber = (fieldName = 'Value') =>
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num);
    },
    { message: `${fieldName} must be a valid number` }
  );

export const stringToPositiveNumber = (fieldName = 'Value') =>
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: `${fieldName} must be a positive number` }
  );

export const stringToNonNegativeNumber = (fieldName = 'Value') =>
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: `${fieldName} must be 0 or greater` }
  );

// Array with minimum items
export const minArrayLength = <T>(min: number, fieldName = 'Items') =>
  z.array(z.any() as z.ZodType<T>).min(min, `Select at least ${min} ${fieldName.toLowerCase()}`);

// Password confirmation helper
export const createPasswordConfirmSchema = () =>
  z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
