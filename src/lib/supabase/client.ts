/**
 * Supabase Client (Client-Side)
 *
 * This client is used in Client Components (components with 'use client' directive).
 * It uses cookies for auth state management and automatically refreshes sessions.
 *
 * Usage:
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data: { user } } = await supabase.auth.getUser()
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both publishable key (preferred) and legacy anon key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase environment variables:\n` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗ MISSING'}\n` +
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗ MISSING'}\n` +
        `Check your .env file or Vercel environment variables.`
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
