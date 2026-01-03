/**
 * Analytics Router
 *
 * API routes for analytics-related operations.
 * Stub implementation - will be fully developed in later phases.
 */

import { router, protectedProcedure } from '../server'
import { z } from 'zod'

export const analyticsRouter = router({
  /**
   * Get daily analytics for the current tenant
   * Requires authentication
   */
  getDaily: protectedProcedure
    .input(
      z
        .object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          limit: z.number().min(1).max(365).optional().default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return { analytics: [], total: 0 }
      }

      const { startDate, endDate, limit = 30 } = input || {}

      const where = {
        tenantId: ctx.tenantId,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      }

      const [analytics, total] = await Promise.all([
        ctx.prisma.analyticsDaily.findMany({
          where,
          orderBy: { date: 'desc' },
          take: limit,
          select: {
            id: true,
            date: true,
            totalCalls: true,
            successfulCalls: true,
            failedCalls: true,
            avgCallDurationSeconds: true,
            quotesGiven: true,
            bookingsMade: true,
            leadsCaptured: true,
            quoteToBookingRate: true,
            totalCost: true,
            avgCostPerCall: true,
          },
        }),
        ctx.prisma.analyticsDaily.count({ where }),
      ])

      return { analytics, total }
    }),

  /**
   * Get summary statistics for the current tenant
   * Requires authentication
   */
  getSummary: protectedProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(365).optional().default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        return null
      }

      const { days = 30 } = input || {}
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const analytics = await ctx.prisma.analyticsDaily.findMany({
        where: {
          tenantId: ctx.tenantId,
          date: { gte: startDate },
        },
        select: {
          totalCalls: true,
          successfulCalls: true,
          failedCalls: true,
          quotesGiven: true,
          bookingsMade: true,
          leadsCaptured: true,
          totalCost: true,
        },
      })

      // Calculate summary statistics
      const summary = analytics.reduce(
        (acc, day) => ({
          totalCalls: acc.totalCalls + day.totalCalls,
          successfulCalls: acc.successfulCalls + day.successfulCalls,
          failedCalls: acc.failedCalls + day.failedCalls,
          quotesGiven: acc.quotesGiven + day.quotesGiven,
          bookingsMade: acc.bookingsMade + day.bookingsMade,
          leadsCaptured: acc.leadsCaptured + day.leadsCaptured,
          totalCost: acc.totalCost + (day.totalCost ? Number(day.totalCost) : 0),
        }),
        {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          quotesGiven: 0,
          bookingsMade: 0,
          leadsCaptured: 0,
          totalCost: 0,
        }
      )

      return {
        ...summary,
        period: `Last ${days} days`,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      }
    }),
})
