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
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(upcoming && { scheduledAt: { gte: new Date() } }),
      }

      const [bookings, total] = await Promise.all([
        ctx.prisma.bookings.findMany({
          where,
          orderBy: { scheduledAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            scheduledAt: true,
            durationMinutes: true,
            serviceType: true,
            estimatedPrice: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            propertyAddress: true,
            propertyCity: true,
            propertyState: true,
            propertyZip: true,
            status: true,
            confirmationSent: true,
            reminderSent: true,
            createdAt: true,
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
          tenantId: ctx.tenantId,
        },
        include: {
          calls: true,
          leads: true,
        },
      })

      return booking
    }),
})
