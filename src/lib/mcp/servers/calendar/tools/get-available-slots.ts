import { z } from 'zod'
import { getAvailableSlots } from '../integrations/google-calendar-client'

const getAvailableSlotsSchema = z.object({
  tenant_id: z.string().uuid().describe('Tenant ID'),
  start_date: z.string().describe('Start date in ISO format'),
  end_date: z.string().describe('End date in ISO format'),
})

export const getAvailableSlotsTool = {
  name: 'get_available_slots',
  description: 'Get available appointment slots from the calendar',
  input_schema: getAvailableSlotsSchema,
  handler: async (input: z.infer<typeof getAvailableSlotsSchema>) => {
    const startDate = new Date(input.start_date)
    const endDate = new Date(input.end_date)

    const result = await getAvailableSlots(input.tenant_id, startDate, endDate)

    return result
  },
}
