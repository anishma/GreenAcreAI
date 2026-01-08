import { mcpClient } from '@/lib/mcp/client'
import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmation } from '@/lib/twilio/sms'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

export async function bookingNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: 'Would you like to schedule an appointment?',
        },
      ],
    }
  }

  // Use GPT-4 to detect booking intent and extract time preference
  const intentPrompt = `Analyze the user's message to determine their intent regarding booking an appointment.

User message: "${lastUserMessage.content}"

Return ONLY valid JSON with this structure:
{
  "wants_to_book": true/false,
  "time_preference": "morning"/"afternoon"/"specific time" or null,
  "specific_datetime": "YYYY-MM-DD HH:mm" or null,
  "declined": true/false
}`

  try {
    const response = await llm.invoke(intentPrompt)

    // Clean up response - remove markdown code blocks if present
    let jsonString = (response.content as string).trim()
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const intent = JSON.parse(jsonString)

    // User declined booking
    if (intent.declined || !intent.wants_to_book) {
      return {
        stage: 'closing',
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: "No problem! Feel free to call us back anytime you're ready to schedule. Thanks for your interest!",
          },
        ],
      }
    }

    // User wants to book - get available slots
    const now = new Date()
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const availableSlots = await mcpClient.callTool<{
      available_slots: Array<{ start: string; end: string }>
    }>(
      'calendar',
      'get_available_slots',
      {
        tenant_id: state.tenant_id,
        start_date: now.toISOString(),
        end_date: twoWeeksLater.toISOString(),
      }
    )

    if (availableSlots.available_slots.length === 0) {
      return {
        stage: 'closing',
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: "I'm sorry, we don't have any available appointments in the next two weeks. Would you like me to have someone call you back to schedule further out?",
          },
        ],
      }
    }

    // If user provided specific time preference, try to match it
    let selectedSlot = availableSlots.available_slots[0]

    if (intent.specific_datetime) {
      // Try to find slot matching specific datetime
      const preferredSlot = availableSlots.available_slots.find(
        (slot) => slot.start === intent.specific_datetime
      )
      if (preferredSlot) {
        selectedSlot = preferredSlot
      }
    } else if (intent.time_preference === 'morning') {
      // Find morning slot (before noon)
      const morningSlot = availableSlots.available_slots.find((slot) => {
        const hour = new Date(slot.start).getHours()
        return hour < 12
      })
      if (morningSlot) {
        selectedSlot = morningSlot
      }
    } else if (intent.time_preference === 'afternoon') {
      // Find afternoon slot (after noon)
      const afternoonSlot = availableSlots.available_slots.find((slot) => {
        const hour = new Date(slot.start).getHours()
        return hour >= 12
      })
      if (afternoonSlot) {
        selectedSlot = afternoonSlot
      }
    }

    // Book the appointment
    const booking = await mcpClient.callTool<{
      event_id: string
      scheduled_time: string
      calendar_link: string
    }>(
      'calendar',
      'book_appointment',
      {
        tenant_id: state.tenant_id,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        customer_name: state.customer_name || 'Customer',
        customer_phone: state.customer_phone || '',
        property_address: state.customer_address
          ? `${state.customer_address.street}, ${state.customer_address.city}, ${state.customer_address.state} ${state.customer_address.zip}`
          : '',
        estimated_price: state.quote?.price || 0,
        service_type: 'lawn_mowing',
        notes: state.quote
          ? `Quote: $${state.quote.price} per visit, ${state.preferred_frequency || state.quote.frequency} frequency`
          : 'Initial consultation',
      }
    )

    // Save booking to database
    const bookingRecord = await prisma.bookings.create({
      data: {
        tenant_id: state.tenant_id,
        call_id: state.call_id,
        updated_at: new Date(),
        customer_phone: state.customer_phone || '',
        customer_name: state.customer_name || 'Customer',
        property_address: state.customer_address
          ? `${state.customer_address.street}`
          : null,
        property_city: state.customer_address?.city || null,
        property_state: state.customer_address?.state || null,
        property_zip: state.customer_address?.zip || null,
        scheduled_at: new Date(booking.scheduled_time),
        service_type: 'lawn_mowing',
        status: 'confirmed',
        google_calendar_event_id: booking.event_id,
        estimated_price: state.quote?.price || null,
        notes: state.quote
          ? `${state.preferred_frequency || state.quote.frequency} service - $${state.quote.price} per visit. Property: ${state.property_data?.lot_size_sqft} sqft${state.property_data?.parcel_id ? `, Parcel: ${state.property_data.parcel_id}` : ''}`
          : null,
      },
    })

    // Send booking confirmation SMS to customer
    if (state.customer_phone) {
      try {
        const tenant = await prisma.tenants.findUnique({
          where: { id: state.tenant_id },
        })

        if (tenant) {
          await sendBookingConfirmation({
            customerPhone: state.customer_phone,
            customerName: state.customer_name || 'Customer',
            scheduledAt: new Date(booking.scheduled_time),
            tenantBusinessName: tenant.business_name,
            tenantId: state.tenant_id,
            bookingId: bookingRecord.id,
            callId: state.call_id,
          })

          // Mark confirmation as sent
          await prisma.bookings.update({
            where: { id: bookingRecord.id },
            data: { confirmation_sent: true },
          })

          console.log('[Booking Node] SMS confirmation sent to customer')
        }
      } catch (smsError) {
        console.error('[Booking Node] Failed to send SMS confirmation:', smsError)
        // Don't fail the booking if SMS fails
      }
    }

    // Format the scheduled time nicely
    const scheduledDate = new Date(booking.scheduled_time)
    const dateString = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    const timeString = scheduledDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return {
      booking: {
        scheduled_at: booking.scheduled_time,
        calendar_event_id: booking.event_id,
      },
      chosen_time: booking.scheduled_time,
      stage: 'closing',
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: `Perfect! I've scheduled your appointment for ${dateString} at ${timeString}. You'll receive a confirmation text message shortly. Is there anything else I can help you with?`,
        },
      ],
    }
  } catch (error) {
    console.error('Booking error:', error)
    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: "I'm having trouble scheduling the appointment right now. Could you please call us back or visit our website to book?",
        },
      ],
      stage: 'closing',
    }
  }
}
