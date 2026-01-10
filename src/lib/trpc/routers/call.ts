/**
 * Call Router
 *
 * API routes for call-related operations.
 * Stub implementation - will be fully developed in later phases.
 */

import { router, protectedProcedure } from '../server'
import { z } from 'zod'

export const callRouter = router({
  /**
   * Get all calls for the current tenant
   * Requires authentication
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return { calls: [], total: 0 }
      }

      const { limit = 50, offset = 0 } = input || {}

      const [calls, total] = await Promise.all([
        ctx.prisma.calls.findMany({
          where: { tenant_id: ctx.tenantId },
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            vapi_call_id: true,
            phone_number_called: true,
            caller_phone_number: true,
            started_at: true,
            ended_at: true,
            duration_seconds: true,
            status: true,
            outcome: true,
            quote_amount: true,
            booking_made: true,
            lead_captured: true,
            created_at: true,
          },
        }),
        ctx.prisma.calls.count({
          where: { tenant_id: ctx.tenantId },
        }),
      ])

      return { calls, total }
    }),

  /**
   * Get a single call by ID
   * Requires authentication
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return null
      }

      const call = await ctx.prisma.calls.findFirst({
        where: {
          id: input.id,
          tenant_id: ctx.tenantId,
        },
        include: {
          leads: true,
          bookings: true,
        },
      })

      return call
    }),
})
