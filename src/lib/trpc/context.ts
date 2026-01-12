/**
 * tRPC Context
 *
 * Creates the context for all tRPC procedures.
 * This context is available in all API routes and contains:
 * - user: The authenticated user (if logged in)
 * - tenantId: The user's tenant ID (if assigned)
 * - prisma: Prisma client instance
 *
 * TEMPORARY: Auth disabled for testing. Using mock user/tenant.
 */

import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'

// TEMPORARY: Mock user for testing while OAuth is disabled
const MOCK_USER_FOR_TESTING = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID format for mock user
  email: 'test@greenacreai.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

export async function createContext(_opts?: FetchCreateContextFnOptions) {
  // TEMPORARY: Skip auth and use mock user for testing
  const USE_MOCK_AUTH = process.env.DISABLE_AUTH === 'true'

  let user: User | null = null
  let tenantId: string | null = null

  if (USE_MOCK_AUTH) {
    // Use mock user for testing
    user = MOCK_USER_FOR_TESTING

    // Try to find existing user in database to get tenantId
    // Don't create anything - let the onboarding flow create the tenant
    try {
      const dbUser = await prisma.users.findUnique({
        where: { auth_user_id: MOCK_USER_FOR_TESTING.id },
        select: { tenant_id: true },
      })

      tenantId = dbUser?.tenant_id ?? null
      console.log('[Context] Mock auth - dbUser:', dbUser, 'tenantId:', tenantId)
    } catch (error) {
      console.error('[Context] Error finding user:', error)
      tenantId = null
    }
  } else {
    // Normal auth flow
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    user = supabaseUser

    // Fetch tenant_id from database if user is authenticated
    if (user) {
      console.log('[Context] Real auth - User ID:', user.id, 'Email:', user.email)
      const dbUser = await prisma.users.findUnique({
        where: { auth_user_id: user.id },
        select: { tenant_id: true },
      })
      console.log('[Context] Real auth - dbUser:', dbUser, 'tenantId:', dbUser?.tenant_id)
      tenantId = dbUser?.tenant_id ?? null
    }
  }

  return {
    user,
    tenantId,
    prisma,
  }
}

export type Context = {
  user: User | null
  tenantId: string | null
  prisma: typeof prisma
}
