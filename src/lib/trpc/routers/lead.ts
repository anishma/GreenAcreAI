/**
 * Lead Router
 *
 * API routes for lead-related operations.
 * Stub implementation - will be fully developed in later phases.
 */

import { router, protectedProcedure } from '../server'
import { z } from 'zod'

export const leadRouter = router({
  /**
   * Get all leads for the current tenant
   * Requires authentication
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(50),
          offset: z.number().min(0).optional().default(0),
          status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return { leads: [], total: 0 }
      }

      const { limit = 50, offset = 0, status } = input || {}

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
      }

      const [leads, total] = await Promise.all([
        ctx.prisma.leads.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            quoteAmount: true,
            status: true,
            serviceType: true,
            followUpNeeded: true,
            followUpAt: true,
            createdAt: true,
          },
        }),
        ctx.prisma.leads.count({ where }),
      ])

      return { leads, total }
    }),

  /**
   * Get a single lead by ID
   * Requires authentication
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return null
      }

      const lead = await ctx.prisma.leads.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          calls: true,
          bookings: true,
        },
      })

      return lead
    }),
})
