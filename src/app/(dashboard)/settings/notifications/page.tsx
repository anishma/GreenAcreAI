'use client'

/**
 * Notification Settings Page
 *
 * Manage notification preferences including:
 * - SMS notifications for new leads
 * - SMS notifications for new bookings
 * - Email daily summary (future)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const notificationPreferencesSchema = z.object({
  smsOnNewLead: z.boolean(),
  smsOnNewBooking: z.boolean(),
  emailDailySummary: z.boolean(),
})

type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>

export default function NotificationSettingsPage() {
  const { toast } = useToast()

  // Fetch current tenant data
  const { data: tenant, isLoading } = trpc.tenant.getCurrent.useQuery()

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      smsOnNewLead: true,
      smsOnNewBooking: true,
      emailDailySummary: false,
    },
  })

  // Mutation
  const updateNotificationPreferences = trpc.tenant.updateNotificationPreferences.useMutation()

  // Load tenant notification preferences
  useEffect(() => {
    if (tenant && tenant.notification_preferences) {
      const prefs = tenant.notification_preferences as any
      reset({
        smsOnNewLead: prefs.smsOnNewLead ?? true,
        smsOnNewBooking: prefs.smsOnNewBooking ?? true,
        emailDailySummary: prefs.emailDailySummary ?? false,
      })
    }
  }, [tenant, reset])

  const smsOnNewLead = watch('smsOnNewLead')
  const smsOnNewBooking = watch('smsOnNewBooking')
  const emailDailySummary = watch('emailDailySummary')

  const onSubmit = async (data: NotificationPreferences) => {
    try {
      await updateNotificationPreferences.mutateAsync({
        sms_new_lead: data.smsOnNewLead,
        sms_new_booking: data.smsOnNewBooking,
        email_daily_summary: data.emailDailySummary,
      })

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      })
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to be notified about important events
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Receive text messages for important events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SMS on New Lead */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="smsOnNewLead" className="text-base cursor-pointer">
                  New lead captured
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when a new lead is captured from a call
                </p>
              </div>
              <Switch
                id="smsOnNewLead"
                checked={smsOnNewLead}
                onCheckedChange={(checked) => setValue('smsOnNewLead', checked)}
              />
            </div>

            <Separator />

            {/* SMS on New Booking */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="smsOnNewBooking" className="text-base cursor-pointer">
                  New booking made
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when an appointment is successfully booked
                </p>
              </div>
              <Switch
                id="smsOnNewBooking"
                checked={smsOnNewBooking}
                onCheckedChange={(checked) => setValue('smsOnNewBooking', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive email summaries and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Daily Summary */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="emailDailySummary" className="text-base cursor-pointer">
                  Daily summary email
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive a daily email with call activity, leads, and bookings
                </p>
              </div>
              <Switch
                id="emailDailySummary"
                checked={emailDailySummary}
                onCheckedChange={(checked) => setValue('emailDailySummary', checked)}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Email notifications are a future enhancement
            </p>
          </CardContent>
        </Card>

        {/* Phone Number Info */}
        {tenant?.phone && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Notification Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                SMS notifications will be sent to:{' '}
                <span className="font-medium text-foreground">{tenant.phone}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Email notifications will be sent to:{' '}
                <span className="font-medium text-foreground">{tenant.email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Update your contact information in the Business settings to change where
                notifications are sent.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  )
}
