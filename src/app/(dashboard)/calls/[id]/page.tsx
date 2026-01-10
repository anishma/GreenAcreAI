'use client'

/**
 * Call Detail Page
 * Shows full call details, transcript, and recording
 */

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Clock, DollarSign, MapPin, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { AudioPlayer } from '@/components/dashboard/audio-player'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export default function CallDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { data: call, isLoading } = trpc.call.getById.useQuery({ id: params.id })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <Phone className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">Call Not Found</h2>
        <p className="text-muted-foreground mb-4">The call you're looking for doesn't exist</p>
        <Button onClick={() => router.push('/dashboard/calls')}>
          Back to Calls
        </Button>
      </div>
    )
  }

  // Parse transcript messages if available
  const transcript = call.transcript as any[] | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Call Details</h2>
          <p className="text-muted-foreground mt-1">
            {call.created_at && format(new Date(call.created_at), 'PPpp')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/calls')}>
          Back to Calls
        </Button>
      </div>

      {/* Call Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Caller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {call.caller_phone_number || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {call.duration_seconds
                  ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {call.quote_amount
                  ? `$${parseFloat(call.quote_amount.toString()).toFixed(2)}`
                  : 'No quote'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outcome
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`font-medium ${
              call.booking_made ? 'text-green-600' :
              call.lead_captured ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {call.booking_made ? '✓ Booking Made' :
               call.lead_captured ? '✓ Lead Captured' :
               call.outcome === 'error' ? '✗ Error' :
               call.outcome === 'no_interest' ? 'No Interest' :
               'Completed'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recording */}
      {call.recording_url && (
        <Card>
          <CardHeader>
            <CardTitle>Call Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioPlayer src={call.recording_url} />
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {transcript && transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transcript.map((message: any, index: number) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.role === 'user' ? 'Customer' : 'Assistant'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.message || message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Transcript Fallback */}
      {!transcript && call.transcript_text && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">{call.transcript_text}</div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {call.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{call.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
