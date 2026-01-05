import { mcpClient } from '@/lib/mcp/client'
import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@/lib/prisma'

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
    const intent = JSON.parse(response.content as string)

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
      slots: Array<{ start: string; end: string }>
    }>(
      'calendar',
      'get_available_slots',
      {
        start_date: now.toISOString(),
        end_date: twoWeeksLater.toISOString(),
      }
    )

    if (availableSlots.slots.length === 0) {
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
    let selectedSlot = availableSlots.slots[0]

    if (intent.specific_datetime) {
      // Try to find slot matching specific datetime
      const preferredSlot = availableSlots.slots.find(
        (slot) => slot.start === intent.specific_datetime
      )
      if (preferredSlot) {
        selectedSlot = preferredSlot
      }
    } else if (intent.time_preference === 'morning') {
      // Find morning slot (before noon)
      const morningSlot = availableSlots.slots.find((slot) => {
        const hour = new Date(slot.start).getHours()
        return hour < 12
      })
      if (morningSlot) {
        selectedSlot = morningSlot
      }
    } else if (intent.time_preference === 'afternoon') {
      // Find afternoon slot (after noon)
      const afternoonSlot = availableSlots.slots.find((slot) => {
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
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        customer_name: state.customer_name || 'Customer',
        customer_phone: state.customer_phone || '',
        customer_address: state.customer_address
          ? `${state.customer_address.street}, ${state.customer_address.city}, ${state.customer_address.state} ${state.customer_address.zip}`
          : '',
        service_type: 'lawn_mowing',
        notes: state.quote
          ? `Quote: $${state.quote.price} per visit, ${state.quote.frequency}`
          : 'Initial consultation',
      }
    )

    // Save booking to database
    await prisma.bookings.create({
      data: {
        tenant_id: state.tenant_id,
        customer_phone: state.customer_phone || '',
        customer_name: state.customer_name || 'Customer',
        customer_address: state.customer_address
          ? `${state.customer_address.street}, ${state.customer_address.city}, ${state.customer_address.state} ${state.customer_address.zip}`
          : null,
        scheduled_at: new Date(booking.scheduled_time),
        service_type: 'lawn_mowing',
        status: 'scheduled',
        google_calendar_event_id: booking.event_id,
        quote_price: state.quote?.price || null,
        quote_frequency: state.quote?.frequency || null,
        property_lot_size_sqft: state.property_data?.lot_size_sqft || null,
        property_parcel_id: state.property_data?.parcel_id || null,
      },
    })

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
