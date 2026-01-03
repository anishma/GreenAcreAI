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
          where: { tenantId: ctx.tenantId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            vapiCallId: true,
            callerPhoneNumber: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            status: true,
            outcome: true,
            quoteAmount: true,
            bookingMade: true,
            leadCaptured: true,
            createdAt: true,
          },
        }),
        ctx.prisma.calls.count({
          where: { tenantId: ctx.tenantId },
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
          tenantId: ctx.tenantId,
        },
        include: {
          leads: true,
          bookings: true,
        },
      })

      return call
    }),
})
