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
    const dbUser = await ctx.prisma.user.findUnique({
      where: { authUserId: ctx.user.id },
      select: {
        id: true,
        authUserId: true,
        tenantId: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
