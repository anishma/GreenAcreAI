/**
 * tRPC App Router
 *
 * Main router that combines all sub-routers.
 * Add new routers here as you build features.
 */

import { router } from '../server'
import { userRouter } from './user'
import { tenantRouter } from './tenant'
import { callRouter } from './call'
import { leadRouter } from './lead'
import { bookingRouter } from './booking'
import { analyticsRouter } from './analytics'

export const appRouter = router({
  user: userRouter,
  tenant: tenantRouter,
  call: callRouter,
  lead: leadRouter,
  booking: bookingRouter,
  analytics: analyticsRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
