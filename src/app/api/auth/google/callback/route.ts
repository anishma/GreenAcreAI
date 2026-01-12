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
  const state = searchParams.get('state') // Redirect path after auth

  // Determine redirect URL (onboarding vs settings)
  const redirectPath = state && state !== 'null' ? decodeURIComponent(state) : '/step-3-calendar'

  // Handle error from Google
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=no_code`, request.url)
    )
  }

  // Redirect back to the original page with code
  // The frontend will handle calling the tRPC mutation
  return NextResponse.redirect(
    new URL(`${redirectPath}?code=${encodeURIComponent(code)}`, request.url)
  )
}
