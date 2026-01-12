/**
 * Onboarding Guard
 *
 * Server-side helper to check onboarding status and redirect if needed.
 * Use this in Server Components (pages/layouts) to protect routes.
 *
 * Why not in middleware?
 * - Middleware runs in Edge Runtime (Vercel Edge Functions)
 * - Prisma doesn't work in Edge Runtime (uses native Node.js modules)
 * - Server Components run in Node.js runtime where Prisma works perfectly
 */

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface OnboardingCheckResult {
  isComplete: boolean
  currentStep: string
  shouldRedirect: boolean
  redirectPath?: string
}

/**
 * Check if user has completed onboarding
 * @param authUserId - The authenticated user's ID from Supabase
 * @returns Onboarding status and redirect information
 */
export async function checkOnboardingStatus(
  authUserId: string
): Promise<OnboardingCheckResult> {
  try {
    // Find user record
    const userRecord = await prisma.users.findUnique({
      where: { auth_user_id: authUserId },
      select: { tenant_id: true }
    })

    if (!userRecord || !userRecord.tenant_id) {
      // No tenant = needs to start onboarding
      return {
        isComplete: false,
        currentStep: 'signup',
        shouldRedirect: true,
        redirectPath: '/step-1-business'
      }
    }

    // Check tenant's onboarding status
    const tenant = await prisma.tenants.findUnique({
      where: { id: userRecord.tenant_id },
      select: {
        onboarding_completed: true,
        onboarding_step: true
      }
    })

    if (!tenant) {
      // Tenant not found = data inconsistency, send to onboarding
      return {
        isComplete: false,
        currentStep: 'signup',
        shouldRedirect: true,
        redirectPath: '/step-1-business'
      }
    }

    if (tenant.onboarding_completed) {
      // Onboarding complete
      return {
        isComplete: true,
        currentStep: tenant.onboarding_step,
        shouldRedirect: false
      }
    }

    // Onboarding not complete - determine which step to redirect to
    const stepMap: Record<string, string> = {
      'signup': '/step-1-business',
      'business_info': '/step-1-business',
      'pricing': '/step-2-pricing',
      'calendar': '/step-3-calendar',
      'phone': '/step-4-phone',
      'test_call': '/step-5-test',
      'complete': '/dashboard', // Safety fallback
    }

    return {
      isComplete: false,
      currentStep: tenant.onboarding_step,
      shouldRedirect: true,
      redirectPath: stepMap[tenant.onboarding_step] || '/step-1-business'
    }
  } catch (error) {
    console.error('[Onboarding Guard] Error checking status:', error)
    // On error, fail open (don't block access)
    return {
      isComplete: true, // Assume complete to avoid redirect loop
      currentStep: 'unknown',
      shouldRedirect: false
    }
  }
}

/**
 * Require onboarding to be complete before accessing a route
 * Redirects to onboarding if not complete
 *
 * Usage in Server Component:
 * ```typescript
 * export default async function DashboardPage() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   if (user) {
 *     await requireOnboardingComplete(user.id)
 *   }
 *
 *   // ... rest of page
 * }
 * ```
 */
export async function requireOnboardingComplete(authUserId: string): Promise<void> {
  const status = await checkOnboardingStatus(authUserId)

  if (!status.isComplete && status.shouldRedirect && status.redirectPath) {
    redirect(status.redirectPath)
  }
}

/**
 * Require onboarding to be incomplete (for onboarding pages)
 * Redirects to dashboard if already complete
 *
 * Usage in Onboarding Pages:
 * ```typescript
 * export default async function OnboardingStep1() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   if (user) {
 *     await requireOnboardingIncomplete(user.id)
 *   }
 *
 *   // ... rest of page
 * }
 * ```
 */
export async function requireOnboardingIncomplete(authUserId: string): Promise<void> {
  const status = await checkOnboardingStatus(authUserId)

  if (status.isComplete) {
    redirect('/dashboard')
  }
}
