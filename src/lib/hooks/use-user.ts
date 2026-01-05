/**
 * useUser Hook
 *
 * React hook to get the current authenticated user and their tenant information.
 * Automatically subscribes to auth state changes and updates in real-time.
 *
 * TEMPORARY: Auth disabled for testing. Returns mock user.
 *
 * Usage:
 * 'use client'
 * import { useUser } from '@/lib/hooks/use-user'
 *
 * function MyComponent() {
 *   const { user, tenantId, isLoading } = useUser()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!user) return <div>Not logged in</div>
 *
 *   return <div>Hello {user.email}</div>
 * }
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface UseUserReturn {
  user: User | null
  tenantId: string | null
  isLoading: boolean
  error: Error | null
}

// TEMPORARY: Mock user for testing while OAuth is disabled
const MOCK_USER_FOR_TESTING = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID format for mock user
  email: 'test@greenacreai.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        if (USE_MOCK_AUTH) {
          // Use mock user for testing
          setUser(MOCK_USER_FOR_TESTING)
          // Mock tenant ID will be handled by tRPC context
          setTenantId('mock-tenant-id')
          setIsLoading(false)
          return
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        setUser(user)

        // Fetch tenant_id if user is authenticated
        if (user) {
          const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('auth_user_id', user.id)
            .single()

          if (dbError) {
            console.error('Error fetching tenant_id:', dbError)
          } else {
            setTenantId(userData?.tenant_id ?? null)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    if (USE_MOCK_AUTH) {
      // Skip subscription for mock auth
      return
    }

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch tenant_id when user signs in
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', session.user.id)
          .single()

        setTenantId(userData?.tenant_id ?? null)
      } else {
        setTenantId(null)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [USE_MOCK_AUTH])

  return { user, tenantId, isLoading, error }
}
