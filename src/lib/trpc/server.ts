/**
 * tRPC Server Configuration
 *
 * This file defines the tRPC router, procedures, and middleware.
 * It provides type-safe API routes with authentication checks.
 */

import { initTRPC, TRPCError } from '@trpc/server'
import { type Context } from './context'
import superjson from 'superjson'

// Initialize tRPC with context
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED error if user is not logged in
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now non-nullable
    },
  })
})

/**
 * Tenant procedure - requires authentication and tenant assignment
 * Throws UNAUTHORIZED if user not logged in
 * Throws FORBIDDEN if user has no tenant assigned
 */
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tenant assigned. Please complete onboarding.'
    })
  }
  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.tenantId, // tenantId is now non-nullable
    },
  })
})
