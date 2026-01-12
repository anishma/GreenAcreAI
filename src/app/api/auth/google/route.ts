/**
 * Google OAuth Initiation Endpoint
 *
 * Redirects user to Google OAuth consent screen for calendar access.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google/oauth'

// Force dynamic rendering (required for searchParams access)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get state parameter for redirect after auth (optional)
    const state = request.nextUrl.searchParams.get('state') || '/dashboard'

    // Generate Google OAuth URL
    const authUrl = getGoogleAuthUrl(state)

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Google OAuth] Error initiating OAuth flow:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    )
  }
}
