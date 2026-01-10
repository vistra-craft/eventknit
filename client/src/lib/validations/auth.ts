import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  requiredString,
  stringWithLength,
} from './common';

/**
 * Attendee Registration - Step 1 (Personal Info)
 */
export const attendeeStep1Schema = z
  .object({
    firstName: requiredString('First name'),
    lastName: requiredString('Last name'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phoneNumber: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Attendee Registration - Step 2 (Interests & Preferences)
 */
export const attendeeStep2Schema = z.object({
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  eventTypes: z.array(z.string()).min(1, 'Select at least one event type'),
  location: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
});

/**
 * Attendee Registration - Step 3 (Profile Information)
 */
export const attendeeStep3Schema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bio: stringWithLength(0, 500, 'Bio').optional(),
  profilePicture: z.instanceof(File).optional().nullable(),
});

/**
 * Complete Attendee Registration Schema
 * (Merge of all three steps for type inference)
 */
export const attendeeRegistrationSchema = attendeeStep1Schema
  .merge(attendeeStep2Schema)
  .merge(attendeeStep3Schema);

export type AttendeeRegistrationData = z.infer<typeof attendeeRegistrationSchema>;
export type AttendeeStep1Data = z.infer<typeof attendeeStep1Schema>;
export type AttendeeStep2Data = z.infer<typeof attendeeStep2Schema>;
export type AttendeeStep3Data = z.infer<typeof attendeeStep3Schema>;

/**
 * Organizer Registration - Step 1 (Basic Info)
 */
export const organizerStep1Schema = z
  .object({
    firstName: requiredString('First name'),
    lastName: requiredString('Last name'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phoneNumber: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Organizer Registration - Step 2 (Business Info)
 */
export const organizerStep2Schema = z.object({
  businessName: requiredString('Business name'),
  businessType: requiredString('Business type'),
  taxId: z.string().optional(),
  address: requiredString('Address'),
  city: requiredString('City'),
  state: requiredString('State'),
  zipCode: requiredString('ZIP code'),
  country: requiredString('Country'),
});

/**
 * Organizer Registration - Step 3 (Event Preferences)
 */
export const organizerStep3Schema = z.object({
  eventTypes: z.array(z.string()).min(1, 'Select at least one event type'),
  organizationType: requiredString('Organization type'),
  eventsPerYear: z.string().optional(),
  isRecurringSeries: z.boolean(),
});

/**
 * Organizer Registration - Step 4 (Documents - Optional for initial registration)
 */
export const organizerStep4Schema = z.object({
  idDocument: z.instanceof(File).optional().nullable(),
  businessLicense: z.instanceof(File).optional().nullable(),
  taxDocument: z.instanceof(File).optional().nullable(),
});

/**
 * Complete Organizer Registration Schema
 */
export const organizerRegistrationSchema = organizerStep1Schema
  .merge(organizerStep2Schema)
  .merge(organizerStep3Schema)
  .merge(organizerStep4Schema);

export type OrganizerRegistrationData = z.infer<typeof organizerRegistrationSchema>;
export type OrganizerStep1Data = z.infer<typeof organizerStep1Schema>;
export type OrganizerStep2Data = z.infer<typeof organizerStep2Schema>;
export type OrganizerStep3Data = z.infer<typeof organizerStep3Schema>;
export type OrganizerStep4Data = z.infer<typeof organizerStep4Schema>;

/**
 * Simple Registration (Email + Password only)
 */
export const simpleRegistrationSchema = z
  .object({
    email: emailSchema,
    firstName: requiredString('First name'),
    lastName: requiredString('Last name'),
    password: passwordSchema,
    confirmPassword: z.string(),
    selectedRole: z.enum(['ATTENDEE', 'ORGANIZER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SimpleRegistrationData = z.infer<typeof simpleRegistrationSchema>;

/**
 * Sign In Schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type SignInData = z.infer<typeof signInSchema>;

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

/**
 * Email Verification Schema
 */
export const emailVerificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
