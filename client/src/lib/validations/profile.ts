import { z } from 'zod';
import { requiredString, phoneSchema } from './common';

/**
 * Profile Update Schema
 */
export const profileUpdateSchema = z.object({
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  otherName: z.string().optional(),
  phoneNumber: phoneSchema.optional(),
  companyAffiliation: z.string().optional(),
  organizationName: z.string().optional(),
  businessEmail: z.string().email('Invalid business email').optional().or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
