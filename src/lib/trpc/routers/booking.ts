/**
 * Booking Router
 *
 * API routes for booking-related operations.
 * Stub implementation - will be fully developed in later phases.
 */

import { router, protectedProcedure } from '../server'
import { z } from 'zod'

export const bookingRouter = router({
  /**
   * Get all bookings for the current tenant
   * Requires authentication
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(50),
          offset: z.number().min(0).optional().default(0),
          status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']).optional(),
          upcoming: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return { bookings: [], total: 0 }
      }

      const { limit = 50, offset = 0, status, upcoming } = input || {}

      const where = {
        tenant_id: ctx.tenantId,
        ...(status && { status }),
        ...(upcoming && { scheduled_at: { gte: new Date() } }),
      }

      const [bookings, total] = await Promise.all([
        ctx.prisma.bookings.findMany({
          where,
          orderBy: { scheduled_at: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            scheduled_at: true,
            duration_minutes: true,
            service_type: true,
            estimated_price: true,
            customer_name: true,
            customer_phone: true,
            customer_email: true,
            property_address: true,
            property_city: true,
            property_state: true,
            property_zip: true,
            status: true,
            confirmation_sent: true,
            reminder_sent: true,
            notes: true,
            google_calendar_event_id: true,
            created_at: true,
          },
        }),
        ctx.prisma.bookings.count({ where }),
      ])

      return { bookings, total }
    }),

  /**
   * Get a single booking by ID
   * Requires authentication
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return null
      }

      const booking = await ctx.prisma.bookings.findFirst({
        where: {
          id: input.id,
          tenant_id: ctx.tenantId,
        },
        include: {
          calls: true,
          leads: true,
        },
      })

      return booking
    }),
})
