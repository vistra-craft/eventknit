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
 * Organizer Registration — email-first, 2-screen flow
 *
 * Screen 1 (email gate): just email — stored in local state, no schema needed
 * Screen 2 (details):    name, password, phone, organization
 *
 * Only fields the backend actually accepts are collected.
 */
const organizerDetailsFields = z.object({
  email: emailSchema,
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  password: passwordSchema,
  confirmPassword: z.string(),
  phoneNumber: phoneSchema,
  organizationName: requiredString('Organization name'),
  businessEmail: emailSchema.optional().or(z.literal('')),
});

export const organizerRegistrationSchema = organizerDetailsFields.refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] },
);

export type OrganizerRegistrationData = z.infer<typeof organizerRegistrationSchema>;

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
