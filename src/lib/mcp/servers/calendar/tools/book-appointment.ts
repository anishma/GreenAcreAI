import { z } from 'zod'
import { bookAppointment } from '../integrations/google-calendar-client'

export const bookAppointmentTool = {
  name: 'book_appointment',
  description: 'Book an appointment in the calendar',
  input_schema: z.object({
    tenant_id: z.string().uuid().describe('Tenant ID'),
    start_time: z.string().describe('Appointment start time in ISO format'),
    customer_name: z.string().describe('Customer name'),
    customer_phone: z.string().describe('Customer phone number'),
    property_address: z.string().describe('Property address'),
    estimated_price: z.number().describe('Estimated price for the service'),
  }),
  handler: async (input: z.infer<typeof bookAppointmentTool.input_schema>) => {
    const result = await bookAppointment(input.tenant_id, {
      start_time: input.start_time,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      property_address: input.property_address,
      estimated_price: input.estimated_price,
    })

    return result
  },
}
