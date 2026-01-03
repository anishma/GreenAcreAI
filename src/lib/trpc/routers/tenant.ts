/**
 * Tenant Router
 *
 * API routes for tenant-related operations.
 * Will be fully implemented in Phase 3.
 */

import { router, protectedProcedure } from '../server'

export const tenantRouter = router({
  /**
   * Get current user's tenant information
   * Requires authentication
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      return null
    }

    const tenant = await ctx.prisma.tenants.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        status: true,
        onboardingCompleted: true,
        onboardingStep: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return tenant
  }),
})
