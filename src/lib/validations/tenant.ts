/**
 * Tenant Validation Schemas
 *
 * Zod schemas for validating tenant-related operations.
 */

import { z } from 'zod'

/**
 * Business information validation
 */
export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(255, 'Business name must be less than 255 characters'),
  ownerName: z
    .string()
    .min(2, 'Owner name must be at least 2 characters')
    .max(255, 'Owner name must be less than 255 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
})

/**
 * Service area validation (ZIP codes)
 */
export const serviceAreaSchema = z.object({
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .length(5, 'ZIP code must be 5 digits'),
  city: z.string().optional(),
  state: z.string().length(2, 'State must be 2 letters').optional(),
})

export const serviceAreasSchema = z.array(serviceAreaSchema).min(1, 'At least one service area is required')

/**
 * Pricing tier validation
 */
export const pricingTierSchema = z.object({
  minSqft: z.number().int().min(0, 'Minimum square footage must be 0 or greater'),
  maxSqft: z.number().int().min(1, 'Maximum square footage must be at least 1').optional(),
  weeklyPrice: z.number().min(0, 'Price must be 0 or greater'),
  biweeklyPrice: z.number().min(0, 'Price must be 0 or greater'),
  monthlyPrice: z.number().min(0, 'Price must be 0 or greater').optional(),
})

export const pricingConfigSchema = z.object({
  tiers: z
    .array(pricingTierSchema)
    .min(1, 'At least one pricing tier is required')
    .refine(
      (tiers) => {
        // Validate that tiers are in ascending order and don't overlap
        for (let i = 0; i < tiers.length - 1; i++) {
          const current = tiers[i]
          const next = tiers[i + 1]
          if (current.maxSqft && next.minSqft <= current.maxSqft) {
            return false
          }
        }
        return true
      },
      { message: 'Pricing tiers must not overlap and should be in ascending order' }
    ),
  allowsGenericQuotes: z.boolean(),
  genericQuoteDisclaimer: z.string().max(500, 'Disclaimer must be less than 500 characters').optional(),
})

/**
 * Business hours validation
 */
export const businessHoursSchema = z.object({
  monday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  tuesday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  wednesday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  thursday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  friday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  saturday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
  sunday: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().optional(),
    })
    .optional(),
})

/**
 * Notification preferences validation
 */
export const notificationPreferencesSchema = z.object({
  sms_new_lead: z.boolean(),
  sms_new_booking: z.boolean(),
  email_daily_summary: z.boolean().optional(),
  email_weekly_report: z.boolean().optional(),
})

/**
 * Timezone validation
 */
export const timezoneSchema = z.string().refine((tz) => {
  // Basic timezone validation
  try {
    new Date().toLocaleString('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}, 'Invalid timezone')
