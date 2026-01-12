/**
 * Onboarding Step 4: Phone Number Setup
 *
 * Provisions a phone number through VAPI for the AI assistant.
 */

import { createClient } from '@/lib/supabase/server'
import { PhoneSetup } from '@/components/onboarding/phone-setup'
import { requireOnboardingIncomplete } from '@/lib/auth/onboarding-guard'

export default async function Step4PhonePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await requireOnboardingIncomplete(user.id)
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Get your AI phone number</h1>
        <p className="mt-2 text-sm text-gray-600">
          We'll provision a dedicated phone number for your AI assistant to handle customer calls.
        </p>
      </div>

      <PhoneSetup />
    </div>
  )
}
