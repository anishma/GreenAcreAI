/**
 * Supabase Client (Middleware)
 *
 * This client is used in Next.js middleware to refresh auth sessions
 * and protect routes. It must be used with updateSession() helper.
 *
 * Usage in middleware.ts:
 * import { updateSession } from '@/lib/supabase/middleware'
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get environment variables (safe for Edge Runtime as these are NEXT_PUBLIC)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both publishable key (preferred) and legacy anon key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      `Missing Supabase environment variables:\n` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗ MISSING'}\n` +
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗ MISSING'}`
    )
    // Return response without auth to prevent build failures
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/test-trpc') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  // Protected routes (dashboard, settings, calls, leads, bookings)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/calls') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/analytics')

  // Onboarding routes
  const isOnboardingRoute = pathname.startsWith('/step-')

  // If user is not authenticated
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check onboarding status for routing
  if (user && (isProtectedRoute || isOnboardingRoute)) {
    try {
      // Import prisma dynamically to avoid edge runtime issues
      const { prisma } = await import('@/lib/prisma')

      // Check user's tenant and onboarding status
      const userRecord = await prisma.users.findUnique({
        where: { auth_user_id: user.id },
        select: { tenant_id: true }
      })

      if (userRecord?.tenant_id) {
        const tenant = await prisma.tenants.findUnique({
          where: { id: userRecord.tenant_id },
          select: {
            onboarding_completed: true,
            onboarding_step: true
          }
        })

        if (tenant) {
          // User trying to access protected routes but onboarding not complete
          if (isProtectedRoute && !tenant.onboarding_completed) {
            const url = request.nextUrl.clone()
            // Redirect to their current onboarding step
            const stepMap: Record<string, string> = {
              'signup': '/step-1-business',
              'business_info': '/step-1-business',
              'pricing': '/step-2-pricing',
              'calendar': '/step-3-calendar',
              'phone': '/step-4-phone',
              'test_call': '/step-5-test',
              'complete': '/dashboard', // Handle completed onboarding
            }
            url.pathname = stepMap[tenant.onboarding_step] || '/step-1-business'
            return NextResponse.redirect(url)
          }

          // User trying to access onboarding but already completed
          if (isOnboardingRoute && tenant.onboarding_completed) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
          }
        }
      } else if (isProtectedRoute) {
        // User has no tenant record, redirect to onboarding
        const url = request.nextUrl.clone()
        url.pathname = '/step-1-business'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // On database error, log and continue (fail open)
      console.error('[Middleware] Error checking onboarding status:', error)
    }
  }

  // Redirect authenticated users away from login/signup pages
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
