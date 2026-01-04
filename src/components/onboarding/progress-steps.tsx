'use client'

/**
 * Progress Steps Component
 *
 * Visual progress indicator for the 5-step onboarding flow.
 * Shows completed, current, and upcoming steps.
 */

import { Check } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const steps = [
  {
    id: 1,
    name: 'Business Info',
    description: 'Basic details',
    path: '/step-1-business',
  },
  {
    id: 2,
    name: 'Pricing',
    description: 'Set your rates',
    path: '/step-2-pricing',
  },
  {
    id: 3,
    name: 'Calendar',
    description: 'Connect Google',
    path: '/step-3-calendar',
  },
  {
    id: 4,
    name: 'Phone',
    description: 'Get your number',
    path: '/step-4-phone',
  },
  {
    id: 5,
    name: 'Test & Launch',
    description: 'Go live',
    path: '/step-5-test',
  },
]

export function ProgressSteps() {
  const pathname = usePathname()

  // Determine current step based on pathname
  const currentStepIndex = steps.findIndex((step) => pathname?.includes(step.path))
  const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <li
              key={step.id}
              className={cn('relative', index !== steps.length - 1 && 'pr-8 sm:pr-20')}
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-4 -ml-px mt-0.5 h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full w-full transition-colors',
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    )}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div className="group relative flex items-start">
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted &&
                        'border-green-600 bg-green-600 hover:bg-green-700',
                      isCurrent &&
                        'border-green-600 bg-white',
                      isUpcoming && 'border-gray-300 bg-white hover:border-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          isCurrent && 'bg-green-600',
                          isUpcoming && 'bg-transparent'
                        )}
                      />
                    )}
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-green-600',
                      isUpcoming && 'text-gray-500'
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs text-gray-500">{step.description}</span>
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
