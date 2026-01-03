/**
 * Login Page
 *
 * Authentication page with Google OAuth.
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-muted-foreground mt-2">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full gap-2"
        size="lg"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          />
          <path
            fill="currentColor"
            d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z"
          />
          <path
            fill="currentColor"
            d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          />
          <path
            fill="currentColor"
            d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
          />
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <a href="/signup" className="text-primary hover:underline">
          Sign up
        </a>
      </p>
    </div>
  )
}
