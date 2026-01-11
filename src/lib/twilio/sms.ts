/**
 * Twilio SMS Service
 *
 * Handles sending SMS notifications for:
 * - Customer booking confirmations
 * - Owner new lead alerts
 * - Owner booking notifications
 */

import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

/**
 * Get Twilio client instance
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment.')
  }

  return twilio(accountSid, authToken)
}

/**
 * Send SMS message
 *
 * @param params - SMS parameters
 * @returns Twilio message response
 */
export async function sendSMS(params: {
  to: string
  body: string
  tenantId: string
  callId?: string
  bookingId?: string
  template?: string
}) {
  const client = getTwilioClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured in environment')
  }

  try {
    console.log(`[SMS] Sending to ${params.to}: ${params.body}`)

    const message = await client.messages.create({
      to: params.to,
      from: fromNumber,
      body: params.body,
    })

    console.log(`[SMS] Message sent successfully: ${message.sid}`)
    console.log(`[SMS] Message status: ${message.status}`)
    console.log(`[SMS] Message details:`, {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      to: message.to,
      from: message.from,
    })

    // Log notification to database
    await prisma.notifications.create({
      data: {
        tenant_id: params.tenantId,
        call_id: params.callId || null,
        booking_id: params.bookingId || null,
        type: 'sms',
        template: params.template || null,
        recipient: params.to,
        body: params.body,
        status: 'sent',
        provider: 'twilio',
        provider_message_id: message.sid,
        sent_at: new Date(),
      },
    })

    return message
  } catch (error: any) {
    console.error('[SMS] Send error:', error)

    // Log failed notification
    await prisma.notifications.create({
      data: {
        tenant_id: params.tenantId,
        call_id: params.callId || null,
        booking_id: params.bookingId || null,
        type: 'sms',
        template: params.template || null,
        recipient: params.to,
        body: params.body,
        status: 'failed',
        provider: 'twilio',
        error_message: error.message || 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Send booking confirmation to customer
 */
export async function sendBookingConfirmation(params: {
  customerPhone: string
  customerName: string
  scheduledAt: Date
  tenantBusinessName: string
  tenantId: string
  bookingId: string
  callId?: string
}) {
  const formattedDate = params.scheduledAt.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const body = `Hi ${params.customerName}, your lawn mowing appointment with ${params.tenantBusinessName} is confirmed for ${formattedDate}. We'll see you then!`

  return await sendSMS({
    to: params.customerPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    callId: params.callId,
    template: 'booking_confirmation',
  })
}

/**
 * Send new lead alert to business owner
 */
export async function sendNewLeadAlert(params: {
  ownerPhone: string
  leadName: string
  leadAddress: string
  quote: number
  tenantId: string
  callId: string
  tenantBusinessName: string
}) {
  const body = `[${params.tenantBusinessName}] New lead: ${params.leadName} at ${params.leadAddress}. Quote: $${params.quote.toFixed(2)}. Check your dashboard for details.`

  return await sendSMS({
    to: params.ownerPhone,
    body,
    tenantId: params.tenantId,
    callId: params.callId,
    template: 'new_lead_alert',
  })
}

/**
 * Send new booking alert to business owner
 */
export async function sendNewBookingAlert(params: {
  ownerPhone: string
  customerName: string
  customerAddress: string
  scheduledAt: Date
  quote: number
  tenantId: string
  bookingId: string
  callId?: string
  tenantBusinessName: string
}) {
  const formattedDate = params.scheduledAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const body = `[${params.tenantBusinessName}] New booking: ${params.customerName} at ${params.customerAddress} on ${formattedDate}. Quote: $${params.quote.toFixed(2)}.`

  return await sendSMS({
    to: params.ownerPhone,
    body,
    tenantId: params.tenantId,
    bookingId: params.bookingId,
    callId: params.callId,
    template: 'new_booking_alert',
  })
}

/**
 * Send large lot custom quote alert to business owner
 */
export async function sendCustomQuoteAlert(params: {
  ownerPhone: string
  customerName: string
  customerPhone: string
  customerAddress: string
  lotSizeAcres: number
  tenantId: string
  callId: string
  tenantBusinessName: string
}) {
  const body = `[${params.tenantBusinessName}] Custom quote needed: ${params.customerName} (${params.customerPhone}) at ${params.customerAddress}. Lot size: ${params.lotSizeAcres} acres.`

  return await sendSMS({
    to: params.ownerPhone,
    body,
    tenantId: params.tenantId,
    callId: params.callId,
    template: 'custom_quote_alert',
  })
}
