/**
 * Onboarding Step 2: Pricing Configuration
 *
 * Allows users to configure pricing tiers and quote settings.
 */

import { PricingForm } from '@/components/onboarding/pricing-form'

export default function Step2PricingPage() {
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
