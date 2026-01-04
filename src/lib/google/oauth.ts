/**
 * Google OAuth Helper Functions
 *
 * Handles Google Calendar OAuth flow for tenant calendar integration.
 */

import { google } from 'googleapis'

/**
 * Create OAuth2 client
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Generate Google OAuth authorization URL
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client()

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent', // Force consent screen to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 *
 * @param code - Authorization code from OAuth callback
 * @returns Token object with access_token, refresh_token, and expiry_date
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client()

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token) {
    throw new Error('No access token received from Google')
  }

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received from Google. User may need to revoke access and re-authorize.')
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000, // Default 1 hour
    scope: tokens.scope,
    token_type: tokens.token_type,
  }
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token
 * @returns New access token and expiry date
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token')
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  }
}

/**
 * Get calendar list for authenticated user
 *
 * @param accessToken - Google access token
 * @returns List of calendars
 */
export async function getCalendarList(accessToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.calendarList.list()

  return response.data.items || []
}

/**
 * Get primary calendar ID
 *
 * @param accessToken - Google access token
 * @returns Primary calendar ID
 */
export async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  const calendars = await getCalendarList(accessToken)
  const primaryCalendar = calendars.find((cal) => cal.primary)

  if (!primaryCalendar?.id) {
    throw new Error('No primary calendar found')
  }

  return primaryCalendar.id
}

/**
 * Create a calendar event
 *
 * @param accessToken - Google access token
 * @param calendarId - Calendar ID
 * @param event - Event details
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    attendees?: Array<{ email: string }>
  }
) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  })

  return response.data
}

/**
 * Check availability on calendar
 *
 * @param accessToken - Google access token
 * @param calendarId - Calendar ID
 * @param timeMin - Start time (ISO string)
 * @param timeMax - End time (ISO string)
 * @returns List of busy time periods
 */
export async function checkCalendarAvailability(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  })

  return response.data.calendars?.[calendarId]?.busy || []
}
