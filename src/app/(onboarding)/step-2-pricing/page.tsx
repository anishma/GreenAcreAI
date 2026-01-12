/**
 * Onboarding Step 2: Pricing Configuration
 *
 * Allows users to configure pricing tiers and quote settings.
 */

import { createClient } from '@/lib/supabase/server'
import { PricingForm } from '@/components/onboarding/pricing-form'
import { requireOnboardingIncomplete } from '@/lib/auth/onboarding-guard'

export default async function Step2PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await requireOnboardingIncomplete(user.id)
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configure your pricing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up pricing tiers based on lawn size. You can adjust these later in settings.
        </p>
      </div>

      <PricingForm />
    </div>
  )
}
