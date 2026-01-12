/**
 * Onboarding Step 3: Google Calendar Integration
 *
 * Allows users to connect their Google Calendar for booking integration.
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CalendarConnect } from '@/components/onboarding/calendar-connect'
import { Skeleton } from '@/components/ui/skeleton'
import { requireOnboardingIncomplete } from '@/lib/auth/onboarding-guard'

function CalendarStepContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Connect your calendar</h1>
        <p className="mt-2 text-sm text-gray-600">
          Connect your Google Calendar to automatically schedule bookings and avoid double-bookings.
        </p>
      </div>

      <CalendarConnect />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export default async function Step3CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await requireOnboardingIncomplete(user.id)
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <CalendarStepContent />
    </Suspense>
  )
}
