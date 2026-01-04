/**
 * Onboarding Step 3: Google Calendar Integration
 *
 * Allows users to connect their Google Calendar for booking integration.
 */

import { CalendarConnect } from '@/components/onboarding/calendar-connect'

export default function Step3CalendarPage() {
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
