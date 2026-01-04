'use client'

/**
 * Calendar Connect Component
 *
 * Handles Google Calendar OAuth flow during onboarding.
 * Shows connect button or connected state with disconnect option.
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export function CalendarConnect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  // Get current tenant data
  const { data: tenant, refetch: refetchTenant } = trpc.tenant.getCurrent.useQuery()

  // Mutations
  const connectCalendar = trpc.tenant.connectCalendar.useMutation()
  const disconnectCalendar = trpc.tenant.disconnectCalendar.useMutation()
  const completeOnboardingStep = trpc.tenant.completeOnboardingStep.useMutation()

  // Check if calendar is connected
  const isConnected = !!tenant?.calendar_id

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams?.get('code')
    const error = searchParams?.get('error')

    if (error) {
      toast({
        title: 'Calendar connection failed',
        description: error === 'access_denied'
          ? 'You denied access to your calendar'
          : 'Failed to connect to Google Calendar',
        variant: 'destructive',
      })
      // Clear error from URL
      window.history.replaceState({}, '', '/step-3-calendar')
      return
    }

    if (code && !isConnected) {
      handleConnectWithCode(code)
    }
  }, [searchParams])

  const handleConnectWithCode = async (code: string) => {
    setIsConnecting(true)

    try {
      await connectCalendar.mutateAsync({ code })

      toast({
        title: 'Calendar connected',
        description: 'Your Google Calendar has been successfully connected',
      })

      // Refresh tenant data to show connected state
      await refetchTenant()

      // Clear code from URL
      window.history.replaceState({}, '', '/step-3-calendar')
    } catch (error) {
      console.error('Error connecting calendar:', error)
      toast({
        title: 'Connection failed',
        description: 'Failed to connect your calendar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectClick = () => {
    // Build Google OAuth URL
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
    )

    if (!clientId) {
      toast({
        title: 'Configuration error',
        description: 'Google OAuth is not configured. Please contact support.',
        variant: 'destructive',
      })
      return
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

    // Redirect to Google OAuth
    window.location.href = authUrl
  }

  const handleDisconnect = async () => {
    try {
      await disconnectCalendar.mutateAsync()

      toast({
        title: 'Calendar disconnected',
        description: 'Your Google Calendar has been disconnected',
      })

      // Refresh tenant data
      await refetchTenant()
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      toast({
        title: 'Error',
        description: 'Failed to disconnect calendar. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleContinue = async () => {
    try {
      // Mark this step as complete
      await completeOnboardingStep.mutateAsync({ step: 'calendar' })

      // Navigate to step 4
      router.push('/step-4-phone')
    } catch (error) {
      console.error('Error completing step:', error)
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSkip = async () => {
    try {
      // Mark step as complete even though skipped
      await completeOnboardingStep.mutateAsync({ step: 'calendar' })

      toast({
        title: 'Step skipped',
        description: 'You can connect your calendar later in settings',
      })

      // Navigate to step 4
      router.push('/step-4-phone')
    } catch (error) {
      console.error('Error skipping step:', error)
      toast({
        title: 'Error',
        description: 'Failed to continue. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Connection Status */}
      {isConnecting ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Connecting to Google Calendar...</AlertDescription>
        </Alert>
      ) : isConnected ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Google Calendar connected successfully!
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Connect/Disconnect Section */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Calendar Connected</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bookings will be automatically added to your Google Calendar
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectCalendar.isLoading}
            >
              {disconnectCalendar.isLoading ? 'Disconnecting...' : 'Disconnect Calendar'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect Google Calendar
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                When customers book appointments through the AI assistant, they'll automatically
                appear on your calendar. This prevents double-bookings and keeps you organized.
              </p>
            </div>
            <Button onClick={handleConnectClick} disabled={isConnecting} size="lg">
              <Calendar className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push('/step-2-pricing')}>
          Back
        </Button>
        <div className="flex gap-3">
          {!isConnected && (
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={completeOnboardingStep.isLoading}
          >
            {completeOnboardingStep.isLoading ? 'Saving...' : 'Continue to Phone Setup'}
          </Button>
        </div>
      </div>
    </div>
  )
}
