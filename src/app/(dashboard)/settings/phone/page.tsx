'use client'

/**
 * Phone Settings Page
 *
 * Manage phone number and VAPI agent settings including:
 * - Current phone number display
 * - VAPI agent status
 * - Change number option (future enhancement)
 */

import { Phone as PhoneIcon, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { formatPhoneNumber } from '@/lib/utils/phone'

export default function PhoneSettingsPage() {
  const { toast } = useToast()

  // Fetch current tenant data
  const { data: tenant, isLoading } = trpc.tenant.getCurrent.useQuery()

  const phoneNumber = tenant?.phoneNumber
  const vapiAgentId = tenant?.vapiAgentId
  const vapiPhoneNumberId = tenant?.vapiPhoneNumberId

  const isPhoneNumberActive = Boolean(phoneNumber && vapiAgentId)

  const handleChangeNumber = () => {
    toast({
      title: 'Coming soon',
      description: 'Phone number changes will be available in a future update.',
    })
  }

  const handleTestCall = () => {
    if (phoneNumber) {
      toast({
        title: 'Test your phone',
        description: `Call ${formatPhoneNumber(phoneNumber)} to test your AI assistant.`,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading phone settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PhoneIcon className="h-5 w-5" />
          Phone Number & Voice Agent
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business phone number and AI voice agent
        </p>
      </div>

      {/* Phone Number Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Phone Number</CardTitle>
              <CardDescription>
                {isPhoneNumberActive
                  ? 'Your business phone number for customer calls'
                  : 'No phone number configured'}
              </CardDescription>
            </div>
            {isPhoneNumberActive ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPhoneNumberActive && (
            <>
              {/* Phone Number Display */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your phone number</p>
                <p className="text-2xl font-bold">{formatPhoneNumber(phoneNumber!)}</p>
              </div>

              {/* Phone Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Activity className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VAPI Phone ID</span>
                  <span className="font-mono text-xs">{vapiPhoneNumberId || 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleTestCall}>
                  Test Call
                </Button>
                <Button variant="outline" onClick={handleChangeNumber} disabled>
                  Change Number
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Changing your phone number is a future enhancement
              </p>
            </>
          )}

          {!isPhoneNumberActive && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No phone number has been provisioned yet. Complete the onboarding
                process to set up your business phone number.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VAPI Agent Status Card */}
      {isPhoneNumberActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voice AI Agent</CardTitle>
            <CardDescription>
              Your AI assistant powered by VAPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agent Status</span>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VAPI Agent ID</span>
                <span className="font-mono text-xs">{vapiAgentId || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
              <p className="text-sm font-medium text-blue-900 mb-1">Agent Capabilities</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Answer customer calls 24/7</li>
                <li>Provide lawn care quotes</li>
                <li>Schedule appointments</li>
                <li>Capture lead information</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Incoming calls:</strong> When customers call your number, they'll
            be connected to your AI voice assistant powered by VAPI.
          </p>
          <p>
            <strong>Voice technology:</strong> Uses advanced speech-to-text (Deepgram)
            and text-to-speech (ElevenLabs) for natural conversations.
          </p>
          <p>
            <strong>Call handling:</strong> The AI can provide quotes, schedule
            appointments, and answer common questions about your services.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
