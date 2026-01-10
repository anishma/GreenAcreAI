/**
 * User Router
 *
 * API routes for user-related operations.
 */

import { router, publicProcedure, protectedProcedure } from '../server'

export const userRouter = router({
  /**
   * Get current user's profile
   * Requires authentication
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const dbUser = await ctx.prisma.users.findUnique({
      where: { auth_user_id: ctx.user.id },
      select: {
        id: true,
        auth_user_id: true,
        tenant_id: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    })

    return dbUser
  }),

  /**
   * Health check endpoint (public)
   * Useful for testing tRPC setup
   */
  hello: publicProcedure.query(() => {
    return {
      message: 'Hello from tRPC!',
      timestamp: new Date().toISOString(),
    }
  }),
})
