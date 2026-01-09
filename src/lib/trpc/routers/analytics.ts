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
   * Get dashboard metrics for the current tenant
   * Includes today's calls, total leads, bookings, and conversion rate
   */
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      return {
        callsToday: 0,
        totalLeads: 0,
        totalBookings: 0,
        conversionRate: 0,
        recentCalls: [],
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [callsToday, totalLeads, totalBookings, recentCalls] = await Promise.all([
      ctx.prisma.calls.count({
        where: {
          tenant_id: ctx.tenantId,
          created_at: { gte: today },
        },
      }),
      ctx.prisma.leads.count({
        where: { tenant_id: ctx.tenantId },
      }),
      ctx.prisma.bookings.count({
        where: { tenant_id: ctx.tenantId },
      }),
      ctx.prisma.calls.findMany({
        where: { tenant_id: ctx.tenantId },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          vapi_call_id: true,
          created_at: true,
          ended_at: true,
          duration_seconds: true,
          caller_phone_number: true,
          outcome: true,
          quote_amount: true,
          booking_made: true,
          lead_captured: true,
          status: true,
        },
      }),
    ])

    // Calculate conversion rate (bookings / leads)
    const conversionRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0

    return {
      callsToday,
      totalLeads,
      totalBookings,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      recentCalls,
    }
  }),

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
