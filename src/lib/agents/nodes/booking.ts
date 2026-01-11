// Use serverless-compatible MCP client in production (Vercel), regular MCP client in development
import { mcpClient as mcpClientServerless } from '@/lib/mcp/client-serverless'
import { mcpClient as mcpClientStdio } from '@/lib/mcp/client'
import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmation } from '@/lib/twilio/sms'
import { toZonedTime, format } from 'date-fns-tz'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

// Runtime function to select appropriate client based on environment
function getMcpClient() {
  // Vercel sets multiple env vars, check for any of them
  const isVercel = process.env.VERCEL === '1' ||
                   process.env.VERCEL_ENV !== undefined ||
                   process.env.NEXT_RUNTIME === 'edge' ||
                   process.env.VERCEL_URL !== undefined

  console.log('[Booking] Environment check:', {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    isVercel
  })

  return isVercel ? mcpClientServerless : mcpClientStdio
}

export async function bookingNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  console.log('[Booking Node] Called with stage:', state.stage)
  console.log('[Booking Node] Existing booking:', state.booking)

  // CRITICAL: Prevent duplicate bookings
  // If a booking already exists in state, don't create another one
  if (state.booking) {
    console.log('[Booking Node] Booking already exists, skipping to closing')
    return {
      stage: 'closing',
      messages: [{
          role: 'assistant',
          content: 'Your appointment has already been scheduled.',
        },
      ],
    }
  }

  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    return {
      messages: [{
          role: 'assistant',
          content: 'Would you like to schedule an appointment?',
        },
      ],
    }
  }

  // Use GPT-4 to detect booking intent and extract time preference
  const isChoosingTimeSlot = state.stage === 'WAITING_FOR_TIME_SLOT'

  // Get current date/year to provide context to LLM
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentDate = format(now, 'EEEE, MMMM d, yyyy', { timeZone: 'America/Chicago' })

  const intentPrompt = isChoosingTimeSlot
    ? `Analyze the user's message to determine which time slot they're choosing.

Today's date: ${currentDate}
Current year: ${currentYear}

User message: "${lastUserMessage.content}"

IMPORTANT: If the user mentions a date without specifying a year, assume they mean ${currentYear}.

Return ONLY valid JSON with this structure:
{
  "wants_to_book": true,
  "time_preference": "morning"/"afternoon"/"specific time" or null,
  "specific_datetime": "YYYY-MM-DD HH:mm" or null,
  "declined": false
}

Examples:
- If user says "January 13th at 1 PM" and current year is ${currentYear}, return "specific_datetime": "${currentYear}-01-13 13:00"
- If user says "Tuesday at 2pm" and current year is ${currentYear}, extract the date as ${currentYear}-MM-DD based on context
- If user says "the first one" or "morning", set "time_preference" accordingly and leave "specific_datetime" as null`
    : `Analyze the user's message to determine their intent regarding booking an appointment.

Today's date: ${currentDate}
Current year: ${currentYear}

User message: "${lastUserMessage.content}"

IMPORTANT: If the user mentions a date without specifying a year, assume they mean ${currentYear}.

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

    console.log('[Booking Node] Intent detected:', JSON.stringify(intent))
    console.log('[Booking Node] User message:', lastUserMessage.content)

    // User declined booking
    if (intent.declined || !intent.wants_to_book) {
      return {
        stage: 'closing',
        messages: [{
            role: 'assistant',
            content: "No problem! Feel free to call us back anytime you're ready to schedule. Thanks for your interest!",
          },
        ],
      }
    }

    // User wants to book - get available slots
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Call MCP calendar server via MCP client (select at runtime)
    const mcpClient = getMcpClient()
    console.log('[Booking] Using client:', mcpClient.constructor.name)

    const availableSlots = await mcpClient.callTool<{
      available_slots: Array<{ start: string; end: string }>
      timezone: string
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
        messages: [{
            role: 'assistant',
            content: "I'm sorry, we don't have any available appointments in the next two weeks. Would you like me to have someone call you back to schedule further out?",
          },
        ],
      }
    }

    // Get tenant's timezone from the MCP response
    const tenantTimezone = availableSlots.timezone || 'America/Chicago'

    // Check if user already chose a time slot (has chosen_time in state)
    // If not, present available slots and ask them to choose
    if (!state.chosen_time && !intent.specific_datetime && !intent.time_preference) {
      // Format available slots for presentation IN THE TENANT'S TIMEZONE
      const slotOptions = availableSlots.available_slots.slice(0, 3).map((slot) => {
        // Convert UTC time to tenant's local timezone
        const utcDate = new Date(slot.start)
        const zonedDate = toZonedTime(utcDate, tenantTimezone)

        const dateString = format(zonedDate, 'EEEE, MMMM d', { timeZone: tenantTimezone })
        const timeString = format(zonedDate, 'h:mm a', { timeZone: tenantTimezone })

        return `${dateString} at ${timeString}`
      }).join(', or ')

      return {
        stage: 'WAITING_FOR_TIME_SLOT',
        messages: [{
            role: 'assistant',
            content: `Great! I have these available times: ${slotOptions}. Which works best for you?`,
          },
        ],
      }
    }

    // User has provided time preference or already chose - find matching slot
    let selectedSlot = availableSlots.available_slots[0]

    console.log('[Booking Node] Selecting slot from', availableSlots.available_slots.length, 'available slots')
    console.log('[Booking Node] Intent specific_datetime:', intent.specific_datetime)
    console.log('[Booking Node] Intent time_preference:', intent.time_preference)
    console.log('[Booking Node] State chosen_time:', state.chosen_time)

    if (intent.specific_datetime) {
      // Parse the user's requested time (e.g., "2024-01-12 15:00" = 3 PM)
      // Extract hour and date from the user's request
      const requestedTimeStr = intent.specific_datetime.trim()
      let requestedHour: number | null = null
      let requestedDate: string | null = null

      // Extract date first (YYYY-MM-DD format)
      const dateMatch = requestedTimeStr.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        requestedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
        console.log('[Booking Node] Extracted date from intent:', requestedDate)
      }

      // Extract hour - MUST come after date and have time separator
      // Match patterns like "15:00", " 15:00", "15:30" but NOT "2024" or "01-30"
      // Look for hour after a space or at the end of date string
      const hourMatch = requestedTimeStr.match(/[T\s](\d{1,2}):(\d{2})/)
      if (hourMatch) {
        requestedHour = parseInt(hourMatch[1])
        console.log('[Booking Node] Extracted hour from intent:', requestedHour)
      } else {
        // If no time specified, user only gave a date
        // We should ask for time or default to first available on that date
        console.log('[Booking Node] No time specified in intent, only date:', requestedDate)
      }

      // Find slot matching the date and/or hour in the tenant's timezone
      if (requestedHour !== null) {
        // User specified both date and time - match both
        const matchingSlot = availableSlots.available_slots.find((slot) => {
          const utcDate = new Date(slot.start)
          const zonedDate = toZonedTime(utcDate, tenantTimezone)
          const slotHour = zonedDate.getHours()
          const slotDate = format(zonedDate, 'yyyy-MM-dd', { timeZone: tenantTimezone })

          console.log(`[Booking Node] Checking slot: ${slot.start} -> ${slotDate} ${slotHour}:00 in ${tenantTimezone}`)

          // Match by hour (and optionally date if specified)
          const hourMatches = slotHour === requestedHour
          const dateMatches = !requestedDate || slotDate === requestedDate

          return hourMatches && dateMatches
        })

        if (matchingSlot) {
          selectedSlot = matchingSlot
          console.log('[Booking Node] Selected slot by matching hour and date:', selectedSlot.start)
        } else {
          console.warn('[Booking Node] No slot found matching hour', requestedHour, 'and date', requestedDate, '- using first available')
        }
      } else if (requestedDate) {
        // User only specified date, no time - use first available slot on that date
        const matchingSlot = availableSlots.available_slots.find((slot) => {
          const utcDate = new Date(slot.start)
          const zonedDate = toZonedTime(utcDate, tenantTimezone)
          const slotDate = format(zonedDate, 'yyyy-MM-dd', { timeZone: tenantTimezone })

          console.log(`[Booking Node] Checking slot for date match: ${slot.start} -> ${slotDate} in ${tenantTimezone}`)

          return slotDate === requestedDate
        })

        if (matchingSlot) {
          selectedSlot = matchingSlot
          console.log('[Booking Node] Selected first available slot on requested date:', selectedSlot.start)
        } else {
          console.warn('[Booking Node] No slot found on date', requestedDate, '- using first available overall')
        }
      }
    } else if (intent.time_preference === 'morning') {
      // Find morning slot (before noon in tenant's timezone)
      const morningSlot = availableSlots.available_slots.find((slot) => {
        const utcDate = new Date(slot.start)
        const zonedDate = toZonedTime(utcDate, tenantTimezone)
        const hour = zonedDate.getHours()
        return hour < 12
      })
      if (morningSlot) {
        selectedSlot = morningSlot
        console.log('[Booking Node] Selected morning slot:', selectedSlot.start)
      }
    } else if (intent.time_preference === 'afternoon') {
      // Find afternoon slot (after noon in tenant's timezone)
      const afternoonSlot = availableSlots.available_slots.find((slot) => {
        const utcDate = new Date(slot.start)
        const zonedDate = toZonedTime(utcDate, tenantTimezone)
        const hour = zonedDate.getHours()
        return hour >= 12
      })
      if (afternoonSlot) {
        selectedSlot = afternoonSlot
        console.log('[Booking Node] Selected afternoon slot:', selectedSlot.start)
      }
    } else if (state.chosen_time) {
      // Find the slot matching the chosen time from previous interaction
      const chosenSlot = availableSlots.available_slots.find(
        (slot) => slot.start === state.chosen_time
      )
      if (chosenSlot) {
        selectedSlot = chosenSlot
        console.log('[Booking Node] Selected slot from state.chosen_time:', selectedSlot.start)
      }
    }

    console.log('[Booking Node] Final selected slot:', selectedSlot.start)
    console.log('[Booking Node] Booking appointment now...')

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
    // Note: state.call_id contains VAPI's call ID, but bookings.call_id references our database calls.id
    // Look up the call record by vapi_call_id to get the database ID
    let databaseCallId: string | null = null
    if (state.call_id) {
      const callRecord = await prisma.calls.findUnique({
        where: { vapi_call_id: state.call_id },
        select: { id: true }
      })
      databaseCallId = callRecord?.id || null

      if (!callRecord) {
        console.warn(`[Booking] Call record not found for vapi_call_id: ${state.call_id}`)
      }

      // CRITICAL: Check if booking already exists for this call
      // This prevents duplicate bookings if the node is called multiple times
      if (databaseCallId) {
        const existingBooking = await prisma.bookings.findFirst({
          where: { call_id: databaseCallId },
          select: { id: true, scheduled_at: true }
        })

        if (existingBooking) {
          console.warn(`[Booking] Booking already exists for call ${databaseCallId}, skipping duplicate`)
          // Return the existing booking info
          return {
            booking: {
              scheduled_at: existingBooking.scheduled_at.toISOString(),
              calendar_event_id: booking.event_id,
            },
            chosen_time: existingBooking.scheduled_at.toISOString(),
            stage: 'closing',
            messages: [{
                role: 'assistant',
                content: 'Your appointment has already been scheduled.',
              },
            ],
          }
        }
      }
    }

    console.log('[Booking Node] Creating booking record in database...')
    const bookingRecord = await prisma.bookings.create({
      data: {
        tenant_id: state.tenant_id,
        call_id: databaseCallId, // Use our database call.id, not VAPI's call ID
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
            tenantTimezone: tenantTimezone,  // Pass tenant timezone for SMS formatting
            // callId omitted - state.call_id is VAPI's ID, not our database ID
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

    // Format the scheduled time nicely IN THE TENANT'S TIMEZONE
    const scheduledUtcDate = new Date(booking.scheduled_time)
    const scheduledZonedDate = toZonedTime(scheduledUtcDate, tenantTimezone)

    const dateString = format(scheduledZonedDate, 'EEEE, MMMM d', { timeZone: tenantTimezone })
    const timeString = format(scheduledZonedDate, 'h:mm a', { timeZone: tenantTimezone })

    return {
      booking: {
        scheduled_at: booking.scheduled_time,
        calendar_event_id: booking.event_id,
      },
      chosen_time: booking.scheduled_time,
      stage: 'closing',
      messages: [{
          role: 'assistant',
          content: `Perfect! I've scheduled your appointment for ${dateString} at ${timeString}. You'll receive a confirmation text message shortly.`,
        },
      ],
    }
  } catch (error) {
    console.error('Booking error:', error)
    return {
      messages: [{
          role: 'assistant',
          content: "I'm having trouble scheduling the appointment right now. Could you please call us back or visit our website to book?",
        },
      ],
      stage: 'closing',
    }
  }
}
