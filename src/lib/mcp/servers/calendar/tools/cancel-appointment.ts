import { z } from 'zod'
import { google } from 'googleapis'
import { decrypt } from '@/lib/utils/encryption'
import { prisma } from '@/lib/prisma'

const cancelAppointmentSchema = z.object({
  tenant_id: z.string().uuid().describe('Tenant ID'),
  calendar_event_id: z.string().describe('Google Calendar event ID'),
})

export const cancelAppointmentTool = {
  name: 'cancel_appointment',
  description: 'Cancel an appointment in the calendar',
  input_schema: cancelAppointmentSchema,
  handler: async (input: z.infer<typeof cancelAppointmentSchema>) => {
    // Get calendar client
    const tenant = await prisma.tenants.findUnique({
      where: { id: input.tenant_id },
      select: {
        google_calendar_refresh_token: true,
        google_calendar_access_token: true,
        calendar_id: true,
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

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Delete the event
    await calendar.events.delete({
      calendarId: tenant.calendar_id!,
      eventId: input.calendar_event_id,
    })

    return {
      success: true,
      message: 'Appointment cancelled successfully',
    }
  },
}
