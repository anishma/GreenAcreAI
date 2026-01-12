'use client'

/**
 * Calendar Settings Page
 *
 * Manage Google Calendar integration including:
 * - Connected calendar info
 * - Disconnect/Reconnect buttons
 * - Recent sync status
 */

import { useState } from 'react'
import { Calendar as CalendarIcon, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { formatDistanceToNow } from 'date-fns'

export default function CalendarSettingsPage() {
  const { toast } = useToast()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Fetch current tenant data
  const { data: tenant, isLoading, refetch } = trpc.tenant.getCurrent.useQuery()

  const isConnected = Boolean(tenant?.google_calendar_refresh_token)
  const calendarId = tenant?.calendar_id
  const lastSyncedAt = null // Field doesn't exist in schema yet

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      // TODO: Call tRPC procedure to disconnect calendar
      // await disconnectCalendar.mutateAsync()
      toast({
        title: 'Calendar disconnected',
        description: 'Your Google Calendar has been disconnected successfully.',
      })
      refetch()
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      toast({
        title: 'Error',
        description: 'Failed to disconnect calendar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleReconnect = () => {
    // Redirect to Google OAuth flow
    // State parameter will be used to redirect back to settings page after auth
    const state = encodeURIComponent('/settings/calendar')
    window.location.href = `/api/auth/google?state=${state}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading calendar settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Google Calendar Integration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your calendar connection for booking appointments
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Connection Status</CardTitle>
              <CardDescription>
                {isConnected
                  ? 'Your Google Calendar is connected'
                  : 'No calendar connected'}
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && (
            <>
              {/* Calendar Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Calendar ID</span>
                  <span className="font-mono text-xs">{calendarId || 'N/A'}</span>
                </div>
                {lastSyncedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last synced</span>
                    <span>{formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
                <Button variant="outline" onClick={handleReconnect}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reconnect
                </Button>
              </div>
            </>
          )}

          {!isConnected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to enable automatic appointment booking
                and availability checking.
              </p>
              <Button onClick={handleReconnect}>Connect Google Calendar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sync Activity</CardTitle>
            <CardDescription>
              View recent calendar synchronization events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastSyncedAt ? (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">Sync successful</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sync activity recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Help */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Availability checking:</strong> The AI assistant checks your calendar
            for available time slots when customers want to book appointments.
          </p>
          <p>
            <strong>Automatic booking:</strong> When a customer confirms an appointment,
            it's automatically added to your Google Calendar.
          </p>
          <p>
            <strong>Real-time sync:</strong> Changes to your calendar are synced in
            real-time to ensure accurate availability.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
