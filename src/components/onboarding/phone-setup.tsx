'use client'

/**
 * Phone Setup Component
 *
 * Provisions a phone number through VAPI for the AI assistant.
 * Allows optional area code preference.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export function PhoneSetup() {
  const router = useRouter()
  const { toast } = useToast()
  const [areaCode, setAreaCode] = useState('')

  // Get current tenant data
  const { data: tenant, refetch: refetchTenant } = trpc.tenant.getCurrent.useQuery()

  // Mutations
  const provisionPhoneNumber = trpc.tenant.provisionPhoneNumber.useMutation()
  const completeOnboardingStep = trpc.tenant.completeOnboardingStep.useMutation()

  // Check if phone is already provisioned
  const isProvisioned = !!tenant?.phone_number

  const handleProvision = async () => {
    // Validate area code is provided
    if (!areaCode || areaCode.length !== 3) {
      toast({
        title: 'Area code required',
        description: 'Please enter a 3-digit area code',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await provisionPhoneNumber.mutateAsync({
        areaCode: areaCode,
      })

      toast({
        title: 'Phone number provisioned',
        description: `Your AI assistant's phone number is ${result.phoneNumber}`,
      })

      // Refresh tenant data to show provisioned state
      await refetchTenant()
    } catch (error) {
      console.error('Error provisioning phone number:', error)
      toast({
        title: 'Provisioning failed',
        description: error instanceof Error ? error.message : 'Failed to provision phone number. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleContinue = async () => {
    try {
      // Mark this step as complete
      await completeOnboardingStep.mutateAsync({ step: 'phone' })

      // Navigate to step 5
      router.push('/step-5-test')
    } catch (error) {
      console.error('Error completing step:', error)
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSkip = async () => {
    try {
      // Mark step as complete even though skipped
      await completeOnboardingStep.mutateAsync({ step: 'phone' })

      toast({
        title: 'Step skipped',
        description: 'You can provision a phone number later in settings',
      })

      // Navigate to step 5
      router.push('/step-5-test')
    } catch (error) {
      console.error('Error skipping step:', error)
      toast({
        title: 'Error',
        description: 'Failed to continue. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
    const cleaned = phoneNumber.replace(/\D/g, '')
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phoneNumber
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Provisioning Status */}
      {provisionPhoneNumber.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Provisioning your phone number... This may take a minute.
          </AlertDescription>
        </Alert>
      ) : isProvisioned ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Phone number provisioned successfully!
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Provision/Display Section */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {isProvisioned ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Phone className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Your AI Phone Number</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatPhoneNumber(tenant.phone_number!)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Customers can call this number to speak with your AI assistant
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <Phone className="h-8 w-8 text-gray-600" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-semibold text-gray-900">
                Provision Your Phone Number
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                We'll get you a dedicated phone number that customers can call to speak with
                your AI assistant. It will automatically handle bookings, quotes, and questions.
              </p>
            </div>

            {/* Area Code Input */}
            <div className="w-full max-w-xs space-y-2">
              <Label htmlFor="areaCode">Area Code <span className="text-red-500">*</span></Label>
              <Input
                id="areaCode"
                type="text"
                placeholder="e.g., 415"
                value={areaCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                  setAreaCode(value)
                }}
                maxLength={3}
                required
                disabled={provisionPhoneNumber.isLoading}
              />
              <p className="text-xs text-gray-500">
                Enter a 3-digit US area code for your phone number
              </p>
            </div>

            <Button
              onClick={handleProvision}
              disabled={provisionPhoneNumber.isLoading || areaCode.length !== 3}
              size="lg"
            >
              <Phone className="h-4 w-4 mr-2" />
              {provisionPhoneNumber.isLoading ? 'Provisioning...' : 'Get Phone Number'}
            </Button>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push('/step-3-calendar')}>
          Back
        </Button>
        <div className="flex gap-3">
          {!isProvisioned && (
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={completeOnboardingStep.isLoading}
          >
            {completeOnboardingStep.isLoading ? 'Saving...' : 'Continue to Test Call'}
          </Button>
        </div>
      </div>
    </div>
  )
}
