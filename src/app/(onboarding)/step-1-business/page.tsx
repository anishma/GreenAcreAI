/**
 * Onboarding Step 1: Business Information
 *
 * Collects basic business details, contact info, and service areas.
 */

import { BusinessForm } from '@/components/onboarding/business-form'

export default function Step1BusinessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tell us about your business</h1>
        <p className="mt-2 text-sm text-gray-600">
          Let's start with the basics. We'll use this information to personalize your AI assistant.
        </p>
      </div>

      <BusinessForm />
    </div>
  )
}
