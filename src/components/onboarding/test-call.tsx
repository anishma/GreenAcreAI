'use client'

/**
 * Test Call Component
 *
 * Final onboarding step - test the AI phone assistant.
 * Displays phone number, monitors for incoming calls via Supabase Realtime,
 * and completes onboarding when test call is made.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, CheckCircle2, Loader2, PhoneCall, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'

type CallStatus = 'waiting' | 'call-detected' | 'call-completed'

export function TestCall() {
  const router = useRouter()
  const { toast } = useToast()
  const [callStatus, setCallStatus] = useState<CallStatus>('waiting')
  const [detectedCallId, setDetectedCallId] = useState<string | null>(null)

  // Get current tenant data
  const { data: tenant, refetch: refetchTenant } = trpc.tenant.getCurrent.useQuery()

  // Mutations
  const completeTestCall = trpc.tenant.completeTestCall.useMutation()

  // Check if already completed
  const isAlreadyCompleted = tenant?.onboarding_completed || tenant?.test_call_completed

  useEffect(() => {
    if (isAlreadyCompleted) {
      setCallStatus('call-completed')
      return
    }

    if (!tenant?.id) {
      return
    }

    // Subscribe to calls table for real-time updates
    const supabase = createClient()

    const channel = supabase
      .channel('test-call-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          console.log('New call detected:', payload)
          setDetectedCallId(payload.new.id as string)
          setCallStatus('call-detected')

          toast({
            title: 'Call detected!',
            description: 'Your test call is in progress...',
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          console.log('Call updated:', payload)
          const call = payload.new as any

          // Only track the specific detected call (if we have one)
          // This prevents other calls from triggering completion
          if (detectedCallId && call.id !== detectedCallId) {
            return
          }

          // If call has ended, mark as completed
          if (call.ended_at || call.status === 'completed' || call.status === 'ended') {
            setCallStatus('call-completed')
            handleCallCompleted()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, isAlreadyCompleted])

  const handleCallCompleted = async () => {
    try {
      await completeTestCall.mutateAsync()

      toast({
        title: 'Test call completed!',
        description: 'Your onboarding is complete. Redirecting to dashboard...',
      })

      // Refresh tenant data
      await refetchTenant()

      // Wait a moment then redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error completing test call:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark test call as complete. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleManualComplete = async () => {
    try {
      await completeTestCall.mutateAsync()

      toast({
        title: 'Onboarding completed!',
        description: 'Redirecting to dashboard...',
      })

      // Refresh tenant data
      await refetchTenant()

      // Wait a moment then redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
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

  // If no phone number provisioned, show warning
  if (!tenant?.phone_number) {
    return (
      <div className="space-y-6 bg-white p-6 rounded-lg shadow">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No phone number has been provisioned. Please go back and complete the phone setup step.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => router.push('/step-4-phone')}>
            Back to Phone Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Call Status Alert */}
      {callStatus === 'waiting' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Waiting for your test call...</AlertDescription>
        </Alert>
      )}

      {callStatus === 'call-detected' && (
        <Alert className="border-blue-200 bg-blue-50">
          <PhoneCall className="h-4 w-4 text-blue-600 animate-pulse" />
          <AlertDescription className="text-blue-800">
            Call in progress! Continue your conversation with the AI assistant.
          </AlertDescription>
        </Alert>
      )}

      {callStatus === 'call-completed' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Test call completed successfully! You're all set to go live.
          </AlertDescription>
        </Alert>
      )}

      {/* Phone Number Display */}
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
          <Phone className="h-10 w-10 text-blue-600" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Your AI Assistant's Phone Number</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatPhoneNumber(tenant.phone_number)}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 max-w-md">
          <h4 className="font-semibold text-gray-900 mb-3">Test Instructions:</h4>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>Call the number above from your phone</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>Have a conversation with your AI assistant</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>Try asking for a quote or booking an appointment</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>Hang up when done - we'll automatically detect the call</span>
            </li>
          </ol>
        </div>

        {/* Status Message */}
        {callStatus === 'waiting' && (
          <p className="text-sm text-gray-600 text-center">
            Make your call whenever you're ready. We'll automatically detect it.
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push('/step-4-phone')}>
          Back
        </Button>
        <div className="flex gap-3">
          {callStatus !== 'call-completed' && (
            <Button
              variant="outline"
              onClick={handleManualComplete}
              disabled={completeTestCall.isLoading}
            >
              Skip Test Call
            </Button>
          )}
          {callStatus === 'call-completed' && (
            <Button
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
