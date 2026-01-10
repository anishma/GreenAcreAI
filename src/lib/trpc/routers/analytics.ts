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
        tenant_id: ctx.tenantId,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      }

      const [analytics, total] = await Promise.all([
        ctx.prisma.analytics_daily.findMany({
          where,
          orderBy: { date: 'desc' },
          take: limit,
          select: {
            id: true,
            date: true,
            total_calls: true,
            successful_calls: true,
            failed_calls: true,
            avg_call_duration_seconds: true,
            quotes_given: true,
            bookings_made: true,
            leads_captured: true,
            quote_to_booking_rate: true,
            total_cost: true,
            avg_cost_per_call: true,
          },
        }),
        ctx.prisma.analytics_daily.count({ where }),
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

      const analytics = await ctx.prisma.analytics_daily.findMany({
        where: {
          tenant_id: ctx.tenantId,
          date: { gte: startDate },
        },
        select: {
          total_calls: true,
          successful_calls: true,
          failed_calls: true,
          quotes_given: true,
          bookings_made: true,
          leads_captured: true,
          total_cost: true,
        },
      })

      // Calculate summary statistics
      const summary = analytics.reduce(
        (acc: {
          totalCalls: number
          successfulCalls: number
          failedCalls: number
          quotesGiven: number
          bookingsMade: number
          leadsCaptured: number
          totalCost: number
        }, day: any) => ({
          totalCalls: acc.totalCalls + day.total_calls,
          successfulCalls: acc.successfulCalls + day.successful_calls,
          failedCalls: acc.failedCalls + day.failed_calls,
          quotesGiven: acc.quotesGiven + day.quotes_given,
          bookingsMade: acc.bookingsMade + day.bookings_made,
          leadsCaptured: acc.leadsCaptured + day.leads_captured,
          totalCost: acc.totalCost + (day.total_cost ? Number(day.total_cost) : 0),
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
