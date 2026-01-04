/**
 * Booking Validation Schemas
 *
 * Zod schemas for validating booking-related operations.
 */

import { z } from 'zod'

/**
 * Booking status enum
 */
export const bookingStatusSchema = z.enum([
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
])

/**
 * Service type enum (matches lead service types)
 */
export const serviceTypeSchema = z.enum([
  'lawn_mowing',
  'landscaping',
  'tree_service',
  'snow_removal',
  'other',
])

/**
 * Booking creation schema
 */
export const createBookingSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date/time format'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  serviceType: serviceTypeSchema.default('lawn_mowing'),
  estimatedPrice: z.number().min(0).optional(),
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().max(100).optional(),
  propertyState: z.string().length(2, 'State must be 2 letters').optional(),
  propertyZip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional(),
  notes: z.string().optional(),
  callId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
})

/**
 * Booking update schema
 */
export const updateBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  status: bookingStatusSchema.optional(),
  estimatedPrice: z.number().min(0).optional(),
  customerName: z.string().min(1).max(255).optional(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().max(100).optional(),
  propertyState: z.string().length(2).optional(),
  propertyZip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
})

/**
 * Booking list query parameters
 */
export const bookingListQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  status: bookingStatusSchema.optional(),
  upcoming: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Booking detail query
 */
export const bookingDetailQuerySchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
})

/**
 * Cancel booking schema
 */
export const cancelBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
})
