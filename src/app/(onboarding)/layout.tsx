/**
 * Onboarding Layout
 *
 * Wrapper layout for the 5-step tenant onboarding flow.
 * Includes progress indicator and centered content area.
 */

import { ProgressSteps } from '@/components/onboarding/progress-steps'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to GreenAcre AI
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Let's set up your voice AI assistant in just a few steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <ProgressSteps />
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
