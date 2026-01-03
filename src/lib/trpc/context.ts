/**
 * tRPC Context
 *
 * Creates the context for all tRPC procedures.
 * This context is available in all API routes and contains:
 * - user: The authenticated user (if logged in)
 * - tenantId: The user's tenant ID (if assigned)
 * - prisma: Prisma client instance
 */

import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'

export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get authenticated user from Supabase
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch tenant_id from database if user is authenticated
  let tenantId: string | null = null
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { authUserId: user.id },
      select: { tenantId: true },
    })
    tenantId = dbUser?.tenantId ?? null
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
