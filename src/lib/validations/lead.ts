/**
 * Lead Validation Schemas
 *
 * Zod schemas for validating lead-related operations.
 */

import { z } from 'zod'

/**
 * Lead status enum
 */
export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
])

/**
 * Service type enum
 */
export const serviceTypeSchema = z.enum([
  'lawn_mowing',
  'landscaping',
  'tree_service',
  'snow_removal',
  'other',
])

/**
 * Quote frequency enum
 */
export const quoteFrequencySchema = z.enum([
  'weekly',
  'biweekly',
  'monthly',
  'one-time',
])

/**
 * Lead creation schema
 */
export const createLeadSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, 'State must be 2 letters').optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional(),
  lotSizeSqft: z.number().int().min(0).optional(),
  parcelId: z.string().max(100).optional(),
  quoteAmount: z.number().min(0).optional(),
  quoteFrequency: quoteFrequencySchema.optional(),
  serviceType: serviceTypeSchema.default('lawn_mowing'),
  notes: z.string().optional(),
})

/**
 * Lead update schema
 */
export const updateLeadSchema = z.object({
  id: z.string().uuid('Invalid lead ID'),
  status: leadStatusSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  quoteAmount: z.number().min(0).optional(),
  quoteFrequency: quoteFrequencySchema.optional(),
  followUpNeeded: z.boolean().optional(),
  followUpAt: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/**
 * Lead list query parameters
 */
export const leadListQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  status: leadStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  followUpNeeded: z.boolean().optional(),
})

/**
 * Lead detail query
 */
export const leadDetailQuerySchema = z.object({
  id: z.string().uuid('Invalid lead ID'),
})
