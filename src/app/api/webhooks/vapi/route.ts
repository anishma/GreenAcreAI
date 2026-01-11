import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type {
  VapiWebhookEvent,
  CallStartedEvent,
  CallEndedEvent,
  TranscriptUpdateEvent,
} from '@/lib/vapi/types'
import { sendNewLeadAlert, sendNewBookingAlert } from '@/lib/twilio/sms'
import { uploadRecording } from '@/lib/supabase/storage'

/**
 * VAPI Webhook Handler
 * Receives call events from VAPI and processes them
 *
 * Events handled:
 * - call-start: Call initiated
 * - end-of-call-report: Call ended with full transcript and recording
 * - transcript: Real-time transcript updates
 * - status-update: Call status changes
 */
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json()

    // Log the raw body structure to understand VAPI's format
    console.log(`[VAPI Webhook] Raw body keys:`, Object.keys(body))
    console.log(`[VAPI Webhook] Raw body sample:`, JSON.stringify(body).substring(0, 300))

    // VAPI sends different event formats:
    // 1. Top-level type (call-start, end-of-call-report, etc.): { type: "...", call: {...} }
    // 2. Message type (speech-update, etc.): { message: { type: "...", ... } }
    const eventType = body.type || body.message?.type || 'unknown'

    console.log(`[VAPI Webhook] Received event: ${eventType}`)

    // Verify webhook signature if available
    const signature = req.headers.get('x-vapi-signature')
    if (process.env.VAPI_WEBHOOK_SECRET && signature) {
      // TODO: Implement signature verification
      // For now, we'll trust the webhook in development
    }

    // Log all webhook events for debugging and audit
    await prisma.webhooks.create({
      data: {
        source: 'vapi',
        event_type: eventType,
        payload: body as any,
        headers: Object.fromEntries(req.headers.entries()),
        processed: false,
      },
    })

    // Cast to VapiWebhookEvent for type safety
    const event: VapiWebhookEvent = body

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'call-start':
        await handleCallStarted(event as CallStartedEvent)
        break

      case 'end-of-call-report':
        await handleCallEnded(event as CallEndedEvent)
        break

      case 'transcript':
        await handleTranscriptUpdate(event as TranscriptUpdateEvent)
        break

      case 'status-update':
        await handleStatusUpdate(event)
        break

      case 'speech-update':
        // Speech updates are informational only (when assistant starts/stops speaking)
        // We don't need to process these, just log them
        console.log(`[VAPI Webhook] Speech update: ${body.message?.status}`)
        break

      default:
        console.log(`[VAPI Webhook] Unhandled event type: ${eventType}`)
    }

    // Mark webhook as processed
    await prisma.webhooks.updateMany({
      where: {
        source: 'vapi',
        event_type: eventType,
        processed: false,
      },
      data: {
        processed: true,
        processed_at: new Date(),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[VAPI Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle call-start event
 * Creates a new call record in database
 */
async function handleCallStarted(event: CallStartedEvent) {
  // Log the full event structure for debugging
  console.log(`[VAPI Webhook] call-start event structure:`, JSON.stringify(event, null, 2).substring(0, 500))

  const { call } = event

  // Defensive check: Ensure call object exists
  if (!call || !call.id) {
    console.error(`[VAPI Webhook] Invalid call-start: missing call data`)
    console.error(`[VAPI Webhook] Event keys:`, Object.keys(event))
    console.error(`[VAPI Webhook] Call value:`, call)
    return
  }

  console.log(`[VAPI Webhook] Call started: ${call.id}`)

  // Find tenant by phone number
  const tenant = await prisma.tenants.findFirst({
    where: {
      OR: [
        { vapi_phone_number_id: call.phoneNumber?.id },
        { phone_number: call.phoneNumber?.number },
      ],
    },
  })

  if (!tenant) {
    console.error(
      `[VAPI Webhook] No tenant found for phone number: ${call.phoneNumber?.number}`
    )
    return
  }

  // Create call record
  await prisma.calls.create({
    data: {
      tenant_id: tenant.id,
      vapi_call_id: call.id,
      phone_number_called: call.phoneNumber?.number,
      caller_phone_number: call.customer?.number,
      started_at: call.startedAt ? new Date(call.startedAt) : new Date(),
      status: call.status,
      metadata: call as any,
      updated_at: new Date(),
    },
  })

  console.log(`[VAPI Webhook] Call record created for tenant: ${tenant.business_name}`)
}

/**
 * Handle end-of-call-report event
 * Updates call record with final data, transcript, recording, and cost
 */
async function handleCallEnded(event: CallEndedEvent) {
  // Log the full event structure for debugging
  console.log(`[VAPI Webhook] end-of-call-report event structure:`, JSON.stringify(event, null, 2).substring(0, 500))

  const { call } = event

  // Defensive check: Ensure call object exists
  if (!call || !call.id) {
    console.error(`[VAPI Webhook] Invalid end-of-call-report: missing call data`)
    console.error(`[VAPI Webhook] Event keys:`, Object.keys(event))
    console.error(`[VAPI Webhook] Call value:`, call)
    return
  }

  console.log(`[VAPI Webhook] Call ended: ${call.id}`)
  console.log(`[VAPI Webhook] End reason: ${call.endedReason}`)
  console.log(`[VAPI Webhook] Duration: ${call.startedAt && call.endedAt ?
    Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000) : 'unknown'} seconds`)

  // Find existing call record
  const existingCall = await prisma.calls.findFirst({
    where: { vapi_call_id: call.id },
    include: { tenants: true },
  })

  if (!existingCall) {
    console.error(`[VAPI Webhook] Call record not found: ${call.id}`)
    return
  }

  // Calculate duration
  const durationSeconds = call.startedAt && call.endedAt
    ? Math.round(
        (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
      )
    : null

  // Determine outcome based on transcript and end reason
  let outcome: string | null = null
  let quoteAmount: number | null = null
  let bookingMade = false
  let leadCaptured = false

  if (call.transcript) {
    // Check for booking indicators
    if (
      call.transcript.toLowerCase().includes('scheduled') ||
      call.transcript.toLowerCase().includes('appointment') ||
      call.transcript.toLowerCase().includes("you're all set")
    ) {
      bookingMade = true
      outcome = 'booking_made'
    }

    // Extract quote if mentioned
    const quoteMatch = call.transcript.match(/\$(\d+(?:\.\d{2})?)/g)
    if (quoteMatch && quoteMatch.length > 0) {
      leadCaptured = true
      // Get the last mentioned price (likely the final quote)
      const lastQuote = quoteMatch[quoteMatch.length - 1].replace('$', '')
      quoteAmount = parseFloat(lastQuote)
      if (!outcome) {
        outcome = 'quote_given'
      }
    }

    // Check for negative outcomes
    if (
      call.endedReason === 'customer-ended-call' &&
      !bookingMade &&
      !leadCaptured
    ) {
      outcome = 'no_interest'
    }
  }

  // If ended due to error
  if (call.endedReason?.includes('error')) {
    outcome = 'error'
  }

  // Update call record
  await prisma.calls.update({
    where: { id: existingCall.id },
    data: {
      ended_at: call.endedAt ? new Date(call.endedAt) : new Date(),
      duration_seconds: durationSeconds,
      status: 'ended',
      end_reason: call.endedReason,
      transcript: (call.messages as any) || undefined,
      transcript_text: call.transcript,
      summary: call.summary,
      outcome,
      quote_amount: quoteAmount,
      booking_made: bookingMade,
      lead_captured: leadCaptured,
      recording_url: call.recordingUrl,
      cost_total: call.cost,
      cost_breakdown: call.costBreakdown as any,
      metadata: call as any,
      updated_at: new Date(),
    },
  })

  console.log(`[VAPI Webhook] Call updated: ${call.id}`)
  console.log(`[VAPI Webhook] Outcome: ${outcome}`)
  console.log(`[VAPI Webhook] Booking made: ${bookingMade}`)
  console.log(`[VAPI Webhook] Lead captured: ${leadCaptured}`)

  // Upload recording to Supabase Storage if available
  if (call.recordingUrl) {
    try {
      console.log(`[VAPI Webhook] Uploading recording to Supabase`)
      const signedUrl = await uploadRecording(
        existingCall.tenant_id,
        call.id,
        call.recordingUrl
      )

      // Update call record with Supabase storage URL
      await prisma.calls.update({
        where: { id: existingCall.id },
        data: {
          recording_url: signedUrl,
          updated_at: new Date(),
        },
      })

      console.log(`[VAPI Webhook] Recording uploaded successfully`)
    } catch (uploadError) {
      console.error(`[VAPI Webhook] Failed to upload recording:`, uploadError)
      // Don't fail the webhook if recording upload fails
      // Keep the original VAPI recording URL
    }
  }

  // Send SMS notifications to owner if enabled
  await sendOwnerNotifications({
    call,
    tenant: existingCall.tenants,
    bookingMade,
    leadCaptured,
    quoteAmount,
  })
}

/**
 * Send SMS notifications to business owner
 */
async function sendOwnerNotifications(params: {
  call: any
  tenant: any
  bookingMade: boolean
  leadCaptured: boolean
  quoteAmount: number | null
}) {
  const { call, tenant, bookingMade, leadCaptured, quoteAmount } = params

  // Check if owner has phone number
  if (!tenant.phone) {
    console.log('[VAPI Webhook] Owner phone not configured, skipping SMS notifications')
    return
  }

  // Parse notification preferences
  const notificationPrefs = tenant.notification_preferences as any || {}

  try {
    // Send booking notification
    if (bookingMade && notificationPrefs.sms_new_booking !== false) {
      console.log('[VAPI Webhook] Sending new booking SMS to owner')

      // Find the booking record that was created
      const booking = await prisma.bookings.findFirst({
        where: {
          tenant_id: tenant.id,
          call_id: call.id,
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      if (booking) {
        await sendNewBookingAlert({
          ownerPhone: tenant.phone,
          customerName: booking.customer_name || 'Customer',
          customerAddress: booking.property_address || 'Address not provided',
          scheduledAt: booking.scheduled_at,
          quote: parseFloat(booking.estimated_price?.toString() || '0'),
          tenantId: tenant.id,
          bookingId: booking.id,
          callId: call.id,
          tenantBusinessName: tenant.business_name,
        })
        console.log('[VAPI Webhook] Booking SMS sent successfully')
      }
    }

    // Send lead notification (if no booking was made)
    if (leadCaptured && !bookingMade && notificationPrefs.sms_new_lead !== false) {
      console.log('[VAPI Webhook] Sending new lead SMS to owner')

      // Find the lead record
      const lead = await prisma.leads.findFirst({
        where: {
          tenant_id: tenant.id,
          call_id: call.id,
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      if (lead && quoteAmount) {
        const address = lead.address || `${lead.city || ''}, ${lead.state || ''}`.trim() || 'Address not provided'

        await sendNewLeadAlert({
          ownerPhone: tenant.phone,
          leadName: lead.name || 'Customer',
          leadAddress: address,
          quote: quoteAmount,
          tenantId: tenant.id,
          callId: call.id,
          tenantBusinessName: tenant.business_name,
        })
        console.log('[VAPI Webhook] Lead SMS sent successfully')
      }
    }
  } catch (error) {
    console.error('[VAPI Webhook] Error sending SMS notifications:', error)
    // Don't throw - we don't want to fail the webhook if SMS fails
  }
}

/**
 * Handle transcript update event
 * Updates call transcript in real-time (optional, for live monitoring)
 */
async function handleTranscriptUpdate(_event: TranscriptUpdateEvent) {
  // For MVP, we'll skip real-time transcript updates
  // and rely on the final transcript in end-of-call-report
  console.log(`[VAPI Webhook] Transcript update received (skipping real-time update)`)
}

/**
 * Handle status update event
 * Updates call status (ringing, in-progress, etc.)
 */
async function handleStatusUpdate(event: VapiWebhookEvent) {
  const callId = (event as any).call?.id
  const status = (event as any).status

  if (!callId || !status) {
    return
  }

  await prisma.calls.updateMany({
    where: { vapi_call_id: callId },
    data: {
      status,
      updated_at: new Date(),
    },
  })

  console.log(`[VAPI Webhook] Call ${callId} status updated to: ${status}`)
}
