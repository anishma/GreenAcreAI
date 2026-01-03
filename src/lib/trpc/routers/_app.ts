/**
 * tRPC App Router
 *
 * Main router that combines all sub-routers.
 * Add new routers here as you build features.
 */

import { router } from '../server'
import { userRouter } from './user'

export const appRouter = router({
  user: userRouter,
  // Future routers will be added here:
  // call: callRouter,
  // lead: leadRouter,
  // booking: bookingRouter,
  // tenant: tenantRouter,
  // analytics: analyticsRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
