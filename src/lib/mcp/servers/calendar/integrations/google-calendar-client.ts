import { google } from 'googleapis'
import { decrypt } from '@/lib/utils/encryption'
import { prisma } from '@/lib/prisma'

export async function getCalendarClient(tenantId: string) {
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: {
      google_calendar_refresh_token: true,
      google_calendar_access_token: true,
      google_calendar_token_expires_at: true,
      calendar_id: true,
      timezone: true,
    },
  })

  if (!tenant?.google_calendar_refresh_token) {
    throw new Error('Calendar not connected')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: decrypt(tenant.google_calendar_refresh_token),
    access_token: tenant.google_calendar_access_token || undefined,
  })

  // Auto-refresh tokens
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.tenants.update({
        where: { id: tenantId },
        data: { google_calendar_access_token: tokens.access_token },
      })
    }
  })

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    calendarId: tenant.calendar_id,
    timezone: tenant.timezone || 'America/New_York',
  }
}

export async function getAvailableSlots(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const { calendar, calendarId } = await getCalendarClient(tenantId)

  // Fetch busy times
  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId! }],
    },
  })

  const busySlots = data.calendars?.[calendarId!]?.busy || []

  // Generate available slots (9am-5pm, 1-hour blocks, excluding busy times)
  const availableSlots: { start: string; end: string }[] = []

  // Iterate through each day in the range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Generate hourly slots from 9am to 5pm
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)

        const slotEnd = new Date(currentDate)
        slotEnd.setHours(hour + 1, 0, 0, 0)

        // Check if this slot overlaps with any busy time
        const isAvailable = !busySlots.some((busy) => {
          const busyStart = new Date(busy.start!)
          const busyEnd = new Date(busy.end!)
          return (
            (slotStart >= busyStart && slotStart < busyEnd) ||
            (slotEnd > busyStart && slotEnd <= busyEnd) ||
            (slotStart <= busyStart && slotEnd >= busyEnd)
          )
        })

        if (isAvailable) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          })
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return { available_slots: availableSlots }
}

export async function bookAppointment(
  tenantId: string,
  booking: {
    start_time: string
    end_time?: string
    customer_name: string
    customer_phone: string
    property_address: string
    estimated_price: number
    service_type?: string
    notes?: string
  }
) {
  const { calendar, calendarId, timezone: _timezone } = await getCalendarClient(tenantId)

  // Calculate end time: use provided end_time or default to 1 hour after start
  const endTime = booking.end_time || new Date(new Date(booking.start_time).getTime() + 60 * 60 * 1000).toISOString()

  // Build description with all available info
  let description = `Address: ${booking.property_address}\nPhone: ${booking.customer_phone}\nEstimated: $${booking.estimated_price}`

  if (booking.service_type) {
    description += `\nService: ${booking.service_type}`
  }

  if (booking.notes) {
    description += `\n\n${booking.notes}`
  }

  const event = await calendar.events.insert({
    calendarId: calendarId!,
    requestBody: {
      summary: `${booking.service_type || 'Lawn Mowing'} - ${booking.customer_name}`,
      description: description,
      start: {
        dateTime: booking.start_time,
        timeZone: _timezone,
      },
      end: {
        dateTime: endTime,
        timeZone: _timezone,
      },
    },
  })

  // Generate calendar link
  const calendarLink = event.data.htmlLink || `https://calendar.google.com/calendar/event?eid=${event.data.id}`

  return {
    event_id: event.data.id!,
    scheduled_time: booking.start_time,
    calendar_link: calendarLink,
  }
}
