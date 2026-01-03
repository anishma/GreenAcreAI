/**
 * Sign Out Route Handler
 *
 * This route handles user sign out and session termination.
 *
 * Usage:
 * - POST /api/auth/signout
 * - Called from client-side sign out button
 * - Clears session cookies and redirects to home page
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Sign out from Supabase (clears session)
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}
