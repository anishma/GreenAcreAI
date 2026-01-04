/**
 * Onboarding Step 5: Test Call & Go Live
 *
 * Final onboarding step where users test their AI phone assistant.
 */

import { TestCall } from '@/components/onboarding/test-call'

export default function Step5TestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test your AI assistant</h1>
        <p className="mt-2 text-sm text-gray-600">
          Make a test call to ensure everything is working correctly, then go live!
        </p>
      </div>

      <TestCall />
    </div>
  )
}
