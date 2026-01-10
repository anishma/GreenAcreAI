/**
 * Google OAuth Callback Handler
 *
 * Handles the OAuth callback from Google after user authorizes calendar access.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  // const state = searchParams.get('state') // Unused for now, but available for CSRF protection

  // Handle error from Google
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/step-3-calendar?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/step-3-calendar?error=no_code', request.url)
    )
  }

  // Redirect back to calendar page with code
  // The frontend will handle calling the tRPC mutation
  return NextResponse.redirect(
    new URL(`/step-3-calendar?code=${encodeURIComponent(code)}`, request.url)
  )
}
