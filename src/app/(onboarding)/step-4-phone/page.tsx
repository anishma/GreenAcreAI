/**
 * Onboarding Step 4: Phone Number Setup
 *
 * Provisions a phone number through VAPI for the AI assistant.
 */

import { PhoneSetup } from '@/components/onboarding/phone-setup'

export default function Step4PhonePage() {
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
