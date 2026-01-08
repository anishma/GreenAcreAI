import { z } from 'zod'
import { bookAppointment } from '../integrations/google-calendar-client'

export const bookAppointmentTool = {
  name: 'book_appointment',
  description: 'Book an appointment in the calendar',
  input_schema: z.object({
    tenant_id: z.string().uuid().describe('Tenant ID'),
    start_time: z.string().describe('Appointment start time in ISO format'),
    end_time: z.string().optional().describe('Appointment end time in ISO format (optional, defaults to 1 hour after start)'),
    customer_name: z.string().describe('Customer name'),
    customer_phone: z.string().describe('Customer phone number'),
    property_address: z.string().describe('Property address'),
    estimated_price: z.number().describe('Estimated price for the service'),
    service_type: z.string().optional().describe('Type of service (e.g., lawn_mowing)'),
    notes: z.string().optional().describe('Additional notes to include in the calendar event'),
  }),
  handler: async (input: z.infer<typeof bookAppointmentTool.input_schema>) => {
    const result = await bookAppointment(input.tenant_id, {
      start_time: input.start_time,
      end_time: input.end_time,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      property_address: input.property_address,
      estimated_price: input.estimated_price,
      service_type: input.service_type,
      notes: input.notes,
    })

    return result
  },
}
