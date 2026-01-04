/**
 * Call Validation Schemas
 *
 * Zod schemas for validating call-related operations.
 */

import { z } from 'zod'

/**
 * Call status enum
 */
export const callStatusSchema = z.enum([
  'queued',
  'ringing',
  'in-progress',
  'forwarding',
  'ended',
  'busy',
  'no-answer',
  'canceled',
  'failed',
])

/**
 * Call outcome enum
 */
export const callOutcomeSchema = z.enum([
  'quote_given',
  'booking_made',
  'lead_captured',
  'wrong_number',
  'hangup',
  'out_of_area',
  'incomplete',
])

/**
 * Call transcript message
 */
export const transcriptMessageSchema = z.object({
  role: z.enum(['assistant', 'user', 'system']),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
})

/**
 * Call list query parameters
 */
export const callListQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  status: callStatusSchema.optional(),
  outcome: callOutcomeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Call detail query
 */
export const callDetailQuerySchema = z.object({
  id: z.string().uuid('Invalid call ID'),
})

/**
 * Manual call creation (for testing)
 */
export const createCallSchema = z.object({
  callerPhoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  phoneNumberCalled: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
})
