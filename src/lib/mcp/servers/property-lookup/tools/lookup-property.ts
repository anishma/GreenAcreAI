import { z } from 'zod'
import { lookupProperty } from '../integrations/regrid-client'

const lookupPropertySchema = z.object({
  street: z.string().describe('Street address'),
  city: z.string().describe('City name'),
  state: z.string().length(2).describe('2-letter state code'),
  zip: z.string().length(5).describe('5-digit ZIP code'),
})

export const lookupPropertyTool = {
  name: 'lookup_property',
  description: 'Look up property lot size and details by address',
  input_schema: lookupPropertySchema,
  handler: async (input: z.infer<typeof lookupPropertySchema>) => {
    const result = await lookupProperty(input)
    return {
      lot_size_sqft: result.lot_size_sqft,
      parcel_id: result.parcel_id,
      address: result.address,
      zoning: result.zoning,
    }
  },
}
