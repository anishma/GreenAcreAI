/**
 * Tenant Router
 *
 * API routes for tenant-related operations.
 * Fully implemented in Phase 3.
 */

import { router, protectedProcedure } from '../server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  businessInfoSchema,
  serviceAreasSchema,
  pricingConfigSchema,
  businessHoursSchema,
  notificationPreferencesSchema,
} from '@/lib/validations/tenant'
import { exchangeCodeForTokens, getPrimaryCalendarId } from '@/lib/google/oauth'
import { encrypt } from '@/lib/utils/encryption'
import { purchasePhoneNumber, createAgent, linkPhoneNumberToAgent } from '@/lib/vapi/client'

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
        business_name: true,
        owner_name: true,
        email: true,
        phone: true,
        service_areas: true,
        pricing_tiers: true,
        allows_generic_quotes: true,
        generic_quote_disclaimer: true,
        business_hours: true,
        notification_preferences: true,
        timezone: true,
        status: true,
        onboarding_completed: true,
        onboarding_step: true,
        phone_number: true,
        phone_number_sid: true,
        vapi_agent_id: true,
        vapi_phone_number_id: true,
        calendar_id: true,
        created_at: true,
        updated_at: true,
      },
    })

    return tenant
  }),

  /**
   * Update business information
   * Updates business name, owner name, email, and phone
   */
  updateBusinessInfo: protectedProcedure
    .input(businessInfoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: {
          business_name: input.businessName,
          owner_name: input.ownerName,
          email: input.email,
          phone: input.phone || null,
          updated_at: new Date(),
        },
      })

      return tenant
    }),

  /**
   * Update service areas (ZIP codes)
   * Replaces existing service areas with new list
   */
  updateServiceAreas: protectedProcedure
    .input(serviceAreasSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: {
          service_areas: input as any,
          updated_at: new Date(),
        },
      })

      return tenant
    }),

  /**
   * Update pricing configuration
   * Validates tier structure and updates pricing
   */
  updatePricing: protectedProcedure
    .input(pricingConfigSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: {
          pricing_tiers: input.tiers as any,
          allows_generic_quotes: input.allowsGenericQuotes,
          generic_quote_disclaimer: input.genericQuoteDisclaimer || null,
          updated_at: new Date(),
        },
      })

      return tenant
    }),

  /**
   * Update business hours
   * Sets operating hours for each day of the week
   */
  updateBusinessHours: protectedProcedure
    .input(businessHoursSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: {
          business_hours: input as any,
          updated_at: new Date(),
        },
      })

      return tenant
    }),

  /**
   * Update notification preferences
   * Configures SMS and email notification settings
   */
  updateNotificationPreferences: protectedProcedure
    .input(notificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: {
          notification_preferences: input as any,
          updated_at: new Date(),
        },
      })

      return tenant
    }),

  /**
   * Complete onboarding step
   * Advances the user through onboarding flow
   */
  completeOnboardingStep: protectedProcedure
    .input(
      z.object({
        step: z.enum(['signup', 'business-info', 'pricing', 'calendar', 'phone', 'complete']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      const updateData: any = {
        onboarding_step: input.step,
        updated_at: new Date(),
      }

      // If completing the final step, mark onboarding as completed
      if (input.step === 'complete') {
        updateData.onboarding_completed = true
      }

      const tenant = await ctx.prisma.tenants.update({
        where: { id: ctx.tenantId },
        data: updateData,
      })

      return tenant
    }),

  /**
   * Connect Google Calendar
   * Exchanges OAuth code for tokens and stores them securely
   */
  connectCalendar: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      try {
        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(input.code)

        // Get primary calendar ID
        const calendarId = await getPrimaryCalendarId(tokens.access_token)

        // Encrypt refresh token
        const encryptedRefreshToken = encrypt(tokens.refresh_token)

        // Update tenant with calendar credentials
        const tenant = await ctx.prisma.tenants.update({
          where: { id: ctx.tenantId },
          data: {
            google_calendar_refresh_token: encryptedRefreshToken,
            google_calendar_access_token: tokens.access_token,
            google_calendar_token_expires_at: new Date(tokens.expiry_date),
            calendar_id: calendarId,
            updated_at: new Date(),
          },
        })

        return {
          success: true,
          calendarId,
        }
      } catch (error) {
        console.error('Error connecting Google Calendar:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect Google Calendar',
        })
      }
    }),

  /**
   * Disconnect Google Calendar
   * Removes calendar credentials from tenant
   */
  disconnectCalendar: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No tenant associated with user',
      })
    }

    const tenant = await ctx.prisma.tenants.update({
      where: { id: ctx.tenantId },
      data: {
        google_calendar_refresh_token: null,
        google_calendar_access_token: null,
        google_calendar_token_expires_at: null,
        calendar_id: null,
        updated_at: new Date(),
      },
    })

    return { success: true }
  }),

  /**
   * Provision phone number
   * Purchases phone number from VAPI, creates agent, and links them together
   */
  provisionPhoneNumber: protectedProcedure
    .input(
      z.object({
        areaCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No tenant associated with user',
        })
      }

      try {
        // Get current tenant info for agent name
        const tenant = await ctx.prisma.tenants.findUnique({
          where: { id: ctx.tenantId },
          select: { business_name: true },
        })

        if (!tenant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          })
        }

        // Step 1: Purchase phone number from VAPI
        const phoneNumber = await purchasePhoneNumber(input.areaCode)

        // Step 2: Create VAPI agent
        const agent = await createAgent({
          name: `${tenant.business_name} AI Assistant`,
          tenantId: ctx.tenantId,
        })

        // Step 3: Link phone number to agent
        await linkPhoneNumberToAgent(phoneNumber.id, agent.id)

        // Step 4: Update tenant with phone number and agent info
        const updatedTenant = await ctx.prisma.tenants.update({
          where: { id: ctx.tenantId },
          data: {
            phone_number: phoneNumber.number,
            phone_number_sid: phoneNumber.id,
            vapi_agent_id: agent.id,
            vapi_phone_number_id: phoneNumber.id,
            updated_at: new Date(),
          },
        })

        return {
          success: true,
          phoneNumber: phoneNumber.number,
          agentId: agent.id,
        }
      } catch (error) {
        console.error('Error provisioning phone number:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to provision phone number',
        })
      }
    }),
})
