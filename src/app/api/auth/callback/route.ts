/**
 * Auth Callback Route Handler
 *
 * This route handles OAuth callbacks from authentication providers (Google, etc.)
 * and password reset/email confirmation links from Supabase Auth.
 *
 * Flow:
 * 1. User clicks "Sign in with Google" or confirmation link
 * 2. Provider redirects back to this route with auth code
 * 3. Exchange code for session
 * 4. Check if user has tenant and onboarding status
 * 5. Redirect appropriately:
 *    - New user (no tenant) → /step-1-business (start onboarding)
 *    - Existing user (onboarding incomplete) → continue onboarding at their step
 *    - Existing user (onboarding complete) → /dashboard
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error: authError, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!authError && data.user) {
      // Determine where to redirect based on user's onboarding status
      let redirectPath = next || '/dashboard'

      try {
        // Check if user has a tenant record in our database
        const userRecord = await prisma.users.findUnique({
          where: { auth_user_id: data.user.id },
          select: { tenant_id: true }
        })

        console.log('[Auth Callback] User:', data.user.email, 'Auth ID:', data.user.id)
        console.log('[Auth Callback] User Record:', userRecord)

        if (!userRecord || !userRecord.tenant_id) {
          // New user - no tenant record yet, start onboarding
          console.log('[Auth Callback] → New user, redirecting to onboarding')
          redirectPath = '/step-1-business'
        } else {
          // User has a tenant, check onboarding status
          const tenant = await prisma.tenants.findUnique({
            where: { id: userRecord.tenant_id },
            select: {
              onboarding_completed: true,
              onboarding_step: true
            }
          })

          console.log('[Auth Callback] Tenant:', tenant)

          if (tenant && !tenant.onboarding_completed) {
            // Onboarding not complete - redirect to current step
            console.log('[Auth Callback] → Onboarding incomplete, redirecting to step:', tenant.onboarding_step)
            const stepMap: Record<string, string> = {
              'signup': '/step-1-business',
              'business_info': '/step-1-business',
              'pricing': '/step-2-pricing',
              'calendar': '/step-3-calendar',
              'phone': '/step-4-phone',
              'test_call': '/step-5-test',
              'complete': '/dashboard', // Handle completed onboarding
            }
            redirectPath = stepMap[tenant.onboarding_step] || '/step-1-business'
          } else {
            // Onboarding complete - use requested redirect or dashboard
            console.log('[Auth Callback] → Onboarding complete, redirecting to dashboard')
            redirectPath = next || '/dashboard'
          }
        }

        console.log('[Auth Callback] Final redirect path:', redirectPath)
      } catch (dbError) {
        console.error('[Auth Callback] Database error:', dbError)
        // On error, default to dashboard (fail open)
        redirectPath = next || '/dashboard'
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
