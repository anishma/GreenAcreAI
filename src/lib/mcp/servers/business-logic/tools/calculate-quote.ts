import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const calculateQuoteTool = {
  name: 'calculate_quote',
  description: 'Calculate pricing quote based on lot size and tenant pricing tiers',
  input_schema: z.object({
    tenant_id: z.string().uuid(),
    lot_size_sqft: z.number().int().positive(),
    frequency: z.enum(['weekly', 'biweekly']).default('weekly'),
  }),
  handler: async (input: z.infer<typeof calculateQuoteTool.input_schema>) => {
    // Use database function get_quote_for_lot_size
    const result: any = await prisma.$queryRaw`
      SELECT * FROM get_quote_for_lot_size(
        ${input.tenant_id}::uuid,
        ${input.lot_size_sqft}::integer,
        ${input.frequency}::varchar
      )
    `

    if (!result || result.length === 0) {
      throw new Error('No pricing tier found for lot size')
    }

    const quote = result[0]
    return {
      price: input.frequency === 'weekly' ? quote.weekly_price : quote.biweekly_price,
      frequency: input.frequency,
      service_inclusions: quote.service_inclusions,
      pricing_type: quote.pricing_type,
      tier_range: `${quote.tier_min_sqft}-${quote.tier_max_sqft} sqft`,
    }
  },
}
