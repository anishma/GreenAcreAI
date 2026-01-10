/**
 * Next.js Middleware
 *
 * This middleware runs on every request and handles:
 * 1. Session refresh (keep users logged in)
 * 2. Route protection (redirect unauthenticated users to login)
 * 3. Redirect authenticated users away from login/signup pages
 *
 * Protected routes:
 * - /dashboard/*
 * - /settings/*
 * - /calls/*
 * - /leads/*
 * - /bookings/*
 *
 * Public routes:
 * - /
 * - /login
 * - /signup
 * - /auth/*
 * - /api/trpc/* (tRPC API routes - auth handled by procedures)
 * - /api/webhooks/*
 * - /test-trpc (testing endpoint)
 */

import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

// Force middleware to run in Node.js runtime instead of Edge
export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
