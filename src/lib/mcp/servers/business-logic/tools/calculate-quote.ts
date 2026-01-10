import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const calculateQuoteSchema = z.object({
  tenant_id: z.string().uuid(),
  lot_size_sqft: z.number().int().positive(),
  frequency: z.enum(['weekly', 'biweekly']).default('weekly'),
})

export const calculateQuoteTool = {
  name: 'calculate_quote',
  description: 'Calculate pricing quote based on lot size and tenant pricing tiers',
  input_schema: calculateQuoteSchema,
  handler: async (input: z.infer<typeof calculateQuoteSchema>) => {
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

    // Convert DECIMAL to number (Prisma returns Decimal as string)
    const weeklyPrice = typeof quote.weekly_price === 'string'
      ? parseFloat(quote.weekly_price)
      : Number(quote.weekly_price)
    const biweeklyPrice = typeof quote.biweekly_price === 'string'
      ? parseFloat(quote.biweekly_price)
      : Number(quote.biweekly_price)

    return {
      price_per_visit: input.frequency === 'weekly' ? weeklyPrice : biweeklyPrice,
      frequency: input.frequency,
      service_inclusions: quote.service_inclusions,
      tier_name: quote.pricing_type || 'standard',
    }
  },
}
